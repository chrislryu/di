# Dynamo internals preparation

Inspected locally at the pinned Dynamo commit in `src/data/sources.json`.
These are authoring notes, not a claim of runtime certification. No source or GPU
tests were executed. Paths below are relative to `references/dynamo/`.

## Exact frontend pipeline

The Python vLLM adapter is not the HTTP frontend implementation. Begin at
`lib/llm/src/entrypoint/input/http.rs`: its dynamic `EngineConfig` branch constructs
the HTTP service and calls `run_watcher`. That function constructs `ModelWatcher`,
subscribes with `runtime.discovery().list_and_watch(DiscoveryQuery::AllModels, ...)`,
and drives model availability updates. Discovery/model installation and request
execution are different lifecycles.

`lib/llm/src/discovery/watcher.rs` calls
`build_preprocessed_routing_with_session_affinity_mode` and constructs chat and
completion engines with `PreprocessedRouting::build_pipeline`. For concrete
assembly read `lib/llm/src/entrypoint/input/common.rs`:

- `build_preprocessed_routing_with_session_affinity_mode` sets the routing host and
  optional prefill/encoder operators.
- `PreprocessedRouting::build_pipeline` creates the source, preprocessor, token
  backend, migration operator, encoder operator, prefill operator, and service backend.
- Forward path: source → preprocessing → migration → token backend → encoder routing
  → prefill routing → backend engine.
- Return path crosses prefill, encoder, token backend, migration, and preprocessing
  backward edges before terminating at the source. These operators are configured
  paths; naming one in the assembly does not mean every request uses a remote
  encoder or separate prefill worker.
- The simpler `link_pipeline` path is for execution-context/in-process variants;
  do not silently substitute it for the dynamic routed serving path.

For one user request read `lib/llm/src/http/service/openai.rs`:

1. `handler_completions` reads/validates JSON, checks service/model readiness,
   applies frontend nvext policy, creates request ID/context, and installs a
   connection monitor.
2. `completions` chooses single versus batch handling. Trace `completions_single`
   first; it resolves model aliases, creates metrics guards, obtains the model's
   completion engine from the manager, and calls `engine.generate(request)`.
3. Streaming responses inspect pre-first-item backend errors before committing
   HTTP 200 and wrap output in client-disconnect handling. Nonstreaming requests
   still call a streaming engine and aggregate the result.
4. The HTTP queue guard is retained until the first token on the streaming path;
   frontend observation boundaries differ from engine scheduling boundaries.
5. `handler_chat_completions` and `chat_completions` are the corresponding chat
   path, with additional request/template handling. Use a plain completion trace
   to establish boundaries, then explain chat-specific preprocessing separately.

`lib/llm/src/preprocessor.rs::OpenAIPreprocessor` owns request/response
transformation. It is much larger than tokenization alone: template/reasoning,
media, output format, and other branches are present. Link a selected text path
and label optional multimodal/structured branches rather than implying one
universal preprocessing algorithm.

Relevant tests to inspect while authoring:
`lib/llm/tests/frontend_protocol_validation_http.rs`, `http-service.rs`,
`http_namespace_integration.rs`, `http_metrics.rs`, and `preprocessor.rs`.
`lib/llm/tests/common/http_harness.rs` supplies shared HTTP infrastructure.

## Optional KV block management

There are distinct state owners: routing cache indexes, vLLM's local cache
manager, and optional Dynamo KVBM. Do not call a router's prefix index the owner
of cached tensor storage.

`components/src/dynamo/vllm/args.py::_uses_dynamo_connector` detects explicit
`DynamoConnector` configuration directly or nested beneath `PdConnector`.
The legacy connector-list conversion maps `kvbm` to
`kv_connector: DynamoConnector`,
`kv_connector_module_path: kvbm.vllm_integration.connector`, and `kv_role: kv_both`.
The same file rejects the legacy `--connector` flag for this backend, so use
current `--kv-transfer-config` when showing supported configuration.

`components/src/dynamo/vllm/main.py` calls `get_consolidator_endpoints` only when
`_uses_dynamo_connector(config.engine_args)` is true. Import failures are logged
and allow startup without KV-event consolidation; therefore a running worker
alone does not establish that event consolidation was enabled successfully.

`lib/bindings/kvbm/python/kvbm/vllm_integration/connector/dynamo_connector.py`
provides `DynamoConnector(KVConnectorBase_V1)`. Its scheduler role creates
`KvConnectorLeader`; its worker role creates `KvConnectorWorker`. Scheduler hooks
cover external prefix matching, allocation updates, connector metadata, request
completion, and cache reset. Worker hooks register KV tensors, bind/clear metadata,
start loads, save layers, and report completion. Metadata is an encoded byte
payload bridging scheduler/worker boundaries. The facade's
`wait_for_layer_load` and `wait_for_save` methods are no-ops in this snapshot;
actual synchronization must be understood in the delegated worker implementation,
not inferred from these method names.

The native subsystem spans `lib/kvbm-logical/` (logical blocks, pools, sequences,
registry and manager), `lib/kvbm-engine/` (leader/worker, offload, runtime and
collectives), and supporting config/kernel/consolidator crates. These still need
focused inspection for the cache-management chapter; do not infer their semantics
from directory names.

`lib/llm/Cargo.toml` has a default `block-manager` feature tied to native/GPU
libraries. That compile-time feature is not equivalent to activating the separate
vLLM KVBM connector at runtime, and should not be conflated with it.

## Planner observation, decision, and actuation

`components/src/dynamo/planner/core/base.py::NativePlannerBase` is the host loop.
`_gather_tick_input` only collects requested observations (traffic, FPM, batch
scheduling, and worker state), handles missing capacity explicitly, and returns
`TickInput`. `_observe_tick` uses an engine's observation method when available,
otherwise falls back to gathering input directly.

`_run_one_tick` performs:

1. Refresh capabilities and observe the environment.
2. Publish observations/inventory and retain last observed worker counts.
3. Under `_config_lock`, snapshot `_config_generation` and await `engine.tick` to
   obtain `PlannerEffects`.
4. Deliver live-retune effects to its own outbox when enabled; router tuning is a
   separate path from ordinary scaling effect application.
5. Call `_submit_effects(effects, generation)`, report diagnostics, and return the
   next scheduled tick.

`_submit_effects` admits at most one external effect submission. It holds an
admission lock, refuses a second request while the previous one awaits
acknowledgement, and checks that effects were computed from the current config
generation. A request with an unknown outcome blocks automatic new submissions
until deployment state is verified and the Planner restarted. A timeout is not
proof that the external scaling operation failed; shielding preserves the
pending submission instead of canceling it and inventing a second operation.

`environment/state.py` defines `ReplicaState`, `ComponentState`, and
`DeploymentState`. `environment/runtime.py::RuntimeNamespaceBinding` handles the
worker runtime namespace separately from deployment-state observation. The
planner works at deployment/capacity scope; it does not choose vLLM's next token
batch.

## Runtime configuration is a conditional state transition

`reconfiguration.py::ReconfigureRequest` requires instance identity, expected
revision, request ID, update fields, and optional warmup/cold-start choices.
`candidate_config` accepts a bounded runtime field set, rejects mode-inactive
endpoint changes, and revalidates the full merged PlannerConfig.

`PlannerReconfiguration.submit` copies caller-owned input, fingerprints it for
idempotent retries, checks instance/revision, rejects overlapping preparations,
validates a candidate, and records a preparing operation. Predictor replacement
requires the relevant SLA/throughput mode and explicit warmup or cold-start
intent.

`_apply` prepares a predictor off the event loop, tracks the preparation even if
it times out, then takes effect-admission and config locks, checks revision again,
and activates the candidate through `apply_runtime_candidate`. Only then does the
operation become applied with its new revision. Failure or cancellation leaves a
failed operation; preparing a candidate is not activating it.

Inspected tests:

- `tests/unit/test_tick_lifecycle.py::test_complete_tick_applies_scaling_only_when_not_advisory`
  exercises observation → decision → environment effect application and advisory
  behavior, including the lock boundary around decisions versus external effects.
- `tests/unit/test_reconfiguration.py::test_scalar_update_is_conditional_idempotent_and_preserves_live_state`
  checks revision activation, repeated-request behavior, conflicting reuse,
  defensive input copying, and preservation of existing predictor/scaling state.
- Nearby tests cover stale updates, warmup failure, timeout/shutdown, supported
  fields, generation changes, and runtime thresholds affecting later decisions.
- `tests/unit/test_load_budget_guard.py` tests holds and budget floors so the
  chapter should avoid the simplistic claim that observed demand always causes
  immediate replica changes.

## Authoring pitfalls to retain

- Differentiate discovery, routing selection, engine scheduling, and capacity
  planning. Each operates over a different state representation and timescale.
- Distinguish request/response protocol objects, preprocessed token requests,
  transfer metadata, and actual GPU data.
- Treat a successful enqueue, timeout, or control-plane response according to its
  exact acknowledgement contract; none automatically proves data consumption or
  completed deployment actuation.
- Explain the frontend path with Rust pipeline operators before moving into the
  Python engine adapter. The overview currently skips most of that path.
- Read additional native KVBM and planner policy implementations before stronger
  data-placement, optimization, recovery, or fairness claims.

## Additional source anchors inspected

`lib/kvbm-logical/src/lib.rs` documents a type-state lifecycle
Reset → Complete → Registered, active/inactive/reset pools, deduplication,
attachments, and event coordination. `ManagerId` disambiguates a physical pool
and block slot after type erasure. `LogicalLayoutHandle` distinguishes G1 device,
G2 host, G3 disk, and G4 externally managed service storage. Explain these as
logical/native subsystem contracts, not as an assertion that all tiers are
configured in a given deployment. Further test fixtures are under
`lib/kvbm-logical/src/testing/{blocks,pools,managers,sequences}.rs`.

The connector delegation targets are
`lib/bindings/kvbm/python/kvbm/vllm_integration/connector_leader.py::KvConnectorLeader`
and `connector_worker.py::KvConnectorWorker`. The worker registers tensor layouts,
binds metadata, starts loads, saves KV layers, and retrieves completion sets.
This is a clearer lower-level reading route than following only the thin public
DynamoConnector facade.

`planner/core/load_scaling.py::LoadScalingMixin` makes FPM-driven reactive
choices, while `planner/core/throughput_scaling.py::ThroughputScalingMixin`
uses traffic/performance models for predictive throughput sizing. Each contains
explicit holds or conservative behavior: missing FPM data, worker-count
mismatch, scaling already in progress, unavailable performance models, and
bounded replica deltas. The inspected `_idle_sla_target` comment explicitly notes
that an FPM-driven path cannot wake a pool after its last publisher exits.
Model readiness, a metrics sample, and actual capacity are separate conditions;
these are useful worked decision gates for the planning chapter.

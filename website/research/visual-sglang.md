# SGLang visual architecture audit

Dedicated repository scope: SGLang overview and all fourteen internals chapters.
Source baseline: `a16830deb5ea5b1e8c9874ad646f3ba95542191c` in
`references/sglang`. No upstream files or source revisions were changed.

This pass adds nineteen mechanism-specific diagrams and upgrades the existing
overview's accessible metadata: twenty Mermaid diagrams across fifteen pages.
Every graph has `accTitle`, `accDescr`, a lead-in, and a nearby takeaway stating
its assumptions. Existing headings, routes, Source components, and source
excerpts are preserved. No performance measurements or benchmark curves are
invented.

| Page | Visual | Checked source boundary |
| --- | --- | --- |
| Overview | SRT generation responsibility map | Existing Engine/TokenizerManager/Scheduler/worker/runner sources |
| Repository map | Identity across changing representations | `entrypoints/engine.py` process model; `managers/io_struct.py`; `ForwardBatch` core borrowed fields |
| Startup | Worker-readiness/frontend join | `Engine._launch_subprocesses`: scheduler launch, Python detokenizer/tokenizer setup, readiness wait, `max_req_input_len` installation and watchdog |
| Request lifecycle | Dispatch changes failure cleanup | `TokenizerManager._send_one_request`, `_mark_state_dispatched`, `_release_req_states_on_failure`: state identity check, local removal before delivery, abort and retain after dispatch |
| Scheduling | Twelve-token prompt in eight-plus-four teaching chunks | `Scheduler.event_loop_normal`, `get_next_batch_to_run`, `NextBatchPlan`; existing chapter's admission/partial-chunk example |
| Prefix cache | Exact split of `[10,11,12,13]` into shared and divergent segments | `RadixCache._match_prefix_helper`, `_split_node`: split key/value slices, inherited lock count, index clone rather than KV payload clone |
| Prefix cache | Shared path lock lifetime | `inc_lock_ref`, `dec_lock_ref`, leaf eviction: zero/nonzero accounting transitions and ancestor protection |
| Memory pools | Row/position to physical location | `ReqToTokenPool` padding row, `req_generation`, row allocation; token/page allocator and concrete KV pool distinction |
| Model execution | Ragged useful query rows | `ForwardBatch` request indices, sequence lengths, write locations and extend metadata; existing mixed-work teaching example |
| Model loading | Q/K/V name mapping into packed execution parameter | Qwen2 `_legacy_load_weights` stacked mapping and `_load_weights_v2` module-local delegation; `QKVParallelLinear` parameter-specific loading |
| Overlap | A/B late-result dependency sequence | `Scheduler.event_loop_overlap`: `run_batch`, WAR dependency, queued snapshot/result, old-result processing, separated sampling |
| Overlap | Snapshot, fence and retained-storage responsibilities | `_apply_war_barrier`, overlap helpers, deferred output; batch metadata alone does not retain or synchronize all storage |
| Parallel workers | Placement across replicas versus TP cooperation | `DataParallelController` ordinary request destination and active-worker behavior; TP worker, group and layer sources |
| Hierarchical cache | Restorable-set intersection counterexample | `PoolTransferResult.restorable_prefix_pages`: nonmonotone trailing-state boundaries, rank-local sets and explicit intersection requirement |
| Hierarchical cache | Tier hit to restored/published device state | Existing unified-radix/controller load-back contracts and required-pool validation |
| Stage disaggregation | Reserve/transfer/publish/schedule ownership | Decode/prefill queue contracts; `test_waits_for_every_rank_and_sends_once`, `test_failed_receiver_keeps_destination_unpublished`, deferred-metadata retention and aborted-final-result tests |
| Stage disaggregation | Staging reuse watermark after assignment | `StagingAllocator` docstring, `assign`, `free`, `get_watermark`: overcommit, previous-round overlap, oldest-unfreed watermark and consecutive-free advancement |
| Sampling/output | `[A,B,C]` to `[A,C]` row identity | `SamplingBatchInfo.filter_batch`: penalizer/custom state and per-row tensors share keep-index mapping |
| Sampling/output | Scores/IDs/accepted progress/text/chunks | Sampler/reporting, penalty histories, incremental detokenization and frontend output buffering; conceptual data dependencies explicitly distinguished from helper call order |
| Diagnosis/tests | Sixteen-unit pool ownership partition | `SchedulerInvariantChecker._check_pool_conservation`; additional page-alignment and exact-owner checks remain necessary |

## Accuracy boundaries

- Startup is scoped to the baseline Python frontend-owning path. Follower and
  embedded Rust paths have different branches. The graph shows dependencies,
  not elapsed durations.
- Frontend request state is not scheduler state. After dispatch, an abort request
  is not completed resource retirement; matching state remains until response.
- Chunk sizes, rank arrangements, ragged row boundaries, index arithmetic, and
  conservation numbers are explicitly teaching examples rather than defaults.
- Radix values are indices over payload. Splitting index tensors does not copy
  all GPU K/V. Lock states are conceptual accounting labels, not provider enums.
- Overlap's stream waits enqueue dependencies. A Python return or snapshot copy
  is not a blanket device completion, deep tensor copy, or release fence. Early
  result-processing gates are stated alongside the late-processing sequence.
- Replica placement does not admit a request locally. The alternate replica
  edge is not a broadcast or the control-message destination set.
- Host/storage identity, resident bytes, restored required state, and executable
  device prefix are different facts. A scalar maximum can hide illegal auxiliary
  restoration boundaries.
- Destination preallocation and staging assignment do not authorize consumption
  or overwrite. Transfer participants, publication, and watermark gates retain
  their distinct roles. NIXL and Mooncake remain configured alternatives.
- Sampling metadata follows stable request identity through row changes. Graph
  edges name conceptual data dependencies, not universal call ordering.
- The accounting partition has no area scale or measured values. A passing sum
  does not prove correct page identity, lock release, or cancellation lifetime.

## Validation

- `node .qa/parse-visuals.mjs sglang`: **15 files, 20 diagrams, zero failures**.
  All twenty render with nonempty SVG accessible titles and descriptions.
- A before/after snapshot comparison confirms every pre-existing heading,
  Source component, and non-Mermaid source excerpt remains identical.
- No shared UI, navigation registry, package, config, source manifest, server,
  build output, other repository guide, or upstream checkout was changed.
- Full Astro/build, theme, responsive layout and site integration checks remain
  with the primary agent.

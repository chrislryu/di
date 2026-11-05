# Dynamo visual architecture audit

The Dynamo pass covers the overview and all fourteen chapters. It adds fourteen diagrams and upgrades four existing diagrams, for eighteen Mermaid diagrams across fifteen pages. The existing `SystemMap` remains in the overview. Headings, routes, frontmatter, code excerpts, source links, invariants, and failure-case prose are retained.

The diagrams use conceptual maps for responsibilities and lifetimes. The existing KVBM logical-block state diagram is the only state machine and retains its source state names. Dashed edges name metadata, optional integrations, or non-owning relationships. Solid edges depict the named request/data/control path. Every Mermaid block has `accTitle` and `accDescr`, a lead-in, and a caption explaining scope. No chart invents measured performance, a common clock, or a new hardware completion guarantee.

## Changed pages and intent

| Page under `website/src/content/docs/architecture/` | Change | What the visual teaches |
| --- | --- | --- |
| `dynamo.mdx` | Upgrade overview | Frontend, router, runtime endpoint, adapter, and engine are distinct owners. Discovery and worker events are supporting metadata. |
| `dynamo/repository-map.mdx` | Add source ownership map | Request owners differ from capacity control, discovery, and optional KVBM. |
| `dynamo/startup.mdx` | Add joined startup map | Listener readiness and initialized worker metadata must join at compatible model admission. Load/cache observation is a separate channel. |
| `dynamo/runtime-discovery.mdx` | Add two-user lease sequence | Two identical users share one owned registration; dropping the first lease does not unregister it. Caption distinguishes adopted records and cancelled acquisition. |
| `dynamo/request-protocols.mdx` | Add value/path map | The exact `[10, 20, 30]` prompt example separates locally shared tokens, serialized work, engine-owned handoff parameters, framework trace links, skipped local cleanup state, and KV bytes. |
| `dynamo/frontend-path.mdx` | Upgrade typed pipeline, add HTTP commitment decision | Forward and backward transformations both matter. Internal stream acquisition, first-item error preflight, header commitment, generated-token accounting, and late protocol errors are separate events. |
| `dynamo/routing-selection.mdx` | Add admission ownership graph | Query, Book, Lease, and Advisory have different queue/accounting contracts. Book claims roll back before commit; installed and caller-owned bookings have different release owners. |
| `dynamo/cache-aware-routing.mdx` | Add exact five-block prefix example | Confirmed device A→B anchors lower-tier C→D, E is unmatched, and the combined prefix counts once. Side-only prediction can influence scoring without becoming a confirmed lower-tier anchor. |
| `dynamo/backend-adapters.mdx` | Add translation composition map | Normal-text generation defaults precede request overrides; connector-owned handoff interpretation is optional and output projection still precedes public framing. |
| `dynamo/prefill-decode.mdx` | Add staged handoff ownership map | Continuation metadata and KV payload follow separate paths; staged cleanup can still require the selected decode worker after client cancellation. |
| `dynamo/cache-management.mdx` | Add accessibility to logical-state diagram, add retention graph | Optional KVBM is distinct from routing indexes. `request_finished` may retain engine slots until `get_finished` reports the request, independently of final token delivery. |
| `dynamo/planning-and-reconfiguration.mdx` | Upgrade conditional activation map, add effect sequence | Candidate preparation is not active policy. Generation 4 effects are discarded after generation 5 activates; admitted unacknowledged effects retain shielded task ownership and block another admission. |
| `dynamo/cancellation-failure.mdx` | Add deferred-abort sequence | The real abort waits for first engine output on the selected decode path. If output never arrives, `close` cancels the local waiter without issuing an unsafe early engine abort. |
| `dynamo/observability.mdx` | Add metric interval map | HTTP queue timing spans frontend and engine/transfer phases; a metadata-only chunk does not trigger generated-token accounting. No numeric scale is implied. |
| `dynamo/code-labs.mdx` | Add reading/evidence map | The four existing labs isolate representation, accounting, handoff, and generation/admission contracts. Runtime evidence remains separate. |

## Pinned-source checks

All checks use the existing local Dynamo snapshot, `73014901d4e7610358fcf28535418ba9c5f50812`. No checkout, dependency, or revision changes were made.

- `lib/kv-router/src/services/selection/core/operation.rs`: inspected `SelectionAdmission` and booking ownership comments. Query is queue admission without booking, Advisory skips queue admission, Book is recorded by the core, and Lease returns an armed caller-owned handle. The diagrams do not equate worker choice with engine execution or universal reservation.
- `lib/runtime/src/discovery/registration.rs`: inspected `register`, `acquire`, `release`, the `owned` flag, refcounts, and cancellation/last-lease tests. Acquisition is spawned; dropping the caller does not transactionally undo remote registration. Only an owned registration is unregistered after final lease release.
- `lib/llm/src/protocols/common/preprocessor.rs` and `llm_backend.rs`: inspected skipped local fields, `staged_kv_cleanup`, `disaggregated_params`, and `worker_trace_link`. Handoff and trace metadata remain separate and no process pointer is portrayed as a worker's KV allocation.
- `lib/kv-router/src/services/indexer/lookup.rs`: inspected the primary/side/lower-tier pipeline and the `side_only_worker_scored_but_not_used_as_lower_tier_anchor` and `concurrent_tiered_query_does_not_double_count_device_and_lower_tier_overlap` tests. The visual preserves confirmed anchoring, optional overlays, and prefix deduplication.
- `components/src/dynamo/vllm/handlers.py`: inspected normal-text generation defaults and request overrides in `build_sampling_params`, `_DeferredAbort.abort`, `_wait_and_abort`, `signal_first_token`, and `close`. The sequence distinguishes the first engine output event from a generic transfer-completion promise and preserves background ownership, shielding, no-output cleanup, and engine-death escalation.
- `lib/bindings/kvbm/python/kvbm/vllm_integration/connector_leader.py`: inspected `request_finished`'s pre-free retention contract; `connector_worker.py`: inspected `get_finished`'s finished-save/send feedback and `save_kv_layer` event ordering. The graph does not treat a Python callback or router hit as allocation-release authority.
- `components/src/dynamo/planner/core/base.py`: inspected `_run_one_tick`, `_submit_effects`, generation recheck, effect-admission lock, retained task, acknowledgement timeout, `asyncio.shield`, and unknown-outcome hold. The diagram does not turn acknowledgement into observed ready capacity.
- `lib/llm/src/http/service/metrics.rs`: inspected the documented HTTP queue boundary and nonempty generated-token transition. The interval map does not relabel all first-token waiting as router queue time.

Other visual details summarize already source-linked prose in their chapters; no new optional dependency is promoted to a required integration. The existing `Reset`, `Staged`, and `Registered` KVBM state diagram remains scoped to logical guard ownership rather than transport completion.

## Validation

- Rendered every Dynamo Mermaid block directly in an isolated Chromium page using the installed Mermaid and Playwright packages: **18/18 produced SVGs**.
- Checked each rendered SVG has a nonempty accessibility `title` and `desc`: **18/18 passed**.
- All flowcharts use top-down layout with concise quoted node labels. The three sequence diagrams use four participants each and no message semicolons.
- No shared build, server, registry, config, package, source manifest, or upstream checkout was modified. Full Astro/build and responsive site validation remains with the coordinating agent.

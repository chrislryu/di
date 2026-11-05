# DeepInfer visual architecture audit

Scope: the overview and all fourteen internals chapters, using the pinned local
DeepInfer snapshot `a679bb86ce36e883a98a97733492b686e5b9a08e`. This dedicated agent
edited no other repository guide, shared configuration, package, source manifest,
or upstream checkout.

Added sixteen mechanism-specific diagrams and accessible metadata to the existing
overview, giving seventeen diagrams across fifteen pages. Every original heading,
Source component and non-Mermaid code excerpt was compared with a pre-edit
snapshot and preserved. Diagrams have introductions, takeaways, `accTitle` and
`accDescr`. Numeric examples remain explicitly conceptual rather than claims
about the released model's real expert count, physical cache layout or timing.

| Chapter | Visual purpose | Local source checked |
| --- | --- | --- |
| Overview | Preserve offline engine map and describe released scope accessibly | Existing overview links and `deepinfer/entrypoints/llm.py` |
| Repository map | Distinguish prepared tokens, persistent native sequences, per-step metadata, worker work and engine-created pooled outputs | `deepinfer/engine/llm_engine.py` `step` and result callback; `csrc/engine/sequence.hpp`; `csrc/engine/pybind_output.cpp` |
| Startup | Environment/import order, workers/groups, model loading, cache profiling/warmup, then native scheduler | `examples/_config.py`; `deepinfer/engine/llm_engine.py` constructor and `_init_cache` |
| Model loading | Resolve minimum redundancy into divisible physical and local expert storage before loading | `deepinfer/model_executor/model_loader.py` `_configure_moe_redundancy` and coverage check; `model_executor/eplb/__init__.py` `resolve_num_extra_experts` |
| Offline lifecycle | Clone both ordinary-step and final-flush outputs before advancing/returning | `deepinfer/entrypoints/llm.py` `_run_engine`; `csrc/engine/pybind_output.cpp` raw accessors and `std::make_unique` clone |
| Native scheduler | ALL/ANY intent vote followed by actual-prefill admission vote, with compatible empty prompt work | `csrc/engine/scheduler.hpp` normal-mode `_schedule`, positive-count ANY predicate, ANY precedence, `any_scheduled` reduction |
| State memory | Event-protected clone-source pins, plus raw-address copies versus owning output clones | `deepinfer/engine/llm_engine.py` `DeferredRelease`, `collect_clone_unpins`, `release`; `csrc/engine/pybind_output.cpp` |
| Input metadata | Ragged `[0,3,4]` query boundaries and optional CP mirror/reverse coordinates | `deepinfer/model_executor/input_metadata/input_metadata.py` `total_q`, `mirror_cp_index`, `mirror_cp_reverse_index`, valid mask and one-time preparation guard |
| Parallel groups | CP `[0,1]/[2,3]`, DP `[0,2]/[1,3]`, EP all-four membership without asserting network topology | `deepinfer/model_executor/parallel_utils/parallel_state.py` rank rearrangements and group construction |
| Attention/model | Query preparation, KV store, indexed prior-context load and selected backend as separate semantic responsibilities | `deepinfer/model_executor/models/v4_modules/attn.py` runtime properties and fused-path gates; existing backend/cache source links |
| Experts/balancing | Logical-to-physical identity in illustrative `[A,B,D,A,C,D]` placement | `model_executor/models/v4_modules/moe.py` logical/physical/local counts; `model_executor/eplb/policy.py` mappings; `eplb/shuffle.py` staging/waits; `eplb/__init__.py` shuffle before map copies |
| Overlap | Actual forward/prior-post/current-sample/retention phase order, plus identity-based `[2,-1]` row remap | `deepinfer/worker/worker.py` `execute_model_step`, `_correct_seqlens_qk`, `_post_process_step`; `deepinfer/worker/zos_status.py` `WorkerStepState`, `MetadataZOS` |
| Sampling/verification | Proposed A/B/C versus accepted A/B and algorithm-selected continuation | `deepinfer/model_executor/sampling_inputs.py` accepted-draft count; `layers/sampler.py`; existing native output-processing links |
| Structured output | Background compilation/replay returns to engine-side `pump` and admission callback | `deepinfer/structure_output/so_matcher_builder.py` `build`, `submit`, `pump`; engine pending-work integration |
| Diagnosis/tests | CPU launch interval versus completed device-event provenance with iteration identity | `deepinfer/worker/worker.py` sample/timing events and post-process synchronization; `deepinfer/timer.py`; existing stats/test evidence |

## Accuracy boundaries

- Raw `uint64` output values are addresses, not token IDs or owning Python values.
  The actual exported preservation method is `RequestOutput.clone(raw_handle)`.
- Scheduling emptiness does not drain the retained worker result. Both step and
  flush paths clone returned results before another advancement or return.
- Slot allocation, logical reference counts, queued device copies and safe reuse
  remain distinct. The slot-5-to-slot-9 sequence depicts ownership actions rather
  than exact API calls; source pins retire only after the recorded copy event.
- Normal-mode ANY excludes decode count zero. At positive coincident attempt
  points ANY takes precedence, and the second vote ensures that an attempted
  prompt phase has actual admitted work somewhere in the group.
- CP/DP/EP lines indicate membership, not physical links, independent serving
  replicas, hardware fit or a selected collective algorithm.
- Worker phase arrows order host actions, not global device completion. The
  source calls sampling before the callback named `pre_sampler_sync`; the graph
  preserves that implementation order. Prompt/non-ZOS processing remains in
  place while ZOS decode retains current `WorkerStepState`.
- Proposal count, accepted draft count and committed output remain separate.
  Tentative accelerator work does not establish committed request/matcher state.
- Structured-output graphs follow successful preparation and explicitly retain
  error/aborted-result handling and unfinished pending-work accounting in prose.
- Attention/cache diagrams describe semantic representations rather than a
  universal copy schedule, fixed physical row layout or required external cache.
- No chart supplies fabricated performance data or implies a hardware run.

## Validation

- `node .qa/parse-visuals.mjs deepinfer`: **15 files, 17 diagrams, zero failures**.
  Each produced an SVG with nonempty accessible title and description.
- Pre-edit comparison: all original headings, Source components and non-Mermaid
  fenced excerpts remain unchanged across all fifteen pages.
- The coordinating agent owns the final integrated build, source-link checks,
  site navigation, theme/viewport geometry and mobile checks.

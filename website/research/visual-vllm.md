# vLLM visual architecture pass

Reviewed all 15 vLLM guide pages against the pinned local checkout at
`9a56d4fec6b0a30a0a989f1cd06cd3c2f7325619`. Added 22 mechanism diagrams across
all 14 internals chapters. The existing overview/SystemMap architecture remains
intact; its Mermaid now also has a scope lead-in, accessible title, and description.

All existing headings, routes, source links, and source excerpts were preserved.
The additions visualize claims and worked examples already in the chapters, so no
source-evidence JSON changes were needed. Numerical examples are explicitly
conceptual, and no performance plots or measurements were invented.

## Changed pages and diagram intent

Paths below are relative to `website/src/content/docs/architecture/`.

| Page | New visual | Semantic source checks in `references/vllm/` |
| --- | --- | --- |
| `vllm.mdx` | Preserve overview map, add accessible metadata and scope | Existing serving → AsyncLLM → core → scheduler/executor → client output boundaries remain unchanged. |
| `vllm/repository-map.mdx` | Process/context ownership of persistent requests, iteration plans, worker rows, and output collectors | `vllm/v1/engine/async_llm.py`, `engine/core.py`, `core/sched/output.py`, `worker/gpu_input_batch.py`: stable request identity crosses distinct representations, rather than one object being shared. |
| `vllm/startup.mdx` | Startup sequence showing cache-plan dependency and context-limit feedback | `engine/core.py:272–404`: resolve/set cache layout before profiling, create cache configuration, propagate auto-fit limit before `initialize_from_config`, then create structured manager/scheduler in `EngineCore.__init__`. |
| `vllm/model-loading.mdx` | Independent architecture/format selections; separate Q/K/V names converge on packed parameter with shard identity | `model_executor/models/qwen3.py:269`, `models/qwen2.py:325–330`, `layers/linear.py:1072–1075,1215–1320`: inherited mapper, q/k/v identifiers, rank partition and KV-head replication. Diagram deliberately does not depict equal tensor thirds. |
| `vllm/request-lifecycle.mdx` | Cancellation sequence across caller, AsyncLLM, core, and executor/worker | `engine/async_llm.py:821–823` and `engine/core.py:709–735`: cancellation calls abort, and pending aborts are processed before scheduler result reconciliation. |
| `vllm/scheduling.mdx` | Eight-position budget allocating seven prompt positions plus one decode position, guarded separately by KV admission | `core/sched/scheduler.py:846,919–1009`: token deficit/clipping, `allocate_slots`, and budget decrement. Exact seven-plus-one selection remains a teaching outcome, not a policy prediction. |
| `vllm/kv-memory.mdx` | Concrete two-shared-block ownership map; cached/refcount/writable lifecycle | `core/block_pool.py:681–714,767–825`: touch, decrements, cached zero-reference candidates, eviction on allocation, and non-null/ref-count-one/no-hash writability. Uses the existing block-size-four/eight-token example. |
| `vllm/gpu-execution.mdx` | Ragged three-plus-one row layout; pending `ExecuteModelState` sampling protocol | `worker/gpu_model_runner.py:1175,3903–3907,4215,4252–4279`, `worker/gpu_input_batch.py`: update persistent rows, reject execute while sampling state is pending, consume/clear pending state through sampling. |
| `vllm/attention-backends.mdx` | Backend/builder/implementation role map; logical-position-five address walk through physical block 2, offset 1 | `v1/attention/backend.py:401–451`, `attention/selector.py`, `worker/block_table.py`, `attention/backends/flash_attn.py:1450–1485`: metadata roles, exact/upper-bound distinction, backend cache views and slot-mapping write count. Address diagram is conceptual block-major arithmetic. |
| `vllm/sampling-and-output.mdx` | Raw score reporting branches from penalized greedy selection | `v1/sample/sampler.py:147–166,436–468`, `model_executor/layers/utils.py`, `csrc/sampler.cu`: raw reporting precedes selection transforms; existing A=4/B=3/C=1 example selects B after positive A is divided by two. |
| `vllm/async-and-speculative.mdx` | A/B submission and completed-prefix frontier; current logits versus prior accepted grammar dependency | `engine/core.py:750–861`, `v1/request.py:164–175`, `core/sched/async_scheduler.py`, `tests/v1/core/test_scheduler.py:604–641`: optimistic counters and separate sampling dependency. The probe `[0,1,2,3]` still reuses only two tokens after the first output while subsequent KV is in flight. |
| `vllm/distributed-execution.mdx` | Eight-rank TP/PP lattice; two-rank reduction and replicated result ownership | `distributed/parallel_state.py:2085–2121` supplies exact TP pairs and PP chains. Existing conceptual `[1,2]+[3,4]=[4,6]` example illustrates all-reduce ownership without asserting NCCL/network selection. |
| `vllm/kv-connectors.mdx` | Scheduler-control/worker-data round trip; pull/READ ownership sequence | `distributed/kv_transfer/kv_connector/v1/nixl/connector.py`, `pull_worker.py`, `base_worker.py:3227–3262,3365`, and scheduler receive handling: allocation is not usable data, completion includes separately reported failures, and producer release remains protocol-dependent. |
| `vllm/structured-generation.mdx` | Pending/success/failure readiness graph; request-owned mask/acceptance loop | `structured_output/request.py:45–62`, `backend_types.py:35–56`, `structured_output/__init__.py:134–155,388`: completed failure is ready, one backend per engine, validation does not advance FSM, failed acceptance preserves state. Speculative validation is drawn as an optional inspection rather than a required step for every generated token. |
| `vllm/diagnosis-and-tests.mdx` | Evidence-driven localization of first-token delay | `v1/metrics/stats.py` and existing chapter boundary table: distinguish frontend arrival, scheduler selection, execution, and output delivery. Graph offers investigation questions rather than fabricated diagnostic certainty. |

## Validation

- Ran `node .qa/parse-visuals.mjs vllm` from `website/` with the installed Mermaid
  and a real Chromium DOM: **15 files, 23 total diagrams, zero failures**.
- Every rendered diagram has nonempty SVG `title` and `desc` accessible text.
- Independently rendered all 22 new diagrams in Chromium before that shared
  check. Inspected a screenshot of the shared-prefix block layout to confirm
  references converge on shared blocks without copying payloads.
- Shortened sequence participant/message labels and explicitly wrapped long
  notes to reduce desktop scrolling. All flowcharts use top-down orientation;
  sequence diagrams have at most four participants.
- No website build, upstream edits, GPU tests, runtime benchmarks, or shared
  configuration/style changes were performed by this agent. Parent owns the
  final integrated build and browser responsive/theme review.

# DeepEP visual architecture audit

Dedicated repository scope: DeepEP overview and all fourteen internals chapters.
Pinned source: `f6aa38fe06cd4a0489e7730365d4e0114970a2f3` under
`references/deepep/`. The pass adds sixteen diagrams and upgrades the existing
overview diagram, producing seventeen Mermaid visuals across fifteen pages.

The prior communication agent supplied an unapplied draft. This repository's
dedicated agent reviewed the proposed relationships against the local source
before applying them and added a separate execution-versus-storage dependency
map. No other repository guides or upstream source trees were edited.

## Visual intent and source checks

| Page | What the visual explains | Source checked |
| --- | --- | --- |
| Overview | Engine expert math around dispatch/combine and backend calls | `deep_ep/buffers/ep.py`, public dispatch/combine contracts |
| Public contracts | Activation data versus routing control and matching handle | `deep_ep/buffers/ep.py`, `EPHandle`, dispatch and combine |
| Groups/communicators | Cached, borrowed and managed communicator acquisition | `deep_ep/comm/handle.py`, `NCCLCommHandle.__del__`, `get_nccl_comm_handle` |
| Buffer lifecycle | Workspace, communication and optional LB partitions | `csrc/buffers/ep.hpp`, constructor and LB view deleter; `csrc/kernels/comm/context.cpp`, symmetric allocation/window offsets |
| Routing/handles | Compatible placement reuse does not cache activations | `deep_ep/buffers/ep.py`, retained `_topk_idx`, version check and cached-mode assertions |
| Token layouts | Rank deduplication versus expert expansion; valid rows, padding and ends | `deep_ep/include/deep_ep/impls/ep/dispatch.cuh`, actual counts and exclusive aligned starts; `dispatch_copy_epilogue.cuh`, atomic slot assignment |
| Dispatch host path | Immediate versus deferred output finalization | `csrc/buffers/ep.hpp`, captured epilogue and CPU count wait; `deep_ep/buffers/ep.py`, `finalize_dispatch` and one-time hook |
| Dispatch kernels | Expert counts and destination-rank counts diverge | `deep_ep/include/deep_ep/impls/ep/dispatch.cuh`, notify warp expert counters and deduplicated rank counters |
| Combine kernels | Local partial reduction versus final source reduction | `deep_ep/include/deep_ep/impls/ep/combine.cuh`, return metadata and expanded-layout branches; `combine_utils.cuh` and `combine_reduce_epilogue.cuh` |
| Hybrid communication | Domain deduplication, rail transfer and local forwarding | `deep_ep/include/deep_ep/impls/ep/hybrid_dispatch.cuh`, scale-out/forwarding branches and acquire tail loop; `csrc/kernels/comm/context.cpp`, railed Gin requirements |
| Streams/events | Producer/result dependencies versus storage retention | `csrc/buffers/ep.hpp`, `stream_control_prologue` and `stream_control_epilogue`; `deep_ep/utils/event.py`, current-stream wait and hook |
| Precision/capacity | Maximum of dispatch/combine layouts plus allocation rounding | `csrc/buffers/ep.hpp`, `get_dispatch_buffer_size`, `get_combine_buffer_size` and `get_buffer_size_hint` |
| JIT/runtime | Compiled specialization reuse differs from routing reuse | `deep_ep/__init__.py`, loaded NCCL validation and initialization; `csrc/kernels/ep/dispatch.hpp`, compile/launch boundary |
| Expert replication | Weight copy and additive gradient return have different semantics | `deep_ep/buffers/ep.py`, `lb_prefetch_weights` and `lb_reduce_grads`; `tests/ep/test_reduce_grads.py`, seeded accumulation reference |
| Dispatch/combine trace | Two-rank A/B/C example with original-token ownership | Chapter's fixed teaching inputs; `dispatch.cuh`, `dispatch_copy_epilogue.cuh`, `combine.cuh`, `combine_reduce_epilogue.cuh` |

## Accuracy boundaries

- The aligned expert example uses actual counts `[3, 2]`, alignment four,
  starts `[0, 4]`, post-copy ends `[3, 6]`, and extent eight. Adjacent stored ends
  are not plain counts. Padding is zero only under its requested contract.
- Rank deduplication and domain deduplication reduce transported records without
  eliminating selected expert contributions. Non-expanded and expanded layouts
  are alternative public output contracts, not synonyms for wire copy count.
- The local and final reduction illustration uses exact scalar arithmetic. It
  does not claim BF16 bitwise equivalence between configured reduction paths.
- A producer event permits an overlap opportunity; it does not guarantee actual
  concurrent execution. Consumer ordering and tensor storage lifetime remain
  separate obligations. The native event's retained references are an alternative
  to stream recording in the configured asynchronous epilogue.
- Cached routing preserves referenced metadata and compatible geometry. Equal
  shapes alone do not establish compatible expert selections, and lifetime
  retention does not authorize mutation.
- Deferred dispatch's first wait hook produces four public outputs. It does not
  add a fifth event item to that hook result. Capacity mode still needs valid
  GPU count metadata and consumer ordering.
- A borrowed communicator wrapper does not destroy its owner's communicator.
  Buffer destruction and retained host-handle lifetime remain distinct.
- LB replica communication is separate from engine routing and freshness
  policy. Bucket, PP and Engram remain experimental optional extensions.
- All numbers in diagrams reproduce identified teaching examples or source
  alignment rules. No performance plot or measured GPU/network result is invented.

## Validation

- `node .qa/parse-visuals.mjs deepep`: fifteen files, seventeen diagrams,
  zero rendering or missing-accessibility failures.
- A before/after snapshot check confirms unchanged headings, `Source` components,
  and every non-Mermaid source excerpt across all fifteen pages.
- Each diagram includes `accTitle`, `accDescr`, a nearby introduction and a
  takeaway/scope caption. All flowcharts are top-down; the sequence has two
  participants. The shared site keeps natural label size and local scrolling.
- No build, server, package, registry, shared UI, or source manifest was changed.
  The primary agent performs the final site-wide production and responsive checks.

# AWS OFI NCCL visual architecture audit

Scope: the overview and all fourteen internals chapters, authored by the
dedicated AWS OFI NCCL agent. Pinned source:
`df4474a3882224df168f89c69e2450bbfe5f4536`.

The pass adds fourteen diagrams and upgrades four existing diagrams, yielding
eighteen Mermaid diagrams across fifteen pages. Every diagram includes
`accTitle` and `accDescr` and nearby explanatory scope. Existing headings,
routes, Source components, and non-Mermaid code excerpts are preserved. The
existing system map remains unchanged.

| Page | Visual intent | Source checked |
| --- | --- | --- |
| Overview | Preserve selected transport/provider spine; add accessible text | Existing source-linked SENDRECV/RDMA overview |
| Plugin contract | Shared owning references versus weak caches and caller tensors | `include/nccl_ofi.h`: communicator endpoint references, endpoint domain reference, weak domain/endpoint tables |
| ABI compatibility | Successful two-context init/finalize reference count | `src/nccl_ofi_interface_nvidia.cpp`: `init_v11`, `init_v12`, `finalize_v11`, `netRefCount` |
| Initialization | Intermediate probe, selection, `complete_init`, endpoint and property stages | `src/nccl_ofi_net.cpp`: `nccl_net_ofi_create_plugin`; `src/nccl_ofi_api.cpp`: common init |
| Provider/protocol | Actual explicit/default branches, with no invented last RDMA fallback | `src/nccl_ofi_net.cpp`: provenance switch and candidate pointer selection |
| Platform/topology | Shared PCIe switch versus shared host bridge | `tests/unit/topo.cpp`: shared-switch, shared-host-bridge and asymmetric branch cases |
| Connection management | Keep handle exchange distinct from plugin handshake; shorten existing sequence labels | `src/nccl_ofi_sendrecv.cpp`: connect/accept progress; common API's saved communicator endpoint |
| Request resources | Null-output retry before acceptance versus inflight-balanced retirement | `src/nccl_ofi_sendrecv.cpp`: send, `sendrecv_req_free`; RDMA `post_with_pending_retry` and pending queue |
| Memory registration | Requested payload versus rounded key coverage, then three-reference retirement | `src/nccl_ofi_mr.cpp`: `lookup_entry`, `del_entry`; `include/nccl_ofi_mr.h`: key rounding; chapter's unit fixture |
| SENDRECV | Communicator tag and independent sender/receiver CQ contexts | `src/nccl_ofi_sendrecv.cpp`: exact `fi_tsend`/`fi_trecv` arguments, context dispatch, terminal test |
| RDMA protocol | Destination control advertisement precedes ordinary rendezvous payload writes | `src/nccl_ofi_rdma.cpp`: `has_ctrl_msg`, `rdma_recv_req::post`, `rdma_send_req::post` |
| Rails/scheduling | Four available rails yield two contiguous aligned stripes in the worked example | `src/nccl_ofi_scheduler.cpp`: `get_num_stripes`, `set_schedule_by_threshold`, RR update |
| Completion/progress | CQ empty/error-availability/deferred-error paths; upgrade existing request flow | `src/nccl_ofi_sendrecv.cpp`: `sendrecv_cq_process`; RDMA error/pending handling |
| Optional interfaces | Tuner influence, baseline networking and separately bound Gin tables | `src/tuner/nccl_ofi_tuner.cpp`: null-context fallback; `src/rdma/gin/nccl_ofi_gin_api.cpp`: prerequisites; GDAKI export/context gate |
| Trace/diagnosis | Preserve deferred cleanup map and show the actual helper's payload-assertion branch | `tests/functional/functional_test.cpp`: `poll_and_validate`; existing RDMA close trace |

## Accuracy boundaries

- The successful ABI sequence is explicitly bounded: publishing context and
  incrementing the count happens before first common-init success, and the
  wrapper does not automatically roll those changes back on failure.
- Default selection picks usable multi-rail RDMA; otherwise it selects the
  SENDRECV candidate and deletes a remaining single-rail RDMA candidate. The
  introductory source comment's final fallback is not drawn as executable code.
- SENDRECV fabric tags come from communicator setup, rather than blindly
  forwarding arbitrary callback tags. Public success with a null request can
  require retry. `free(false)` does not decrement an unincremented inflight count.
- Ordinary sender and receiver completion branches are parallel. Neither
  establishes a cross-peer application-consumption order, and GPU visibility
  and stream dependencies remain separate.
- Registration coverage and references do not authorize remapping/freeing active
  caller storage. The 1024-byte granule is the chapter's non-Neuron teaching
  example. The MR cache does not establish allocation-generation identity.
- The four-rail example is the larger-message branch with initial rail zero and
  minimum stripe size 4096: three initial stripes reduce to two, lengths are
  4224 and 3969, and the next larger-message starting rail becomes two. No
  bandwidth measurement is inferred from the mapping.
- RDMA rendezvous excludes eager staging and guarded early completion. A ready
  control entry supplies destination metadata rather than proof of payload
  arrival. Segment retries preserve the successful-post cursor.
- Optional Gin proxy/direct branches show separately bound tables, not automatic
  direct-to-proxy fallback. Both use the shared Gin initializer; direct GDAKI
  adds capability, layout and resource validation. Tuner null context can be
  successful NCCL fallback and is separate from network failure.
- The final byte-comparison block in `poll_and_validate` is rank-one/non-CUDA.
  The CUDA flush branch is not depicted as that final byte comparison.

## Validation

- Rendered all eighteen Mermaid blocks with the installed Mermaid package in
  isolated Chromium using `node .qa/parse-visuals.mjs aws-ofi-nccl`.
- All eighteen produced SVGs with nonempty accessible titles and descriptions.
- Snapshot comparison preserves all headings, Source components, and all
  non-Mermaid fenced excerpts across the fifteen files.
- Flowcharts use top-down layout and sequences use at most four participants.
  Long self-call and handshake labels are wrapped to reduce unnecessary width.
- No upstream code, shared UI/configuration, source manifest, registry or other
  repository guide was edited. Integrated Astro build and responsive/theme
  validation remain with the primary agent.

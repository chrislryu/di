# libfabric visual architecture audit

Scope: the overview and all 14 internals chapters. Baseline:
`bf5aafceb0eba8043217dbf26c4427e059501e72`. Authored by the primary agent acting
as the dedicated libfabric author; other repositories have separate agents.

The pass adds 14 mechanism visuals, including a separate request state machine
alongside the resource hierarchy. It preserves the existing overview, hierarchy,
EFA resource map and payload-family map, adding accessible titles/descriptions.
The payload-family map now flows top-to-bottom to limit width.

| Chapter | Visual intent | Source boundary checked |
| --- | --- | --- |
| Public contracts | Endpoint-selected table dispatch and context outcome | `include/rdma/fi_tagged.h` `fi_tsend`; `include/rdma/fi_endpoint.h` |
| Capability negotiation | Required services versus supported obligations | `src/fabric.c` `fi_getinfo`; `man/fi_getinfo.3.md` caps/modes |
| Provider loading | Built-in and plugin convergence before selection | `src/fabric.c` registration, `dlsym`, initializers and getinfo loop |
| Resource hierarchy | Creation/binding map plus application request lifecycle | `man/fi_endpoint.3.md` enable/close; `man/fi_fabric.3.md`; `man/fi_domain.3.md` |
| Addressing | Rank, raw endpoint address and AV-local handle | `man/fi_av.3.md`; `man/fi_cm.3.md`; `include/rdma/fi_domain.h` |
| Tagged operations | Eight-bit ignore-mask worked example | `man/fi_tagged.3.md` matching equation |
| RMA/atomics | Peer, address/key, local descriptor and payload direction | `include/rdma/fi_rma.h`; `man/fi_rma.3.md`; `man/fi_mr.3.md` |
| Registration | Request/subrange, MR and allocation retirement | `man/fi_mr.3.md`; `prov/efa/src/rdm/efa_rdm_mr.c` cache-reference behavior |
| Heterogeneous memory | Negotiation, direct access, staging or rejection | `man/fi_mr.3.md`; `prov/efa/src/efa_hmem.c` policy validation |
| Completion/progress | Positive/EAGAIN/EAVAIL/other CQ paths | `man/fi_cq.3.md`; `include/rdma/fi_eq.h` |
| EFA resources | Finite admission gates before packet posting | `prov/efa/src/rdm/efa_rdm_msg.c` generic-send admission |
| EFA protocols | Ordered new selector separate from payload families | `prov/efa/src/rdm/efa_rdm_proto.c` registry; generic send fallback |
| Operation trace | Parallel ordinary sender/receiver outcomes | `prov/efa/src/rdm/protocols/efa_rdm_proto_eager.c` callback and construction |
| Diagnosis | Earliest failed boundary chooses source trace | Existing chapter source links for discovery/setup/admission/progress |

Semantics retained: capabilities are not obligations; loaded is not selected;
AV handles stay local; tags do not route; local descriptors are not remote keys;
MR close is distinct from immediate hardware deregistration; HMEM is not a
direct-access promise; registration does not order GPU producers; EAVAIL is not
an empty CQ; accepted work can queue before payload posting; normal candidate
order excludes forced/headerless branches; ordinary local send completion does
not establish remote application consumption; completed close can discard work.

All new diagrams include accessible text, introductions and takeaways. The state
names in the request graph explicitly describe application bookkeeping rather
than a provider enum. Numeric mask/range/pool examples are identified as teaching
examples. Existing source links supply the supporting evidence near each visual.
Site-wide build, syntax, geometry, themes and mobile checks are integrated by the
primary agent after all repository-specific passes.

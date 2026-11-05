# NIXL visual architecture audit

Scope: overview and all 14 internals chapters. Dedicated NIXL author only.
Pinned source: `c359986fed8bcf7fad6b2fa9b95d98d4b581a8e7`.

Added 14 mechanism-specific diagrams and upgraded the three existing diagrams
with accessible titles and descriptions: 17 Mermaid diagrams across 15 pages.
All existing headings, routes, source excerpts, links and invariants remain.
Every new diagram has an introduction and a takeaway describing its assumptions.

| Page | Visual question | Local source checked |
| --- | --- | --- |
| Overview | What stays with the framework versus the selected transfer backend? | `src/core/nixl_agent.cpp`; `src/core/transfer_request.h`; existing overview evidence |
| Repository map | How do public APIs, sections, requests and alternative backends connect? | `src/api/cpp/nixl.h`; `src/core/nixl_agent.cpp`; backend capability methods |
| Agent lifecycle | When can metadata work safely access agent members? | `nixlAgentData` constructor/destructor, `effectiveSyncMode`, `createBackend` |
| Descriptors | Which illustrative subrange is covered by the registration? | `nixlBasicDesc::covers` in `src/api/cpp/nixl_descriptors.h` |
| Registration | How can aggregate success coexist with a failed backend registration? | `nixlAgent::registerMem` best-effort loop and success count |
| Request preparation | Why can a dense mapping merge while an equal-size permutation cannot? | `makeXferReq` index bounds, lengths, stride equality and consecutive-index loop |
| Transfer lifecycle | How does one reusable handle relate to one active execution? | `postXferReq`, `getXferStatus`, `releaseXferReq`; active-repost tests |
| Metadata/connections | Why does successful refresh preserve handles while invalidation does not? | `loadRemoteSections`, `loadConnInfo`, `invalidateRemoteMDLocked` |
| UCX path | What work can keep a two-range request pending? | UCX `sendXferRange`, `postXfer`, `checkXfer`; request `flush`, `status`, `sendNotif` |
| Notifications | How do sender completion and receiver publication differ? | UCX pending-notification gate and active-message send; generic `getNotifs` aggregation |
| Other backends | Which memory-domain contracts distinguish local-file and remote-memory work? | POSIX `validatePrepXfer`, capability methods; libfabric capabilities and preparation |
| Python bindings | Which objects must the application retain beyond the native request? | `_api.py` opaque handle `_agent`, explicit release, descriptors from `data_ptr` and byte length |
| Telemetry/performance | Why are posting and transfer durations overlapping intervals? | `nixlXferReqH::updateRequestStats`, post timer and completion-observation sites |
| Failure/lifetimes | What remains owned after an active release is refused? | `releaseXferReq` early failure before deletion; `FailedActiveReleaseKeepsRequestPollable` |
| Code labs | Which exact eight bytes does the actual example move? | `examples/cpp/nixl_example.cpp`: source offset 16, destination offset 8, request length 8 |

Accuracy boundaries:

- Component leaves for UCX, libfabric and POSIX are alternatives, not required
  layers of one operation. Build and hardware availability remain conditional.
- Registration and prepared metadata do not own caller allocations. Python's
  handle retains its agent, not every tensor whose address a descriptor names.
- The existing text's ordinary pointer-set order versus registration creation
  vector order and prepared unordered-map default selection remains explicit.
  The dense-run graph makes no additional backend-preference claim.
- G0/G1/G2 are teaching labels for local section-object lifetimes, not serialized
  global generation fields or a remote process-health guarantee. Successful
  refresh merges. Explicit invalidation and failed section load retire.
- UCX range submission, endpoint flush, optional message-send work, initiator
  status, target message consumption and logical publication are separate.
  Parallel sequence branches impose no sender/receiver observation order.
- Cleanup can be refused while leaving a pollable handle. Successful cleanup
  does not reconstruct target bytes or implement distributed rollback.
- The coverage addresses, X/Y engine result, prepared 256-byte layout, slot
  generation protocol and 8/40-microsecond timeline are teaching examples. The
  code lab's offsets and length come from the pinned example. No benchmark or
  GPU execution is claimed.

Verification: `node .qa/parse-visuals.mjs nixl` rendered every diagram in an
isolated Playwright browser using the installed Mermaid package. Result:
15 files, 17 diagrams, zero render or accessible-title/description failures.
The primary agent owns integrated production-build and responsive/theme checks.

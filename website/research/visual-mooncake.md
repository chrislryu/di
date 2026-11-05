# Mooncake visual architecture audit

Dedicated Mooncake agent pass against local revision
`748af1a53dba2d57c110de0e7feb5613ddb8835b`. The optional vLLM integration
example retains the guide's existing separately pinned vLLM source baseline.

All 15 pages now contain diagrams: **16 new diagrams** across the 14 internals
chapters and **one upgraded overview diagram**, for **17 total**. Existing
headings, routes, frontmatter, source excerpts and links remain intact. Every
diagram has `accTitle` and `accDescr`; new diagrams have introductions and
nearby takeaways naming their assumptions. No quantitative performance claims
or hardware measurements were added.

| Page | Visual intent | Source checks |
| --- | --- | --- |
| Overview | Existing Store control/payload boundary with accessible text | Existing client/master/Transfer Engine links |
| Repository map | Master metadata, byte movement and classic/TENT alternatives | `client_service.h`, `master_service.h`, `transfer_engine.cpp` facade build/env paths and compatibility `installTransport` |
| Startup | Caller pool → registration → master mount → local UUID bookkeeping | `client_service.cpp` `Client::Create`, `MountSegmentAndGetId`, `UnmountSegmentImpl` |
| Store metadata | One object, independently published memory and pending/revoked NoF replicas | `ReplicaStatus`; `PutEndMemoryDoesNotCompleteNoFReplica` |
| Placement | Three requested versus two best-effort allocated replicas | `FailedPreferencesFallBackBestEffort` and allocator result contract |
| Transfer Engine | Public handle retirement versus internal cleanup and buffer access | `MultiTransport::freeBatchID`, `tryFreeBatchID`, active completion callback counter |
| Buffer lifetimes | Owners, non-owning slices, separate stored copy and final consumer | `client_buffer.h` owning/view constructors; synchronous client transfer path |
| Write lifecycle | Flexible memory success plus NoF revoke | `DetermineReplicaWriteMode`, `DetermineFinalizeDecision`, Put finalization ordering |
| Read lifecycle | Query deadline, completed copy, checksum and final expiry | `Client::Query`, descriptor Get, transfer-before-validation error precedence |
| Transport/topology | Receiver affinity and sender-local NIC hint namespaces | `TopologyEntry`; receiver affinity prose/source links; advisory `nic_hint` and retry contract |
| Leases/liveness | ACTIVE/SUSPECTED/OFFLINE eligibility and retention | `client_liveness.h` state predicates, observation and `EvaluateAndRetire` |
| Eviction/tiering | Pin A, release B, finish copy, later eligible reclaim | `OffloadingReclaimer::Apply`; `PinsOneReplicaAndReleasesTheRest` |
| Metadata recovery | Visible-before-durable PutEnd and separate candidate checkpoint/suffix | `PutEnd` and `AppendOpLogVisibleBeforeDurable`; `OrderedOpLogWriter::AwaitDurable`; existing snapshot/rebootstrap source links |
| Engine integration | 40-byte state/64-byte stride layout plus producer event sequence | `test_rank_local_layout_skips_block_padding`; optional vLLM worker `wait_for_save` and send-thread event synchronization |
| Diagnosis | Last successful contract chooses the next source boundary | Existing lab tests for readiness, allocation, transfer, validation, liveness and recovery |

Key safeguards:

- Classic and TENT are alternatives. The classic pointer-backed batch lifetime
  is not asserted for native TENT handles.
- `BatchCleanupDeferred` invalidates the caller's ID while physical work can
  still access referenced storage. Internal cleanup waits for task terminality
  **and** callback quiescence. The graph excludes unrelated error returns.
- A flexible write's success can coexist with revoke. This is restricted to
  the selected one-memory/one-NoF/no-DFS mode and successful metadata operations.
  An already-existing immutable Put can succeed without overwriting bytes.
- Query's local deadline starts before its metadata RPC. Copy completion does
  not override checksum failure or lease expiry; transfer errors precede both.
- Offload queue bytes are distinct from released memory, and a pinned source
  can outlive the initial reclaim run. Forced-drop alternatives remain explicit.
- Readable replica metadata, durable operation-log prefix, callback completion,
  valid mounts and surviving payloads are separate conditions. A candidate's
  validation failure retains the old installed standby state.
- The physical-layout graph labels byte adjacency rather than transfer order.
  Its two-block length is `64 + 40 = 104`, including internal padding and
  excluding only the trailing padding. This describes the test's one-layer view.
- The CUDA save fence is a specific optional connector dependency, not global
  synchronization supplied by arbitrary Store calls.

Validation: `node .qa/parse-visuals.mjs mooncake` rendered all **17/17** Mermaid
blocks in Chromium with nonempty SVG titles/descriptions. The upstream Mooncake
checkout remains unchanged. Site-wide Astro, navigation, theme and responsive
validation is handled by the primary agent.

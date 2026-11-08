# NIXL internals preparation

Inspected at the pinned local NIXL revision. Paths below are relative to
`references/nixl/`. No transfer/runtime tests were executed. These notes record
actual source branches for the forthcoming internals guide.

## Descriptor preparation and reuse

`src/core/nixl_agent.cpp::nixlAgentData::prepXferDlist` selects a local section when
`agent_name == NIXL_INIT_AGENT`, otherwise requires a cached remote section.
It takes a shared agent lock, finds candidate backends for the memory type (or
uses caller-supplied backends), and calls `section.populate` separately for each.
The result is a map from backend engine pointer to prepared metadata-stride
lists. Preparation succeeds when at least one backend's populated list exists.
It does not allocate the caller's source/destination buffers.

`src/core/transfer_request.h::nixlDlistH` owns those lists through unique pointers.
Local descriptor-list handles have an empty remote-agent string and empty weak
remote-section reference. Remote handles weakly reference the remote registration
section used to prepare them. Their identity is therefore more than a peer name.

`nixlAgent::makeXferReq` takes prepared local/remote handles plus equal-sized,
nonempty index spans. It verifies side roles, finds a common backend, rejects a
requested notification on a backend lacking notification support, then locks the
remote handle's weak registration reference. Failure returns `NIXL_ERR_NOT_FOUND`
and says descriptor lists must be recreated.

For each selected index pair it checks range bounds and descriptor lengths,
constructs request-owned initiator/target metadata descriptors, and may merge
consecutive dense strides unless `skipDescMerge` is enabled. It then calls the
selected engine's `prepXfer`. A useful worked example is local indices [1,2,3]
and remote [4,5,6] in dense equal-length runs versus a permutation that prevents
merging. Prepared lists cache backend-populated descriptor information; each
request selects an operation and subset rather than implying one permanent full
buffer transfer.

`releasedDlistH` deletes the prepared-list handle; this is distinct from releasing
a request and deregistering memory. Inspect backend registration references before
claiming arbitrary cleanup reordering. The safe instructional order remains:
complete/cancel requests successfully, release request/prepared handles,
deregister memory, then release caller allocations.

## Backend selection is capability selection

Ordinary `createXferReq` verifies equal list counts/lengths and cached peer
metadata. Without explicit candidates it obtains the common backends for local
and remote memory types. It loops through candidates and picks the first for
which both local and remote `populate` calls succeed. Source explicitly says a
preference list or more exhaustive search could be added.

Prepared `makeXferReq` similarly picks the first common backend in the supplied
ordered candidate list, or searches the intersection of prepared backend maps.
The maps are unordered. Do not describe either path as a measured optimal-path
solver. A caller's explicit backend constraint can reduce portability; installed
plugin support and usable registrations are separate conditions.

## Remote metadata refresh versus invalidation

This distinction is important enough for a worked timeline:

- `loadRemoteSections` uses `try_emplace` for a shared `nixlRemoteSection` and
  merges refreshes into that existing section. Its comment explicitly says
  partial metadata updates accumulate and weakly bound handles remain valid
  across refreshes.
- `invalidateRemoteMDLocked` erases the section, disconnects recorded backend
  connections, and removes their cached connection information. Erasing the
  owning section makes old weak references expire.
- A failed remote section load calls `invalidateRemoteMDLocked`, so a malformed
  refresh can retire the existing section and its handles.
- `loadConnInfo` accepts repeated identical connection information. Changed
  connection information for a still-cached backend returns `NIXL_ERR_NOT_ALLOWED`;
  it is not silently substituted beneath existing operations.
- Explicit invalidation followed by reload creates a new section. Reusing the
  same agent name does not make old handles valid again.

`postXferReq` checks weak-reference expiry before posting and returns
`NIXL_ERR_NOT_FOUND` for a stale handle. `getXferStatus` checks expiry while the
status is in-progress. Completed/error status is cached and not rechecked, so do
not claim every status poll revalidates remote metadata unconditionally.

Relevant tests: `test/gtest/metadata_exchange.cpp::LoadRemoteAfterSectionError`
corrupts the serialized memory-section tag, verifies the peer disappears, then
loads valid metadata again. It covers both an initially absent peer and a peer
that was already loaded. Nearby partial-metadata tests check missing connection
information and changed connection information. `md_manager.cpp` includes
`InvalidateLocalRemovesRemote` cases; the TCPStore test explicitly invalidates
remote state because that metadata service does not have watch behavior.

## Progress, completion, and notification

The generic agent delegates to backend semantics. In the UCX implementation:

- `src/plugins/ucx/ucx_backend.cpp::postXfer` submits ranges through
  `sendXferRange`, reads the backend request status, and attaches an optional
  serialized notification. If data completes immediately it sends the
  notification immediately; otherwise sending waits for later status progress.
- `checkXfer` first calls the request's `status`. It returns in-progress, clears a
  pending notification on data failure, or sends the pending notification after
  successful data completion. The resulting request status includes the
  notification send's progress.
- `src/plugins/ucx/ucx_backend_req.h::status` calls its worker's `progressLoop`
  when requests remain. It inspects request completion, releases completed UCX
  requests, retains incomplete ones, and propagates connection/error status.
- Engine `progress` iterates shared workers. `progressLoop` drains available
  progress until a call returns zero; zero is not a proof that all application
  operations have completed.
- `getNotifs` requires an empty output list, runs progress, and swaps out the
  accumulated notification list. Agent `getNotifs` aggregates results into a map
  keyed by sending agent. Notification receipt is a target-side readiness signal
  whose application meaning is chosen by the caller.

A progress thread is an available configuration, not an excuse to omit status or
lifetime handling. Conversely, do not assert that polling is always a passive
read: UCX's status path can drive progress and issue the delayed notification.

## Reposting and release failure

`postXferReq` refuses to repost an active request. It checks the old transfer
first; if it remains in-progress it returns `NIXL_ERR_REPOST_ACTIVE`. Completed
requests can be reposted, subject to current validity and backend behavior. The
trace execution counter distinguishes posts of one request handle.

`releaseXferReq` checks an in-progress request, then asks the backend to release
if it remains active. If that release fails, it returns
`NIXL_ERR_REPOST_ACTIVE` without deleting the request. The caller must retain the
handle and respect its ongoing lifetime. On successful release it clears the
backend handle before deletion to avoid a second backend release in the
destructor.

`test/gtest/unit/agent/agent.cpp::FailedActiveReleaseKeepsRequestPollable` models
exactly that sequence: post in-progress → failed release → poll success →
successful final release. Other recorder tests cover completion observed by
poll, repost, or release, and refused release/retry events.

UCX's request `release` currently cancels and releases incomplete native
requests, emits a warning, and contains a TODO about whether cancellation is
sufficient. Preserve that implementation boundary rather than claiming a
stronger general “all remote writes rolled back” contract.

## Useful source-reading tests

- `PreparedTransfersPreserveBinaryBackendParameters` checks propagation of binary
  backend custom parameters on prepared-request paths.
- `XferReqTest` demonstrates ordinary request creation, completion, reposting,
  notification retrieval, and release with mock engines.
- `test/gtest/test_transfer.cpp` contains parameterized payload and notification
  operations, including `ManyDescriptorsPayload`, `NotificationOnly`,
  `SelfNotification`, and `EmptyNotificationPayload`.
- `metadata_exchange.cpp` covers metadata merge/error handling independently of
  the actual payload tests.

The authoring guide should state which are mock contract tests and which require
an actual configured transport. File presence alone does not establish a hardware
integration result.

# NIXL editorial simplification

Rewrote the overview and all fourteen chapters for a developer tracing the main
architecture and decision flow. Preserved routes, frontmatter, titles and the six
overview anchors. No published incoming links targeted the removed chapter
fragments. The source revision remains
`c359986fed8bcf7fad6b2fa9b95d98d4b581a8e7`.

## Editorial choices

- Organized each page around purpose, a useful visual, the main owners and
  handoffs, material decisions, and a compact source route.
- Removed test inventories, mandatory exercises/answers, repeated mock-versus-
  hardware disclaimers, exact flag precedence and per-status branch tours.
- Replaced the pointer-order and dense-merge permutation discussion with ordinary
  construction versus prepared-list reuse versus completed-request reuse.
- Consolidated repeated metadata-generation and refused-release examples into
  their architectural lifetime implications. Removed the duplicate refresh
  sequence from the code labs and repeated invalidation graph from failures.
- Shortened the final labs to one actual example traced from setup to retirement.
- Replaced detailed startup, preparation, registration, lifecycle, UCX,
  notification and failure visuals with simpler main-path diagrams. Fifteen
  accessible diagrams remain across fifteen pages.

## Technical details retained and checked

- Registration establishes backend access to caller storage; aggregate success
  means at least one candidate succeeded. Checked `registerMem` and local-section
  population in `src/core/nixl_agent.cpp`.
- Request and prepared handles retain access information rather than allocation
  ownership. Checked `src/core/transfer_request.h` and ordinary/prepared APIs.
- Successful metadata refresh merges into the existing section; invalidation or
  failed section load retires it. Reloading a peer name does not repair old weak
  references. Checked `loadConnInfo`, `loadRemoteSections` and
  `invalidateRemoteMDLocked` in the core.
- One active execution per request, and refused release preserves a live handle.
  Checked `postXferReq`, `getXferStatus` and `releaseXferReq`.
- UCX tracks range operations, endpoint flush and asynchronous notification send.
  Associated messages follow successful data/flush completion; receiver
  consumption/publication remains separate. Checked `postXfer`, `checkXfer` and
  `src/plugins/ucx/ucx_backend_req.h`.
- Libfabric and POSIX are capability alternatives. POSIX uses local DRAM/FILE
  ranges and has no remote or notification capability. Checked both backend
  capability declarations and their existing source-linked implementations.
- Python handles retain their agent, while address descriptors do not retain
  tensors. Native negative statuses throw across the binding. Checked `_api.py`
  and `src/bindings/python/nixl_bindings.cpp`.
- Posting and transfer durations overlap at a common origin. Checked
  `nixlXferReqH::updateRequestStats` in the agent implementation.
- The C++ example moves source `[16,24)` to destination `[8,16)`, both relative
  to allocation bases. Checked its actual descriptor setup and cleanup.

## Size and validation

The consistent prose count excludes frontmatter, fenced code/diagrams and MDX
tags. Before: **19,730 words**. After: **5,722 words**, about **71% shorter**.
Pages generally use four to six sections; no minimum-length padding was added.

`node .qa/parse-visuals.mjs nixl` passed: **15 pages, 15 diagrams, zero failures**.
It renders in an isolated Chromium DOM and verifies SVG title/description text.
The primary agent runs
integrated build, source, links and responsive checks. No shared UI, registry,
source manifest, upstream repository, or other guide was changed by this pass.

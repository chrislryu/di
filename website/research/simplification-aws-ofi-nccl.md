# AWS OFI NCCL editorial simplification

Reviewed and rewrote the overview and all fourteen chapters for a new developer
following architecture and decision flow. Prose falls from 17,085 to about 5,631
words, a 67% reduction, with fifteen focused diagrams. Page routes, frontmatter
titles and six overview anchors are preserved; no incoming published chapter
fragment links needed repair.

The retained spine is NCCL callback → interface wrapper/common API → selected
communicator → libfabric/provider work → request progress/completion → consumer
handoff. Each chapter now explains its purpose, owners, normal operation, major
choices and short source route.

Removed or merged ABI-version wrapper inventories, initialization refcount cases,
fine-grained parameter/fallback trees, PCIe predicate fixtures, request free-flag
details, MR granule arithmetic, exact stripe calculations, test-helper assertion
branches, mandatory exercises and repeated negative caveats. Three diagrams were
removed overall; dense conditional visuals were replaced by interface, selection,
resource, interval and progress maps.

Retained technical contracts:

- NCCL collective policy, plugin transport and provider selection have distinct owners.
- Explicit transport requests can fail; the actual default branch selects usable
  multi-rail RDMA or otherwise SENDRECV without inventing a final single-rail fallback.
- Null request before SENDRECV acceptance requires retry, distinct from accepted
  work; RDMA can retain internal pending work.
- Allocations, registration references, request entries and backing pools have
  separate lifetimes. MR coverage and endpoint scope are not allocation identity.
- SENDRECV uses its communicator tag; RDMA rendezvous advertises destinations
  before payload writes and aggregates protocol events.
- Rail schedules specify payload intervals; GPU visibility and consumer ordering
  remain separate from fabric events.
- Tuner and Gin are optional interfaces with different owners; proxy/direct Gin
  paths are selected contexts rather than automatic fallback stages.
- Public communicator inactivity can precede final RDMA cleanup retirement.

Checks used the pinned local source and prior source/visual audits. The current
default pointer selection in `src/nccl_ofi_net.cpp`, MR reference removal in
`src/nccl_ofi_mr.cpp`, and registration representations in `include/nccl_ofi_mr.h`
were rechecked directly. All 25 retained Source paths exist. Isolated Mermaid
rendering produced SVG title/description text for all fifteen diagrams; the final
result is in `.qa/simplification-aws-ofi-nccl-render.log`.

No upstream implementation, shared UI, registry, source manifest or other guide
was modified. The parent owns integrated build, links and browser validation.

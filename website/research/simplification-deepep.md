# DeepEP editorial simplification

Reviewed and rewrote the overview and all fourteen chapters for a new developer
tracing architecture and consequential decisions. The 15 published routes,
frontmatter/titles, pinned revision and six overview anchors remain unchanged.
No incoming published chapter-fragment links targeted the merged sections.

## Result

Prose fell from 18,663 words to 6,164 words, a 67% reduction using
the shared count method (frontmatter, fenced code/diagrams and component tags
excluded). Each chapter now explains purpose, the ordinary flow and its owners,
a few choices that change that flow, and a compact source-reading route.

Fifteen useful diagrams remain. The communicator acquisition graph is replaced
with a group → host handle → device context → topology/algorithm map. The
duplicate execution/storage branch graph and detailed aligned-end walkthrough
are removed; one stream-ordering visual and one layout comparison supply their
architectural lesson.

## Cuts and merges

- Removed mandatory exercises, detailed fixture assertions and repeated test
  provenance discussions.
- Removed per-flag, mutation-detection exception, kernel-template, byte-packing,
  scale-stride and progress-tail loop inventories.
- Condensed expert range arithmetic to the valid-work versus aligned-capacity
  relationship, leaving exact prefix conventions in the source link.
- Merged repeated asynchronous caveats into the producer/consumer and storage
  ownership explanation.
- Reduced experimental families to one bounded operation comparison rather than
  separate test and option tours.

## Architectural contracts retained

- Engine-owned routing/expert math versus DeepEP-owned dispatch/combine.
- Ordered process groups, borrowed/managed host communicator lifetime, Gin device
  context and physical versus logical domains.
- Workspace/communication/LB regions, shared maximum capacity and distributed
  buffer teardown.
- Immutable referenced routing, fresh versus compatible cached placement, source
  identity and return mapping.
- Rank-level transport deduplication versus expert-slot expansion, actual work
  versus capacity, and value/scale representation.
- Host preparation → main movement → expert-facing epilogue, including the major
  exact-count/capacity and immediate/deferred choices.
- Direct versus hybrid movement, local forwarding and publication before reading.
- Return movement and configurable reduction placement, separate activation and
  weight outputs, engine-owned gating semantics.
- Producer/result event ordering and storage lifetime, without enumerating every
  stream-recording implementation branch.
- Compilation reuse versus routing reuse, precision/capacity/resource budgets,
  replica ownership and additive gradients, optional experimental APIs.

## Source checks and validation

The local source remains at `f6aa38fe06cd4a0489e7730365d4e0114970a2f3`.
Checked the public `EPHandle`, `dispatch` and `combine` contracts; native stream
prologue/epilogue and size helpers; topology/domain construction; event wait hooks;
and the existing source-grounded movement/layout/reduction explanations. All 24
distinct retained Source paths exist in the pinned git tree. The one retained
short source assignment is actual implementation.

`node .qa/parse-visuals.mjs deepep` passed: 15 files, 15 diagrams, zero failures,
with nonempty accessible SVG titles and descriptions. All frontmatter blocks and
the six overview headings were checked against the before snapshot. No upstream,
shared UI, registry, source manifest or other guide was modified. Root handles
the integrated build, content/link checking and responsive/browser validation.

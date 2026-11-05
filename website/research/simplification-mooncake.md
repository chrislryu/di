# Mooncake editorial simplification

Reviewed and rewrote the overview and fourteen chapters for a new developer
tracing high-level architecture and decision flow. Prose fell from **19,695 to
5,705 words (71%)**, excluding frontmatter, fenced code/diagrams and MDX tags.
The guide retains fifteen focused diagrams, one per page.

Merged repeated mechanism descriptions and removed fixture/test inventories,
routine exercises, per-option/per-medium branch catalogs, detailed clock and
checksum examples, candidate-iteration cases, buffer geometry arithmetic and
manifest/recovery permutations. Source-reading routes now lead directly through
the main symbols rather than narrating those specialist cases.

Retained the architectural contracts:

- Transfer Engine moves ranges; Store owns object metadata, placement and reuse.
- Classic and TENT are alternatives; optional engine/storage integrations remain optional.
- Registration/mount readiness and placement host identity differ from network reachability.
- Allocation, payload completion, publication and validated engine consumption are separate stages.
- General placement can return a best-effort allocation; write policy interprets the actual set.
- Immutable Put does not overwrite an existing object's bytes.
- Read validation follows copy, including applicable integrity and lease protection.
- Caller buffers, stored replicas, batch handles and final consumers have distinct owners.
- Classic deferred cleanup can invalidate a public handle while work still references buffers.
- Read leases, liveness retention, eviction and offload pins protect different relationships.
- Readable metadata can precede durability; recovery needs valid metadata and surviving storage.
- The optional vLLM connector supplies compatible keys/layouts, producer fences and accepted-load handoff.

Existing pinned source and visual audits supported the unchanged mechanisms.
Checked the liveness predicates/transitions, classic deferred cleanup, write-mode
finalization, visible-before-durable PutEnd path and key public source symbols.
All retained Source paths exist in their respective local Mooncake/vLLM snapshots.

All published routes and frontmatter titles remain unchanged; the six overview
anchors are preserved. No incoming published Mooncake chapter-fragment links were
found. No upstream, registry, shared UI or other repository guide was modified.

Validation: `node .qa/parse-visuals.mjs mooncake` rendered all **15/15** diagrams
with accessible SVG titles/descriptions. Root handles the integrated build,
source/anchor checks and browser verification.

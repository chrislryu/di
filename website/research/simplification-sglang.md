# SGLang editorial simplification

Dedicated repository scope: the overview and all fourteen chapters. Baseline
`a16830deb5ea5b1e8c9874ad646f3ba95542191c` remains unchanged. Published routes,
frontmatter titles, navigation and six overview anchors are retained. No incoming
published link targeted the removed SGLang chapter fragments.

## Editorial result

Rewrote every page around its purpose, normal operation, ownership, consequential
decisions and a short source route. Before/after prose counts use the same method
as the root snapshot: exclude frontmatter, fenced code/diagrams and component tags.
The pass reduces approximately 19,126 words to 5,700 words (about 70%). Chapters
use the space needed for the architectural question rather than a word quota.

Removed the fixture/test inventories, mandatory exercises, repeated warnings,
per-option implementation detours and duplicate worked states. Deeper specialist
detail remains available through the pinned implementation and earlier evidence.

Fifteen focused diagrams remain, each with accessible title/description and a
nearby explanation. The scheduler diagram now follows admission → plan → worker
→ reconciliation. The memory diagram shows request mapping → allocator/pool
ownership instead of page arithmetic. Removed the radix-lock second diagram,
restorable-set counterexample, staging-watermark graph, sampling row-filter map
and duplicate overlap ownership view. Their architectural implications fit the
main explanation without reproducing branch permutations.

## Technical details retained

- TokenizerManager frontend state differs from scheduler request ownership;
  dispatched cancellation must reach the scheduler and follow its retirement.
- Startup joins worker readiness with frontend/output setup and reported limits.
- Policy ordering differs from resource admission; maintained running state can
  differ from the batch selected for the current iteration.
- Radix values index KV payload; splits refine references rather than duplicating
  all K/V. Compatible namespace identity and lock-protected lifetime remain clear.
- Request mappings, allocator availability and physical KV tensors have distinct
  roles. Cached or pending ownership can outlive an individual request.
- Model loading resolves architecture, artifacts and rank-local installation;
  Q/K/V packing and required post-load state remain represented.
- Overlap retains the metadata interpreting old results, orders mutation behind
  required shared reads, and preserves storage lifetime. Stream waits do not imply
  blanket CPU synchronization. Sampling can depend on prior accepted output.
- Replica placement differs from rank cooperation and local admission. Pipeline,
  context and expert layouts are bounded extensions of that model.
- Tier lookup and transfer submission precede valid device publication. Required
  pools/participants must agree on usable restored state.
- Separated stages distinguish reservation, payload movement, publication and
  scheduling. NIXL and Mooncake remain configured alternatives. Staging retains
  its lifetime requirement without a round/watermark tutorial.
- Scores, chosen/accepted IDs, text and response chunks remain different outputs.
  Sampling state follows request identity as batch rows change.

## Source and rendering checks

Re-read normal/overlap scheduler loops and the result queue/barrier boundary;
TokenizerManager dispatch marking and failure cleanup; radix split implementation;
and startup readiness, pool, forward representation and loading entrypoints.
Other simplified statements retain their existing audited source contracts.
All retained or added Source component paths exist in the pinned local checkout.

`node .qa/parse-visuals.mjs sglang` passed: **15 files, 15 diagrams, zero failures**,
with nonempty rendered SVG titles and descriptions. No upstream, shared UI,
registry, source manifest or other repository guide changed. The parent performs
the final build, link/anchor and responsive navigation checks after integration.

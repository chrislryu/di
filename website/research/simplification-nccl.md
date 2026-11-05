# NCCL simplification review

Reviewed and rewrote the overview plus all fourteen chapters for a developer
tracing architecture and consequential decisions. All fifteen routes and the
overview's six published section anchors remain. Chapters now have five main
sections; the overview retains its six-section structure.

Prose counts exclude frontmatter, code/diagram fences and MDX tags, using the
same calculation against `.qa/simplification-before`. Before: 17,175 words.
After: 6,503 words, approximately 62% shorter. The overview is about 575 words;
chapters are approximately 370–510 words. Coverage follows the learning question
rather than a minimum length.

## What changed

- Replaced question/learning-objective preambles with direct explanations of
  the customer operation and the subsystem's responsibility.
- Merged repeated setup, owner, failure and source-reading discussions into
  one main flow and a short reading route on each page.
- Removed mandatory exercises, repeated external-test provenance, test/fixture
  inventories, invented tuning arithmetic and detailed version/flag cases.
- Reduced the legacy/raw-task rearchitecture discussion to one scoped note in
  task planning. Other pages link to it instead of restating the gate.
- Consolidated overlapping proxy, signal and all-reduce diagrams. Sixteen
  diagrams remain, with at least one useful visual on every page. Task planning,
  NET progress and device networking have simpler responsibility diagrams.
- Removed duplicate numerical examples and detailed line-layout illustrations;
  retained the all-reduce result and the ring's chunk-ownership walkthrough.

## Important details retained

- Framework operation semantics, element counts, rank/device identity, matching
  collective order and CUDA dependency/tensor lifetime.
- Communicator/bootstrap setup, local topology scope, communication graph
  candidates and channels as parallel work lanes.
- Algorithm versus protocol versus transport; eligible selection before cost;
  bounded task/plan/kernel ownership; general ring/tree dataflow.
- Credit and readiness ownership in Simple/LL/LL128 without individual wrap,
  load alignment, flag-thread or socket/RDMA case inventories.
- P2P mapping/import versus SHM domain requirements; built-in network paths
  versus optional external plugins.
- NET acceptance versus completion, receiver visibility, returned sender credit,
  and GPU/proxy/backend observations used to locate a stall.
- Device communicator/window prerequisites and strong/weak Gin signal scope.
- Registration references, captured work lifetime, and independent host-plan,
  copied-proxy, tensor and communicator retirement.

## Source and validation

All claims use the existing pinned NCCL snapshot. Focused source checks included
the public collective and communicator contracts, tuning validity/cost selection,
NET request acceptance and credit publication, tree/ring roles, LL layout
assumptions, Gin capability contracts, and host-plan/proxy handoff.

- All 70 retained `Source` paths resolve in the local Git object database and
  their line ranges fit the corresponding pinned files.
- `node .qa/parse-visuals.mjs nccl`: fifteen files, sixteen diagrams, zero
  failures; every rendered SVG has a title and description.
- No published incoming NCCL chapter-fragment links were found before section
  merging. Routes and overview anchors are retained.
- No upstream source, shared UI, registry, source manifest, or other repository
  guide was changed. Parent owns the final site build, links and browser checks.

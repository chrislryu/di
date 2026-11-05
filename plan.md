# Developer onboarding guide website plan

Baseline status (2026-11-04): the initial curriculum and local static website are
implemented in `website/`. Source revisions are pinned in
`website/src/data/sources.json`; author-facing evidence is in `website/research/`.
Use `npm run validate` from `website/` for the reproducible build and content
checks. Hardware-dependent inference and networking examples remain optional
exercises; no GPU or multi-host execution is claimed. GitHub Pages hosting is
configured for `https://chrislryu.github.io/di/`.

## Comprehensive internals expansion

Completed 2026-11-04: all ten 15-page repository guides are authored and
independently source-reviewed. The build contains 179 HTML pages; all 140 new
chapters pass registry, navigation, preserved-anchor, and source checks. Website
validation includes 16 checker tests, 263 browser checks, and 62 diagram geometry
inspections. Hardware-dependent examples remain source-reading exercises; no
GPU or multi-host workload was executed.

Expand all ten repository guides to 15 pages each: the existing overview and 14
internals chapters. The ordered route/title/outcome contract is maintained in
[the guide registry](website/src/data/guides.json). Existing project URLs and
source revisions remain stable.

The original internals expansion emphasized exhaustive mechanism coverage. The
editorial simplification below replaces its length and section requirements.

- [x] Calibrate the complete vLLM guide with independent source review.
- [x] Complete SGLang, DeepInfer, and Dynamo chapters.
- [x] Complete NIXL, Mooncake, NCCL, and DeepEP chapters.
- [x] Complete AWS OFI NCCL and libfabric chapters.
- [x] Independently review every repository chapter set.
- [x] Validate registry, chapter navigation, source evidence, search, diagrams,
      desktop/mobile layouts, and the production build.

The primary agent owns shared UI, the registry, and integration. Assign a dedicated
agent to each repository and its evidence ledger; do not assign repository groups
to one agent. Run up to three repository agents concurrently, starting a new
dedicated agent for each remaining repository in subsequent batches. Rotate
completed guides to a different agent for source review. Chapter previous/next
navigation stays within the repository;
overviews retain the global newcomer path. Incomplete sets stay out of the
primary sidebar. Preserve the local-network preview at 0.0.0.0:4322.

## Visual architecture expansion

Completed 2026-11-04: all 150 repository overview and chapter pages now include
visual explanations, with 185 Mermaid diagrams in total (160 added). Each
repository had a dedicated author checking its pinned local source. Visual intent
and source checks are recorded in `website/research/visual-<project>.md`. Existing
headings, routes, source links, excerpts, and shared system maps are preserved.

Validation passed: the 179-page build, all 16 checker tests, strict source and
guide checks, 388 distinct browser checks (391 executions in four batches), and
600 page/viewport/theme geometry checks covering 740 diagram inspections. Every
architecture SVG has accessible title/description text; labels retain 16px type
and oversized diagrams scroll locally. Both themes and 1440px/390px layouts pass.
The earlier heading-divider and sidebar-selection fixes also pass at three
viewports in both themes. Preview remains bound to `0.0.0.0:4322`.

Review every overview and internals chapter for a visual explanation of its main
mechanism. Use component maps for boundaries, sequences for interactions, state
machines for lifecycle, memory/block layouts for ownership and indexing, and
decision graphs for conditional paths. Prefer conceptual diagrams over invented
performance curves. Preserve precise source excerpts, invariants, routes and
anchors; replace repetitive relational prose when the diagram teaches it better.

Every new diagram must have a useful question, concise labels, accessible title
and description, and a nearby explanation of its assumptions and takeaway. Check
it against the repository's pinned source. Distinguish optional alternatives from
required dependencies, and do not let an arrow imply completion, ownership or
ordering the implementation does not establish. Validate Mermaid rendering,
local scrolling, and readable labels in light/dark themes on desktop and mobile.

## Editorial simplification

Completed 2026-11-04: a dedicated reviewer rewrote each repository's overview and
fourteen chapters. Across all 150 pages, prose fell from 187,016 to 61,344 words
(67.2%); 158 focused diagrams remain. Chapters now emphasize purpose, component
ownership, an ordinary operation, consequential decisions and a short source route.
Repeated caveats, minor branch inventories, fixture tours and routine exercises
were deleted or merged. Key memory, progress, publication and synchronization
contracts remain explicit.

The project index, reading path, chapter descriptions and authoring templates now
follow the same editorial level. Selected lab/compatibility titles were shortened
to describe their architectural outcome. Published routes and chapter ordering
remain stable; retained source links and the six overview anchors pass checking.
Repository-specific editorial audits are in
`website/research/simplification-<project>.md`.

Integrated validation passed: the 179-page production build, all sixteen checker
tests, strict source checks, 388 distinct browser checks across four batches, and
600 architecture page/viewport/theme checks covering 632 diagram inspections.
All diagram labels retain 16px type, accessible descriptions and local scrolling.
Search, keyboard navigation, all 178 published mobile pages, overview anchors,
and chapter boundaries pass. The heading-divider and sidebar-selection regression
checks pass at three viewports in both themes. Preview remains on `0.0.0.0:4322`.

The guide serves a new developer tracing high-level architecture and decision
flow. Review each repository with one dedicated agent. Reword, delete and merge
material that obscures that task. Retain the purpose, component ownership, normal
operation, important lifetime/synchronization boundaries, and the few decisions
that change the architecture. Keep useful diagrams and direct routes into source.

Replace the former chapter length and mandatory-section requirements. Around
400–750 prose words and four to six sections often suffice; use the space the
mechanism needs. Remove repeated caveats, fixture inventories, exhaustive option
and version cases, redundant examples, and routine exercises. Keep a precise
exception only when omitting it would teach an incorrect architectural model.
Specialist detail can stay in the linked source and author evidence.

Preserve published routes, navigation and the six overview anchors. Merge chapter
sections freely while repairing links to removed anchors. Check source fidelity,
rendering, links, navigation and mobile layouts after integration. Record each
repository's editorial choices in `website/research/simplification-<project>.md`.

## Objective

The overview map groups inference engines and GPU communication in one shaded
model-execution area, with a source-backed vLLM → NCCL call. KV-state movement
stays on its optional path outside that area. This clarification preserves the
ten project links and the existing compact map. Build/source checks, 48 map
theme/viewport checks and 138 navigation/browser checks passed.

Build a source-grounded architecture website for a developer who knows software
development but is new to distributed AI/ML computing. Organize learning from
customer needs to system behavior, repository architecture, and source code.

The initial curriculum focuses on distributed inference and its communication
stack. Explain how latency, throughput, reliability, and infrastructure cost
motivate the architecture. Define unfamiliar concepts before relying on them.

Deliver an introduction connecting the stack, ten repository guides, shared
concept explanations, cross-repository walkthroughs, and decision guides.

The development environment uses Astro + Starlight in `website/`, with strict
TypeScript, Markdown/MDX, Mermaid, and Pagefind search. See
[`website/README.md`](website/README.md) for setup and authoring commands.

## Information architecture

Use five main navigation sections, with search and a shared glossary available
throughout the site.

| Section | Contents | Reader outcome |
| --- | --- | --- |
| Start here | Customer problems, scope, system map, reading paths | Understand why the stack exists and where to begin |
| Core concepts | Inference lifecycle, scheduling, memory, parallelism, communication | Learn the vocabulary and mental models |
| Architecture guides | One guide per repository, grouped by primary role | Understand responsibilities, components, and implementation |
| End-to-end walkthroughs | Concrete operations spanning repositories | See how components cooperate |
| Decision guides | Conditions, options, tradeoffs, and supporting evidence | Apply the architecture to engineering choices |

### Homepage and introduction

Make the primary homepage action **Follow your first request**. Also provide
direct access to the system map and project index for returning readers.

The introduction should:

- Explain the customer problem and why a single inference engine can eventually
  require additional orchestration, memory management, and communication layers.
- Introduce the API-to-engine request path, GPU execution, state movement, and
  network communication without assuming a particular deployment.
- Show a clickable system map with a short explanation of each project's role.
- Distinguish control flow, data flow, required dependencies, optional
  integrations, and alternative implementations using labeled arrows and a legend.
- Explain that the ten projects do not form a mandatory linear dependency chain.
- Offer a newcomer reading path and a direct route to each repository guide.

### Core concepts

Create focused pages that can be read independently and linked from guides:

1. Request lifecycle: tokenization, prefill, decode, and streaming output.
2. Scheduling: queues, continuous batching, and resource constraints.
3. KV cache: purpose, ownership, reuse, offloading, and transfer.
4. Parallelism: data, tensor, pipeline, context, and expert parallelism.
5. Disaggregated serving: separating prefill and decode and scaling each stage.
6. GPU and host topology: processes, devices, memory, NVLink, PCIe, and NICs.
7. Communication: point-to-point transfers, collectives, and MoE dispatch/combine.
8. Networking: RDMA, fabric providers, and AWS Elastic Fabric Adapter (EFA).
9. Performance and reliability: latency versus throughput, bottlenecks, and failure
   boundaries.

Keep definitions in one shared glossary and link terms to their fuller concept
pages. Introduce concepts progressively in walkthroughs rather than requiring
readers to finish every concept page before starting.

### Architecture guide organization

Give every repository one canonical guide. Group guides by primary role, with
cross-links for projects that span several roles.

| Group | Guide | Local source |
| --- | --- | --- |
| Serving orchestration | Dynamo | `repositories/dynamo` |
| Inference engines | vLLM | `repositories/vllm` |
| Inference engines | SGLang | `repositories/sglang` |
| Inference engines | DeepInfer | `repositories/deepinfer` |
| Data movement and shared state | NIXL | `repositories/nixl` |
| Data movement and shared state | Mooncake | `repositories/mooncake` |
| GPU communication | NCCL | `repositories/nccl` |
| GPU communication | DeepEP | `repositories/deepep` |
| Network integration | AWS OFI NCCL | `repositories/aws-ofi-nccl` |
| Network integration | libfabric | `repositories/libfabric` |

These categories organize learning; they do not define exclusive capabilities
or establish integration support.

Use this progression for each guide:

1. **Why it exists.** Customer need, motivating example, when to use it, and scope.
2. **Where it fits.** Highlight the project in the system map and explain its
   inputs, outputs, adjacent systems, and boundaries.
3. **Architecture overview.** Explain major components, responsibilities,
   interfaces, state ownership, and process/device/network boundaries.
4. **Follow an operation.** Trace a representative operation from entrypoint to
   completion, linking the steps to source. Include relevant initialization,
   coordination, data movement, and failure behavior.
5. **Decision gates.** Separate choices made by developers and operators from
   runtime decisions. State triggers, options, tradeoffs, and the responsible layer.
6. **Explore the code.** Provide entrypoints, key files and symbols, relevant
   examples or tests, a short code-reading order, and related guides.

Include a compact prerequisite list and inspected source revision on each guide.
Keep the overview readable on its own; move extensive interface or configuration
details to linked subpages when needed. Adapt the walkthrough to the project:
a communication library should follow a communication operation.

### End-to-end walkthroughs

Build walkthroughs in increasing order of complexity:

| Walkthrough | Main learning goal |
| --- | --- |
| One inference request | Follow arrival, scheduling, GPU execution, and streamed tokens through one engine |
| Separate prefill and decode | Follow worker selection, KV-cache transfer, and continued generation |
| Distributed MoE inference | Follow token dispatch, expert execution, and result combination across devices |
| A network operation on AWS | Trace a supported NCCL → AWS OFI NCCL → libfabric path and the relevant fabric provider |

Choose an exact, source-verified configuration for each walkthrough. Name the
participating projects, model assumptions, hardware, and configuration. Explain
which steps are common concepts and which belong to that implementation.

Include a sequence diagram, state ownership at each step, source entrypoints,
and a short check-your-understanding exercise. Code-reading exercises should be
usable without a GPU cluster; runnable extensions must state their requirements.

### Decision guides

Start with these engineering questions:

- Which inference engine fits the workload, model, and hardware?
- When should prefill and decode run separately?
- Which parallelism strategy addresses the current constraint?
- Where should reusable KV cache live, and how should it move?
- Does an operation need a collective, a point-to-point transfer, or specialized
  expert-parallel communication?
- Which network path applies to the deployment, and how can it be verified?

Use a consistent decision table: situation, evidence to collect, available
options, tradeoffs, prerequisites, and links to deeper explanations. Keep support
claims tied to the inspected versions and configuration. Avoid universal
performance rankings.

## Reading paths and navigation

Provide a default learning path:

1. Customer problem and system map.
2. One inference request, with concept explanations linked at the relevant step.
3. One engine guide, starting with vLLM.
4. Dynamo and the prefill/decode walkthrough.
5. NIXL and Mooncake for state movement and shared caching.
6. NCCL and DeepEP for GPU communication and expert parallelism.
7. AWS OFI NCCL and libfabric for the network path.
8. SGLang and DeepInfer to compare engine architecture and boundaries.

Allow readers to enter any project directly. Show prerequisites, breadcrumbs,
an on-page table of contents, related concepts, and next steps. Previous/next
links should follow the selected learning path.

Reuse the same layer names, colors, and diagram legend throughout the site.
Highlight the current project's location in the shared map. Ensure labels and
text explanations carry meaning independently of color or hover interactions.

## Source and content model

- Author content at the workspace level, separate from upstream checkouts.
- Use stable routes under `/start/`, `/concepts/`, `/architecture/`,
  `/walkthroughs/`, and `/decisions/`, with `/glossary/` for shared vocabulary.
- Store prose in Markdown or MDX and keep diagrams alongside the content that
  owns them. Use relative links between pages.
- Record repository origin, inspected commit SHA, and review date for each guide;
  record all participating revisions for cross-repository walkthroughs.
- Verify important claims against implementation, examples, tests, and upstream
  documentation. Verify integrations at both ends where source is available.
- Use commit-pinned upstream source links in the rendered site so code references
  remain usable outside the local workspace.
- Distinguish the public implementation from a project's broader production
  system, design proposals, and roadmap. State unresolved questions explicitly.

## Execution phases

### 1. Establish the source baseline

- [x] Inventory the ten checkouts and record their inspected revisions.
- [x] Read repository instructions, READMEs, architecture docs, public interfaces,
  examples, and the implementations behind central claims.
- [x] Build an evidence-backed relationship map, including optional integrations
  and implementation boundaries.
- [x] Record open questions and select supported configurations for walkthroughs.

### 2. Establish the curriculum and page template

- [x] Draft the introduction, system map, glossary, and reading path.
- [x] Create the navigation and content skeleton for all five sections.
- [x] Write one complete engine guide and its single-request walkthrough to
  validate the depth, terminology, diagrams, and source-link conventions.
- [x] Apply the resulting template to the remaining guide outlines.

### 3. Complete the repository guides

- [x] Write the inference-engine guides: vLLM, SGLang, and DeepInfer.
- [x] Write the orchestration guide: Dynamo.
- [x] Write the data-movement guides: NIXL and Mooncake.
- [x] Write the GPU-communication guides: NCCL and DeepEP.
- [x] Write the networking guides: AWS OFI NCCL and libfabric.
- [x] Cross-check boundaries and terminology across all ten guides.

### 4. Connect the stack

- [x] Complete the core-concept pages and shared glossary.
- [x] Complete all four walkthroughs with verified configurations and source links.
- [x] Write the decision guides and connect them to the relevant concepts and code.
- [x] Reconcile the introduction and system map with the completed guides.

### 5. Implement the website

- [x] Choose Astro + Starlight for static rendering, Markdown/MDX, diagrams,
  search, and accessible navigation.
- [x] Implement the homepage, sidebar, project index, breadcrumbs, and page layout.
- [x] Implement the clickable system map, learning-path navigation, glossary
  links, source references, and revision metadata.
- [x] Verify desktop and mobile layouts and keyboard navigation.
- [x] Document local preview and build commands and produce a reviewable build.

### 6. Validate the onboarding experience

- [x] Walk the newcomer path and check that terminology is explained before use.
- [x] Follow one operation across repository boundaries and reconcile every handoff.
- [x] Check internal links, source links, anchors, diagrams, and search results.
- [x] Run the site's build and relevant content checks.
- [x] Check decision tables for unsupported claims and missing prerequisites.
- [x] Confirm that exercises distinguish source inspection from hardware-dependent
  execution and that performance claims retain their measurement context.

## Completion criteria

The website is ready for review when:

- All ten guides explain customer purpose, system role, architecture, major
  components, a concrete operation, decision gates, and a source-reading path.
- The introduction connects the projects without implying unsupported or
  mandatory integrations.
- The five navigation sections, glossary, search, and reading paths work.
- All four walkthroughs identify supported configurations and participating
  source revisions.
- A developer can move from a customer requirement to an architectural choice,
  then follow that choice into relevant code.
- The site builds successfully and its links and diagrams render correctly.

This plan defines the content and implementation work. Astro + Starlight is the
selected framework; GitHub Pages is the hosting target, built from `main` in
`chrislryu/di`. Production uses the `/di` base path; local preview defaults to `/`.

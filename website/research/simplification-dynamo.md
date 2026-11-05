# Dynamo simplification review

Scope: the overview and all 14 Dynamo chapters. The dedicated Dynamo pass
rewrites the guide for a new developer tracing architectural ownership and
consequential decisions. The pinned source revision remains
`73014901d4e7610358fcf28535418ba9c5f50812`.

## Result

Prose words, excluding frontmatter, fenced code/diagrams, and HTML/MDX tags:
**17,764 → 6,818 (61.6% reduction)** across 15 pages. Chapters now average about
450 prose words. All routes, frontmatter identities, and six overview anchors
remain stable. Diagrams are reduced from 18 to 15: the guide retains one useful
visual per page and consolidates low-level branch/guard views into architectural
flows. Every retained/new diagram has an accessible title and description.

## Editorial decisions

- Center each chapter on the owner, main path, key technical invariant, and a
  short source route. Merge overlapping subsections into four to six sections.
- Remove mandatory exercises/answers, test-fixture inventories, repeated caveats,
  exhaustive flags, version/configuration cases, and repeated worked timelines.
- Replace the registration-refcount sequence with publication → discovery →
  watcher → selection → call, keeping registration ownership in short prose.
- Replace the admission-mode branch tree with eligibility → cost comparison →
  worker selection → dispatch/accounting. Keep booked versus inspection use and
  booking ownership precise without expanding every guard implementation.
- Replace Planner lock/generation diagrams with observation → decision → effect
  admission → environment → observed capacity. Explain stale decisions and
  unacknowledged effects as two core control-loop rules.
- Replace deferred-abort event branches with cancellation propagation and safe
  resource retirement. Keep first engine output as the selected vLLM safeguard,
  including adapter ownership of deferred-task cleanup on failure.
- Keep the useful cache-prefix example, frontend typed pipeline, effective-startup
  limits, metadata/payload distinction, and KVBM asynchronous-retention visual.
- Recast code labs as a compact source-reading route with stage-handoff and
  capacity-control extensions rather than four compulsory labs.

## Important mechanisms retained

Frontend/router/runtime/adapter/engine responsibilities remain distinct. Routing
selects workers while engine schedulers select token work. Cache indexes are
placement evidence and optional KVBM is block lifecycle integration. Confirmed,
lower-tier, and predicted cache evidence retain different meanings. Handoff
metadata remains separate from KV payload. User completion/cancellation remains
separate from safe engine/transfer reclamation. Planner targets,
acknowledgements, and observed ready capacity remain separate control stages.

Source reading rechecked the selection admission/ownership contract in
`lib/kv-router/src/services/selection/core/operation.rs` and Planner admission and
configuration checks in `components/src/dynamo/planner/core/base.py`. Remaining
mechanisms condense the already source-reviewed guide and retain the relevant
entrypoint/type/implementation links. All linked Source-component paths were
checked against the local Dynamo checkout. No upstream files, source manifest,
registry, shared UI, or other repository guide was edited.

## Validation

Static checks confirm all 15 pages, all Source paths, accessible Mermaid metadata,
and the six overview headings. Isolated Mermaid rendering checks all 15 diagrams;
the parent agent integrates the site build, source-link validation, and browser
checks. There are no cross-page chapter-fragment links into the removed Dynamo
section headings in the authored site content.

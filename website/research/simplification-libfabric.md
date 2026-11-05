# libfabric editorial simplification

Reviewed and rewrote the overview and all fourteen chapters for a developer
tracing the architecture. Existing page routes, frontmatter titles, source
revision and six overview anchors remain stable. No incoming published links
targeted the removed chapter section anchors.

The rewrite keeps the service negotiation → resource creation → provider dispatch
→ progress/completion path. Chapters retain the owners, one useful visual/example,
the consequential decisions, and a short source-reading route. Existing source
contracts remain the basis; no upstream implementation or evidence manifest changed.

Removed or merged:

- Repeated exercise/answer, test-fixture and mock-provenance sections.
- Exhaustive API-version, context-mode and provider option cases.
- Detailed protocol candidate rejection permutations and failed-post bookkeeping.
- Repeated caveats about local/remote observations where one clear ownership
  explanation supplies the needed model.
- The per-send admission-gate diagram and ordered protocol-predicate graph; their
  core choices are captured by the resource and payload-family maps.

Retained architecture:

- Required capabilities versus supported obligations and returned limits.
- Built-in/dynamic registration, optional utility layers and selected endpoint tables.
- Fabric/domain/endpoint scopes, bindings and request lifetime.
- Rank/raw address/local AV handle, tagged matching and unexpected-message pressure.
- Remote address/key versus local descriptor and application publication ordering.
- MR/allocation/use lifetimes, cache references and mapping stability obligations.
- HMEM/direct/staging alternatives and GPU producer/consumer dependencies.
- Accepted work, CQ errors, progress and distinct packet/operation/consumer boundaries.
- EFA variant selection, current generic selector/fallback, protocol families and
  one ordinary eager operation trace.

The retained examples and diagrams were checked against their existing source
links: `src/fabric.c`, public dispatch headers, portable manuals, EFA resource
construction, generic send, protocol selection and CQ/callback paths. Specialized
predicates remain reachable through those links rather than repeated in prose.

The primary agent records final prose counts and integrated validation in plan.md.
Isolated Mermaid validation is recorded in `.qa/simplification-libfabric-render.log`.
Final prose is 6,206 words versus 19,414 before (68% shorter), with sixteen useful
diagrams. The tag-mask equation is parenthesized for unambiguous C precedence,
and key abbreviations are introduced where they first affect the main path.

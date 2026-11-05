# vLLM architecture simplification

Reviewed and rewrote the overview and all fourteen chapters for developers
learning the architecture. The main path now comes before implementation
variants: purpose, diagram, ownership and operation flow, consequential decisions,
then a short source-reading route. The existing fifteen routes and six overview
anchors are unchanged.

## Editorial changes

- Merged repeated explanations of request identity, cache lifetime and output
  completion into their natural chapters, with links from adjacent topics.
- Removed mandatory exercises, fixture-by-fixture test descriptions, generic
  test-evidence disclaimers, long error permutations, and detailed option lists.
- Retained short examples that reveal the mechanism: token sharing, block
  ownership, ragged rows, packed QKV, raw/processed scores and rank groups.
- Kept source excerpts only when they show an architectural contract directly.
  Surviving claims link to their implementation, and diagnosis still points to
  focused tests where they help the reading route.
- Reduced diagrams from 23 to 20: removed the duplicate connector map, the
  separate async grammar-dependency map, and the compilation polling graph.
  Structured generation now uses a simpler accepted-output loop. Every page
  retains a useful visual with accessible title/description text.
- Preserved the request lifecycle's `Output completion and memory completion
  differ` heading for existing links and typography verification.

## Size and coverage

The shared counting method removes frontmatter, fenced code/diagrams and MDX
tags, then counts remaining whitespace-separated words. Before: 19,850 words.
After: approximately 7,000 words, a 65% reduction. Chapters generally contain
418–503 prose words, plus diagrams and the retained short source excerpts.

| Page | Main retained lesson |
| --- | --- |
| Overview | Serving → engine scheduling → worker execution → output |
| Repository map | Source families and state ownership |
| Startup | Workers and KV planning precede scheduler readiness |
| Model loading | Architecture selection, artifact loading and local placement |
| Request lifecycle | Registration, output collectors, abort and resource owners |
| Scheduling | Token budget plus memory admission and reconciliation |
| KV memory | Prefix identity, references, reclamation and publication |
| GPU execution | Persistent rows → ragged inputs → execution/sampling handoff |
| Attention | Selection, metadata building, addressing and kernel execution |
| Sampling/output | Selection versus score reporting, detokenization and stops |
| Async/speculative | Planned, in-flight, accepted and reusable frontiers |
| Distributed execution | Executor placement, TP/PP groups and result ownership |
| KV connectors | Scheduler intent, worker payload transfer and valid completion |
| Structured generation | Request grammar → mask → sampling → accepted tokens |
| Diagnosis | Locate the failing/waiting architecture boundary |

## Accuracy checks

The pinned vLLM snapshot remains
`9a56d4fec6b0a30a0a989f1cd06cd3c2f7325619`. Existing visual/source reviews
were used to preserve the technical spine. Direct source checks reconfirmed:

- `v1/request.py`: computed-token accounting can include in-flight work.
- `v1/core/block_pool.py`: writability needs one reference and no published hash.
- `model_loader/base_loader.py` and `default_loader.py`: construction precedes
  named-tensor loading through the model's `load_weights`.
- `v1/sample/sampler.py`: raw reporting precedes selection transformations.
- `structured_output/__init__.py` and `backend_types.py`: engine backend scope
  and request-owned accepted grammar progress.
- `nixl/base_worker.py`: finished receives and failed receives are separate
  fields; completion alone does not establish valid loaded KV.
- `distributed/parallel_state.py`: collective semantics route through the
  selected communicator and group geometry remains distinct from transport.

Important distinctions remain explicit: scheduler versus worker ownership,
logical blocks versus physical tensors, sampled IDs versus completed KV,
finished transfers versus successful state, stream completion versus allocation
lifetime, and mathematical collective results versus transport implementation.
Optional Dynamo/NIXL/Mooncake paths remain optional.

## Validation

`node .qa/parse-visuals.mjs vllm` passed: fifteen pages, twenty diagrams, zero
rendering or accessible SVG text failures. No upstream source, shared styles,
navigation registry, source manifest, or other repository guide was changed.
The parent agent owns integrated link, build and browser validation.

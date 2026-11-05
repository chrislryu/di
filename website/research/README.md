# Source review evidence

These ledgers support the authored explanations at the revisions recorded in
`../src/data/sources.json`. Each JSON file is an array of `{id, claim, project,
path}` records. IDs are scoped to a ledger, except the selected public
relationships in `evidence.json`, whose IDs match `relationships.ts` and the
anchors on `/start/evidence/`.

- `core-evidence.json`: vLLM, Dynamo, and DeepEP architecture traces.
- `engines-evidence.json`: SGLang and DeepInfer architecture traces.
- `state-evidence.json`: NIXL and Mooncake architecture traces.
- `network-evidence.json`: NCCL, AWS OFI NCCL, libfabric, and the AWS trace.
- `concepts-evidence.json`: shared conceptual explanations.
- `decisions-evidence.json`: engineering decision support.
- `trace-review-evidence.json`: additional review of return values, stream
  ordering, cancellation, transfer failure, and ownership across root traces.
- `evidence.json`: both ends of the system map's selected relationships.

The rendered pages also contain pinned file links and optional line anchors.
`npm run check:sources` checks those links and every ledger record against local
Git objects at the recorded revision. File existence is automated; the associated
claim still needs source review when a revision or explanation changes.

The source baseline is not a certified combined runtime environment. No GPU
inference, network throughput, or multi-host correctness experiments were run to
produce this handbook. The four walkthroughs identify source-reading
configurations, distinguish synthetic communication from model execution, and
state requirements for optional runtime extensions.

## Comprehensive chapter review

The multi-page expansion adds a `<project>-internals-evidence.json` author ledger
for each repository and a separate `<project>-internals-review.json` ledger from
an independent reviewer. These use the same record format and pinned baseline.
Review includes source semantics, annotated excerpts, ownership/ordering,
worked examples, decision gates, and the behavior established by named tests.
File-existence validation does not replace that semantic review.

Preparation notes in this directory record inspected source branches and
potential pitfalls for authors. They are working research rather than published
chapters; chapter evidence and independent corrections are recorded separately.

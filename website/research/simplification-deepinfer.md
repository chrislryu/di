# DeepInfer editorial simplification

Reviewed and rewrote the overview and all fourteen chapters for a new developer
tracing the offline engine architecture. Prose decreased from **18,514 to 5,885
words (68.2%)**, excluding frontmatter, fenced diagrams/code and MDX tags using
the same counting method as the coordinator's snapshot.

The guide keeps the wrapper → engine → native scheduler/state → worker/model →
reconciled output spine. Pages now explain the purpose, a useful visual, ordinary
ownership/operation path, consequential choices and a short source route.

Removed test/fixture inventories, repeated exercises and caveats, exact vote
predicate permutations, redundancy arithmetic, CP mirror/remap case tables,
backend/fusion gate lists, and detailed compiler-future bookkeeping. The model
loading, scheduler, input-metadata and structured-output graphs now show their
architectural dependencies. Overlap uses one retained-result graph instead of a
second row-remap worked example. Sixteen useful diagrams remain.

Retained technical contracts:

- Persistent native sequences differ from per-step metadata and kernel inputs.
- Cooperating ranks agree on step kind and actual runnable admission.
- Logical blocks and queued copies have distinct ownership/completion boundaries.
- Clone-source pins retire after the recorded copy event, not after enqueue.
- Raw `uint64` output handles need `RequestOutput.clone`; ordinary and final-flush
  results both follow that rule.
- CP/DP/EP membership differs from network topology and serving replicas.
- Model/cache representations and logical/physical expert identities remain clear.
- Overlapped current work retains prior results; accepted request progress differs
  from planned or speculative physical work.
- Structured constraints combine reusable compilation with request-owned progress.

Source checks reused the pinned visual/source audit and inspected the actual
wrapper's step/flush/clone loop, `DeferredRelease` event synchronization, worker
sampling/event/post-processing order and EPLB mapping/shuffle entrypoints. All
retained Source paths exist. No incoming chapter-fragment links were found;
frontmatter, routes and all six overview headings remain stable.

`node .qa/parse-visuals.mjs deepinfer` passed: **15 pages, 16 diagrams, zero
rendering or accessible title/description failures**. No shared UI, registry,
upstream repository or other guide was modified. Integrated build/link/browser
validation remains with the coordinator.

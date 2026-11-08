# Distributed Inference Field Guide website

A static Astro + Starlight handbook with 15 pages per repository: an overview
and 14 internals chapters for each of ten projects. It also includes nine concept
pages, four walkthroughs, six decision guides, and a shared glossary. Content describes
pinned local source snapshots, rather than automatically following upstream HEAD.

## Develop and preview

Requirements: Node.js >=22.23.4 and npm >=9.6.5. Run commands from `website/`.
No cloud account, environment variables, GPU, or upstream checkout is required to
build the website.

```sh
npm ci
npm run dev -- --background
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

The default development URL is `http://localhost:4321`. For production preview:

```sh
npm run validate
npm run preview -- --host 0.0.0.0 --port 4322
```

The static output is `dist/`. Pagefind search is built during production builds;
verify search against production preview. Manage the preview server with
`npm run astro -- preview status` and `npm run astro -- preview stop`.
The published site is [chrislryu.github.io/di](https://chrislryu.github.io/di/).

Upstream sources live in the parent repository's `references/` Git submodules.
Initialize them with `git submodule update --init --jobs 4` from the repository
root to run `npm run check:sources`. The website build does not require them.

## GitHub Pages

Pushing `main` runs `.github/workflows/pages.yml`: install dependencies, validate
the site, upload the static output, and deploy to GitHub Pages. Upstream checkouts
are excluded; the build uses the checked-in guides and pinned source metadata.

The workflow sets `GUIDE_BASE_PATH=/di` and `GUIDE_SITE_URL` to the public origin.
Prerender middleware prefixes site-root HTML links before search indexing, covering
Markdown, MDX cards, custom navigation and SVG map links without changing source
examples or external links. Local development defaults to `/`.

To check the project-site build separately from the local preview:

```sh
GUIDE_BASE_PATH=/di GUIDE_DIST=dist-pages npm run validate
GUIDE_BASE_PATH=/di GUIDE_DIST=dist-pages npm run preview -- --host 127.0.0.1 --port 4323 --ignore-lock
```

Open `http://127.0.0.1:4323/di/`. `GUIDE_DIST` keeps this output separate from `dist/`.
With Chromium installed, run `GUIDE_DEPLOY_URL=http://127.0.0.1:4323/di/ npm run
check:deployment` to check navigation, diagrams, search and mobile layout. Omit the
environment variable to check the live GitHub Pages site.

## Validation

```sh
npm run validate        # type check, checker tests, static build, content checks
npm run check:sources   # also require all local pinned source checkouts
npm run check:external  # opt-in network check of rendered GitHub source links
npm run check:browser   # browser checks against preview on port 4322
```

`check:content` checks rendered routes, assets, decoded anchors, source metadata,
commit-pinned source links, source line bounds, and research evidence records.
It verifies files using `git cat-file` against the recorded commits when the
local checkouts exist. Missing checkouts are reported as unverified;
`check:sources` makes them errors. Builds remain independent of these checkouts.

The external checker distinguishes valid links, definite missing links
(404/410), and unresolved network, access, or rate-limit failures. It exits
nonzero for definite broken links; read the unresolved count before claiming
remote verification. It does not update source snapshots.

Browser checks need Playwright Chromium (`npx playwright install chromium` if
not already installed) and a running production preview. Set `GUIDE_PREVIEW_URL`
to use another preview URL. Screenshots and browser review artifacts go to the
ignored `.qa/` directory. These checks verify rendered diagrams, Pagefind,
keyboard use, and mobile layouts; they do not run GPU inference.

## Author content

Pages live under `src/content/docs/` in Markdown or MDX. Stable route groups are
`/start/`, `/concepts/`, `/architecture/`, `/walkthroughs/`, `/decisions/`, and
`/glossary/`. Folder index pages use `index.md` or `index.mdx`; do not create both.

Copy `templates/architecture-guide.mdx` for a new guide. Shared components can be
imported in MDX. Prefer ordinary prose, native Starlight components, and Mermaid
fences over custom interactive UI. Every diagram needs a prose explanation.
Use diagrams where relationships carry the lesson: component boundaries,
request sequences, lifecycle states, buffer layouts, synchronization dependencies,
and decision gates. Give each Mermaid diagram `accTitle` and `accDescr`, introduce
its purpose, and explain its takeaway and assumptions immediately nearby. Label
teaching examples and optional paths explicitly. Keep labels readable at their
natural size with local horizontal scrolling; do not shrink a large graph to fit
a phone. Check arrows against source ownership, progress, and completion rules.
Use quantitative graphs only when backed by actual data and its conditions.

Metadata extends Starlight's schema:

```yaml
kind: architecture
projects: [vllm]
prerequisites:
  - {title: KV cache, href: /concepts/kv-cache/}
related:
  - {title: One request, href: /walkthroughs/one-request/}
```

`kind` is one of `index`, `start`, `concept`, `architecture`, `walkthrough`,
`decision`, or `glossary`. Architecture guides require one canonical project;
walkthroughs list every participating source project. Links use site-relative
routes. The schema validates project IDs and navigation metadata; the production
content check verifies destinations. For unfinished work, set `draft: true`,
`pagefind: false`, and `sidebar: {hidden: true}` and omit explicit sidebar entries.

## Source evidence and maintenance

`src/data/sources.json` is the source baseline: project name, primary role,
canonical origin, full commit SHA, and review date. Guide headers render this
metadata. To link a file without copying a SHA into prose:

```mdx
import Source from '../../../components/Source.astro';

Read <Source project="vllm" path="vllm/v1/engine/core.py" label="EngineCore" />.
```

The optional `lines="709-740"` prop adds line anchors. Prefer a file and symbol
name when line ranges add no value. Ordinary commit-pinned Markdown source links
are also supported and checked against the manifest.

Evidence lives in `research/*.json` as arrays of
`{id, claim, project, path}` records, with IDs unique within each ledger. Keep
claims tied to inspected implementation, examples, or tests. The system map's
selected relationships are in `src/data/relationships.ts`; their evidence is in
`research/evidence.json` and `/start/evidence/`. Verify both ends of integrations
and update the map, textual equivalent, and public evidence page together.

Refresh a project only through explicit review: inspect the new commit, audit
all affected claims and links, update evidence and source metadata, then rebuild
and run source checks. Do not simply replace SHAs across prose. Independently
pinned snapshots are not automatically a compatible runtime installation.

`src/data/learning-path.ts` defines the one default newcomer path. Sidebar
configuration is in `astro.config.mjs`; shared components and styles live under
`src/components/` and `src/styles/`. Preserve accessible text equivalents and
labels when changing the map. Keep `package-lock.json` with dependency changes.

## Comprehensive repository guides

Each repository guide has an overview and 14 internals chapters. The ordered
curriculum is in `src/data/guides.json`; its typed navigation helpers are in
`src/data/guides.ts`. Chapter pages live at
`src/content/docs/architecture/<project>/<chapter>.mdx`. Keep the existing
`architecture/<project>.mdx` overview and its anchors stable.

The registry drives the sidebar, ordered overview list, chapter numbering,
breadcrumbs, and local previous/next links. Chapter footers stay inside the
repository; overview footers retain the global newcomer path. A repository's
chapter list appears in primary navigation once all 14 registered chapters are
published. Register a chapter once; do not maintain separate ordering arrays.

Copy `templates/internals-chapter.mdx` when authoring. Write for a new developer
tracing the architecture: explain the purpose, owners, main operation, and the
few decisions that materially change the path. Keep the technical details needed
to understand those boundaries and follow the source. Around 400–750 prose words
often suffice; use the space the mechanism needs without padding.

Merge overlapping explanations and use the diagrams as part of the teaching.
Keep source excerpts only when the code clarifies an architectural contract.
Remove exhaustive flag/version cases, fixture inventories, repeated caveats and
mandatory exercises. A short source-reading route is enough to lead readers to
deeper details. Explain optional integrations once in the relevant chapter and
preserve the pinned source baseline.

Give each repository a dedicated authoring agent rather than assigning a group
of repositories to one agent. Record visual intent and source checks in a
repository-specific `research/visual-<project>.md` audit.
Record substantial editorial cuts and retained architectural contracts in
`research/simplification-<project>.md`.

`npm run check:guides` verifies all ten complete sets, authored metadata,
registry consistency, overview lists, breadcrumbs, progress, and chapter
navigation. During authoring, `node scripts/check-guides.mjs --allow-incomplete`
reports unfinished sets without accepting them as release-complete.
`npm run validate` includes strict guide checking. Browser checks cover chapter
boundaries, keyboard/mobile sidebar use, subsystem search, all Mermaid diagrams,
and mobile document overflow across published pages.

# Distributed Inference Field Guide

[Read the published guide](https://chrislryu.github.io/di/).

A source-grounded onboarding website for developers learning distributed inference,
GPU communication, and high-performance networking. It includes ten 15-page architecture
guides, nine concept pages, four operation walkthroughs, six decision guides, and a
shared glossary. Diagrams and concise chapters trace the main operation, its
owners, and the decisions that change the path, with direct links into source.

```sh
cd website
npm ci
npm run dev
```

Follow **Follow your first request** from the homepage, or use the project index.
See [website/README.md](website/README.md) for validation and authoring, and
[plan.md](plan.md) for the curriculum and delivery plan.

## Reference sources

`references/` contains the ten upstream projects as Git submodules, pinned to the
reviewed revisions in `website/src/data/sources.json`. Initialize them after cloning:

```sh
git submodule update --init --jobs 4
```

For a single project, use `git submodule update --init references/nixl` instead.
The website builds without these checkouts or GPU hardware; `npm run check:sources`
from `website/` verifies source evidence after all reference submodules are initialized.

GitHub Pages publishes changes from `main` through
[the deployment workflow](.github/workflows/pages.yml).

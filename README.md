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

The local upstream checkouts in `repositories/` are excluded from this Git
repository. The static website builds without those checkouts or GPU hardware;
source verification uses them when available. GitHub Pages publishes changes
from `main` through [the deployment workflow](.github/workflows/pages.yml).

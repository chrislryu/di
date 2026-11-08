# Project guidance

This is a source-grounded distributed-inference guide for software developers new
to GPU communication and distributed systems. Explain purpose, architecture,
ownership and main decision flows; keep useful diagrams and avoid minor branch inventories.

- `website/` contains the Astro/Starlight site; `references/` contains upstream Git submodules.
- Treat upstream files as reference material. Keep submodule pins aligned with `website/src/data/sources.json`.
- Ground claims in those revisions and distinguish optional integrations from required dependencies.
- When delegating repository research, assign one repository per agent.
- Preserve both local `/` and GitHub Pages `/di/` links.

Checks from `website/`: `npm run validate`. For pinned-source verification,
initialize the reference submodules and run `npm run check:sources`.

See `README.md` for setup and `plan.md` for curriculum and scope.

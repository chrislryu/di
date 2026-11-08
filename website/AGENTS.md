# Website notes

- Content lives in `src/content/docs/`; `src/data/guides.json` controls chapter order.
- `src/data/sources.json` records reviewed upstream revisions; `research/` holds evidence.
- Author site-root URLs. Prerender middleware adds the `/di/` production prefix.
- Keep Mermaid accessible titles/descriptions and local scrolling for large diagrams.
- For routing changes, also check `GUIDE_BASE_PATH=/di GUIDE_DIST=dist-pages npm run validate`.
- Start dev servers with `npm run astro -- dev --host 0.0.0.0 --background`.

See `README.md` for preview, deployment and validation commands.

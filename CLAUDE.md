# Claude Context for Open-KG

## Project

`kg` is a TypeScript CLI tool (Knowledge Graph compiler) that extracts structured knowledge graphs from .md/.txt documents using LLMs. v0.3 adds styled UI, `.kgignore`, lint scoring, glassmorphism visualizer, and `.kg/` sovereign data architecture.

## Current State

- **All code implemented** — 7 commands, 13/13 tests passing
- **Not yet tested with a real LLM call** — needs `ANTHROPIC_API_KEY` to run `kg build`

## Resume Point

Check `TODO.md` for the full task list. The most important next step is running `kg build ./examples` with a real API key to validate extraction quality, then tuning the prompts in `src/llm/prompts.ts`.

## Commands

```bash
npm run build      # compile TypeScript
npm test           # run unit tests (13 tests)
node dist/src/index.js build ./examples
node dist/src/index.js build ./examples --dry-run
node dist/src/index.js stats
node dist/src/index.js query "Who works on Project Phoenix?"
node dist/src/index.js export --format markdown
node dist/src/index.js viz
node dist/src/index.js lint ./examples
```

## Architecture

- `src/cli/ui.ts` — styled terminal output (chalk)
- `src/cli/lint.ts` — graph readiness scoring
- `src/cli/viz.ts` — glassmorphism HTML/DOT graph visualization
- `src/cli/stats.ts` — graph summary
- `src/graph/types.ts` — ontology + core types
- `src/llm/prompts.ts` — prompt templates (edit these to tune extraction)
- `src/llm/claude.ts` — Anthropic SDK integration
- `src/pipeline/extractor.ts` — extraction orchestration with tree progress
- `src/pipeline/cache.ts` — SHA-256 content hash caching
- `src/pipeline/loader.ts` — document loading with `.kgignore` support
- `src/graph/resolver.ts` — entity resolution
- `src/graph/store.ts` — `.kg/` directory persistence

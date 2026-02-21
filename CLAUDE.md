# Claude Context for Open-KG

## Project

`kg` is a TypeScript CLI tool (Knowledge Graph compiler) that extracts structured knowledge graphs from .md/.txt documents using LLMs. v0.1 is complete.

## Current State

- **Branch:** `claude/kg-cli-tool-v0.1-SGkdW`
- **All code implemented and pushed** — 25 files, 13/13 tests passing
- **Not yet tested with a real LLM call** — needs `ANTHROPIC_API_KEY` to run `kg build`

## Resume Point

Check `TODO.md` for the full task list. The most important next step is running `kg build ./examples` with a real API key to validate extraction quality, then tuning the prompts in `src/llm/prompts.ts`.

## Commands

```bash
npm run build      # compile TypeScript
npm test           # run unit tests (13 tests)
node dist/src/index.js init
node dist/src/index.js build ./examples
node dist/src/index.js query "Who works on Project Phoenix?"
node dist/src/index.js export --format markdown
```

## Architecture

- `src/graph/types.ts` — ontology + core types
- `src/llm/prompts.ts` — prompt templates (edit these to tune extraction)
- `src/llm/claude.ts` — Anthropic SDK integration
- `src/pipeline/extractor.ts` — extraction orchestration
- `src/graph/resolver.ts` — entity resolution

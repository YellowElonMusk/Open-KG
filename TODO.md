# Open-KG — Next Steps

## Status: v0.3 complete

7 CLI commands (`init`, `build`, `query`, `export`, `stats`, `viz`, `lint`). Styled CLI with chalk, `.kgignore`, privacy banner, glassmorphism visualizer, `.kg/` sovereign architecture. 13/13 tests passing.

---

## Done in v0.3

- [x] Styled CLI with chalk (branded progress bars, tree output, build summary)
- [x] `.kg/` hidden directory (git-style sovereign data architecture)
- [x] `.kgignore` support (exclude private files from extraction)
- [x] `kg lint` command (graph readiness scoring with actionable suggestions)
- [x] Privacy banner on build (shows exactly what text is sent to LLM)
- [x] Glassmorphism "Digital Brain" visualizer (glowing edges, translucent nodes)
- [x] Viral README copy

## Done in v0.2

- [x] Content hash caching — skip unchanged documents on rebuild
- [x] `kg viz` — interactive HTML + DOT graph visualization
- [x] `kg stats` — quick graph summary command
- [x] `--dry-run` flag on build for preview mode
- [x] Large file warnings (>100KB)
- [x] DOT format for export
- [x] MIT License

## Immediate: Validate with Real LLM

- [ ] Run `kg build ./examples` with a real `ANTHROPIC_API_KEY`
- [ ] Review extraction quality — check what Claude actually returns
- [ ] Tune prompts in `src/llm/prompts.ts` based on real output
- [ ] Verify entity resolution merges "Alice Chen" across all 3 documents

## v0.4: Key Improvements

- [ ] **Fuzzy entity resolution** — Levenshtein/Jaccard threshold to catch "Alice Chen" vs "Alice C."
- [ ] **Custom ontologies** — load entity/relationship types from a config file
- [ ] **`kg watch`** — file watching for auto-rebuild on changes
- [ ] **Confidence scores** on extracted entities

## v0.5+: Bigger Features

- [ ] Alternative LLM providers (OpenAI, Ollama, local models)
- [ ] Document chunking for large files
- [ ] CI/CD pipeline + npm publish workflow

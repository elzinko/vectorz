---
id: 0104
title: "Kit d’analyse de session — journal + Moniteur + transcript Claude Code en un rapport"
type: feature
priority: P1
epic:
depends: []
labels: [supervision, tooling, dogfood]
status: shipped
ready: 2026-07-29
pr:
created: 2026-07-29
product: mega-city
---

# 0104 — Kit d’analyse de session (post-mortem fiable)

## En une phrase

Après un dogfood (ou un bug « le Moniteur n’a pas bougé »), pouvoir **reconstruire
fidèlement** ce qui s’est passé : événements supervision et appels MCP dans la session
Claude Code — sans fouiller à la main trois endroits.

## Livré

1. Module pur `src/supervision/analyze.ts` (lecture seule, pas de LLM).
2. CLI `pnpm --dir products/mega-city supervision:analyze .`
3. Rapport markdown + JSON sous `docs/dogfood-reports/<stamp>/` (gitignored).
4. Verdicts : `healthy`, `emission_gap`, `silence_explained`, `orphan_run`,
   `mcp_without_journal`, `no_runs`, `no_transcript`.
5. Doc : section dans `src/supervision/README.md` (pas de `docs/DOGFOOD.md` sur cette
   branche — pointer équivalent).
6. Skill mince `supervision-analyze` + étape auto dans `scripts/dogfood-guided.sh`
   (analyze le run le plus récent ; KO seulement si une démo fraîche a émis).

## Critères d'acceptation

- [x] Sur le dogfood 2026-07-29 (fixture), le rapport dit en clair :
      « 1× run.started, 0 heartbeat, 0 gate, run ouvert → Silence prolongé attendu ».
- [x] Trouve automatiquement le transcript CC du projet (slug) ou `--transcript`.
- [x] Liste les appels `mcp__supervision__*` avec timestamp + args résumés.
- [x] Liste les events du run (ou tous les runs `--since`).
- [x] Rapport sous `docs/dogfood-reports/<stamp>/` ; gitignore en place.
- [x] Doc courte : « Si tu ne comprends pas le Moniteur → `supervision:analyze` »
      (`src/supervision/README.md`).

## Notes / décisions

- Privacy : pas de dump prompts par défaut (`--full` = métadonnées supplémentaires seulement).
- Exit code 1 si verdict « mauvais » (`emission_gap`, `silence_explained`, `orphan_run`,
  `mcp_without_journal`) — utile en script / CI dogfood ; en interactif lire le rapport.
- Complète **0103** (heartbeat) : analyze explique le passé ; heartbeat améliore le futur.
- Pas le harness E2E-LLM (**2103**) — ici on **explique** une session déjà faite.

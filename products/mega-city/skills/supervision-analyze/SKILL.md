---
name: supervision-analyze
argument-hint: "[chemin-projet=.]"
description: >-
  Post-mortem Moniteur / supervision : quand le Moniteur dit « Silence prolongé »,
  qu’un run semble figé, ou qu’on ne comprend pas ce qui a été émis. Lance le kit
  d’analyse déterministe (journal `.supervision/runs` + transcript Claude Code) —
  pas de LLM. Déclencheurs : « pourquoi silence Moniteur », « analyze supervision »,
  « moniteur confus », « supervision:analyze », « post-mortem run ».
---

# supervision-analyze — expliquer une session (fiche 0104)

Tu **n’inventes pas** l’explication : tu lances le CLI et tu résumes le rapport.

## Commande (racine du projet supervisé)

```bash
pnpm --dir products/mega-city supervision:analyze .
# options : --run <id> · --since 2h · --transcript <path> · --stdout
```

Avec `pnpm --dir`, les chemins relatifs (`.`) sont résolus via `INIT_CWD` (= où
l’humain a tapé la commande). Préférer `.` depuis la racine du repo, ou un chemin
absolu.

## Ce que tu fais

1. Lance la commande (projet = argument ou `.`).
2. Lis le markdown généré sous `docs/dogfood-reports/<stamp>/analyze-report.md`
   (ou stdout si `--stdout`).
3. Reformule les **verdicts** en français clair pour l’humain :
   - `silence_explained` → pas un bug lecteur : peu/pas d’émission après `run_start`
     (manque heartbeat / gates / `run_finished`).
   - `emission_gap` / `orphan_run` → run encore ouvert ; proposer `run_finished` ou
     abandon propre.
   - `mcp_without_journal` → mauvaise racine / worktree (`SUPERVISION_PROJECT_ROOT`).
   - `healthy` → journal cohérent.
4. **Ne dump pas** les prompts utilisateur. Pas de `--full` sauf demande explicite.

## Ce que tu n’es pas

- Pas un remplacement du Moniteur live.
- Pas le harness E2E-LLM (fiche 2103).
- Pas une méthode de prod : tu diagnostiques, tu ne rejoues pas le sprint.

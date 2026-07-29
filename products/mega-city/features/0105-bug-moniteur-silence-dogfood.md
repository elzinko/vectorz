---
id: 0105
title: "Bug dogfood — Moniteur « Silence prolongé » / produit inutilisable après run_start seul"
type: bug
priority: P0
epic:
depends: ["0103", "0104"]
labels: [supervision, dogfood, ux]
status: todo
ready:
pr:
created: 2026-07-29
product: mega-city
---

# 0105 — Bug : après un vrai dogfood, le Moniteur paraît cassé / inutilisable

## Symptôme

1. Claude Code + MCP `supervision` connecté (5 tools).
2. Une méthode ouvre un run (`ezk-sprint` → `run_start`).
3. Le Moniteur affiche **1 run EN COURS**.
4. L’humain continue à travailler (skills, archive, standby…) **sans voir de nouvelle
   ligne** de run / d’activité.
5. Après standby / attente → badge **« Silence prolongé »** + message
   « Aucun signe de vie… ».
6. Impression produit : « pas synchro avec Claude Code », « je ne comprends pas ce que
   je vois », « on ne peut pas s’en servir ».

## Reproduction (2026-07-29, repo vectorz)

1. Daemon + web Moniteur up ; `watch_roots` → vectorz.
2. Claude Code dans `vectorz` avec MCP `supervision` ✓ connected.
3. Lancer un flux qui appelle `run_start` (ex. skill `ezk-sprint` à l’intake).
4. Vérifier Moniteur : run `ezk-sprint` EN COURS.
5. Faire d’autres actions Claude **sans** gate / fin de run (ex. `/ezk-archive` → `check`).
6. Mettre la session en standby quelques minutes.
7. **Attendu naïf (humain)** : le Moniteur reflète l’activité Claude.  
   **Observé** : une seule carte run, VU qui vieillit, puis Silence prolongé.

### Preuves disque

- Journal : `.supervision/runs/2026-07-29T12-48-47-648Z-2a4f2f22/events.jsonl`  
  → **1 événement** `run.started` seulement.
- Transcript CC : `~/.claude/projects/-Users-elzinko-git-bacasable-vectorz/2809b04c-….jsonl`  
  → **1** `mcp__supervision__run_start`, aucun autre outil supervision.

## Analyse (pas un bug du lecteur)

| Couche | Verdict |
|--------|---------|
| Moniteur / ADR-028 | **OK** — `presumed_dead` si silence en `running` |
| Émission méthode | **Trou** — `ezk-sprint` n’émet que start/gates/fin ; pas de signe de vie entre deux |
| MCP kit | **Trou contrat** — `heartbeat` documenté mais **absent** des 5 outils MCP |
| UX / doc | **Manque** — l’humain croit voir « Claude live », or c’est « jalons méthode » |
| `/supervision-demo` | Skill hors bind daily/global → slash command introuvable (confusion dogfood) |

## Que faire (ordre)

1. **P0 UX immédiat** : clarifier dans le Moniteur / guide ce qu’est une carte run
   (jalons ≠ chaque outil Claude).
2. **P1 fiche 0103** : outil MCP `heartbeat` + émission dans `ezk-sprint` (et builders).
   → **shipped** (`features/done/0103-…`).
3. **P1 fiche 0104** : `supervision:analyze` pour expliquer une session (journal +
   transcript + verdict).
4. Dogfood humain post-0103 : relancer Claude Code (6 outils), sprint avec heartbeats.

Issue GitHub : https://github.com/elzinko/vectorz/issues/63

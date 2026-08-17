---
id: 0105
title: "Bug dogfood — Moniteur « Silence prolongé » / produit inutilisable après run_start seul"
type: bug
priority: P0
epic:
depends: ["0103", "0104"]
labels: [supervision, dogfood, ux]
status: shipped
ready:
pr: "resolved-by 0103+0104"
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
   (jalons ≠ chaque outil Claude). → **partiel** (légende Moniteur livrée avec 0103).
2. **P1 fiche 0103** : outil MCP `heartbeat` + émission dans `ezk-sprint` (et builders).
   → **shipped** (`features/done/0103-…`, PR #64).
3. **P1 fiche 0104** : `supervision:analyze` pour expliquer une session (journal +
   transcript + verdict). → **shipped** (`features/done/0104-…`, PR #65).
4. Dogfood humain post-0103 : relancer Claude Code (6 outils), sprint avec heartbeats.
   → **fait** 2026-07-30 (`docs/dogfood-reports/20260730-152524/`, analyze `healthy` sur
   le run demo ; orphelin d’hier clôturé `abandoned`).
5. **Ship cette fiche (0105)** une fois les AC UX / dogfood clôturés côté produit.
6. **Avec le ship de [0168](0168-run-orphelin-verrou-sans-cle.md)** (verrou orphelin) :
   **fermer l’issue GitHub #63** — ne pas la fermer avant.

## Issue GitHub

- https://github.com/elzinko/vectorz/issues/63
- **Règle de clôture** : laisser l’issue **ouverte** jusqu’au ship de **0105 et 0168**.
  Au ship de la dernière des deux, `gh issue close 63` (commentaire de clôture pointant
  les deux PRs / commits de ship).

## Résolution (2026-08-13) — vérifiée

**Résolu par ses dépendances `0103` (heartbeat des méthodes) + `0104` (kit d'analyse de
session), toutes deux shippées.** `0103` a été créé explicitement pour ce symptôme (même
dogfood 2026-07-29 / issue #63) : les méthodes émettent un `heartbeat` entre les jalons, le
Moniteur ne bascule plus en « Silence prolongé » à tort, et la phrase UX clarifie « jalons ≠
chaque action Claude Code ». `0104` explique tout silence résiduel post-mortem (`silence_explained`).

**Preuve vivante (dogfooding)** : `pnpm --dir products/mega-city supervision:analyze .` sur la
session 2026-08-13 (un `run_start` suivi de ~5 h d'activité avec heartbeats mais sans jalon
continu — le scénario exact de ce bug) rend le verdict **`healthy`** (« start + activité + fin »),
pas `silence_explained` ni `orphan_run`. Le mécanisme de 0103 empêche bien le faux positif.


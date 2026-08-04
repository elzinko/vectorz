---
id: 0090
title: Cohérence de sprint — garde-fou d'ouverture (lecture) + verrou de sprint adapté LLM (écriture)
type: feature
priority: P0
product: mega-city
epic:
depends: []
labels: [enabler, r&d]
status: in-progress
ready: 2026-08-03
pr:
created: 2026-07-25
---

# 0090 — Cohérence de sprint (réalisable en 2 tâches)

## Contexte / Problème

Rien ne protège la cohérence quand plusieurs sessions/worktrees coexistent (constaté le
2026-07-25 : plusieurs worktrees, sprints P0 parallèles, `main` local divergé, et une collision
de numéro de fiche en direct). Deux manques, deux moitiés — **lecture** : `ezk-archive` ferme
une session, rien ne l'ouvre ; **écriture** : aucun verrou partagé, `SPRINT.md` est par-branche,
deux sessions peuvent tirer la même fiche (démarrage LLM long).

## Découpe — 2 tâches

**Tâche 1 — Garde-fou d'ouverture (`ezk-start`, lecture).** Pendant symétrique d'`ezk-archive` :
au démarrage, inspecte working tree + `git worktree list`, repère les sprints en vol, **alerte**
+ choix explicite (rejoindre / interrompre journalisé), lit `.claude/handoff.md` + la tête de
`PLAN.md`. Livrable seul (version grossière sur `status: in-progress` + worktrees).

**Tâche 2 — Verrou de sprint adapté LLM (écriture).** Claim = `status: in-progress` commité
**d'abord** (+ `claimed-by/branch/worktree/heartbeat`), en état **partagé**. Atomicité via réf
git (premier push gagne = compare-and-swap). **Bail à heartbeat** : une session LLM meurt en
silence ⇒ un mutex interbloque ; claim périmé (pas de battement > TTL) = réclamable, reprise
journalisée. Hooks début/fin (intake pose, ship/archive relâche ; option hook `SessionStart`).
Override humain via la tâche 1. **Hors scope de ce sprint** (attend 0092 pour la forme du claim).

## Sous-tâche (article, après livraison)

- [ ] **Article REX — verrouiller des sessions d'agents LLM** (labels `article`, `r&d`) :
  pourquoi un mutex ne marche pas (mort silencieuse), pourquoi un bail advisoire sur git est le
  bon compromis. APRÈS 0090 dogfoodé (construire → prouver → écrire), via `ezk-article`.

## Critères d'acceptation (POC = tâche 1)

- [x] Skill `ezk-start` avec portier `scripts/check.sh` (read-only) : working tree, worktrees,
      fiches `in-progress`, handoff carry, tête PLAN.
- [x] `VERDICT: CLEAR` ou `VERDICT: ALERT` — exit 0 toujours (verdict sur stdout, comme archive).
- [x] Sur ALERT : le skill présente des choix explicites (rejoindre / interrompre journalisé) —
      aucun démarrage silencieux d'un nouveau sprint.
- [x] Enregistré dans le catalogue + profil `base` (symétrique d'`ezk-archive`).
- [x] Mention dans l'intake d'`ezk-sprint` (étape 0).

## Notes

- Fusion des ex-idées « ezk-start » et « verrou de sprint » — une responsabilité chacune,
  tâche 1 livrable indépendamment.
- **Advisoire** : pas de Paxos. Le vrai risque solo = *oublier* un sprint en vol → la tâche 1
  couvre 90 % ; le bail (tâche 2) paie surtout pour des flottes automatisées.
- La forme exacte du claim en front-matter s'appuie sur `0092` (champs partagés).
- Groomé 2026-08-03 — POC borné à la tâche 1.

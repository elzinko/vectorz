---
id: "20260830094601309"
title: Mode auto — gérer la fenêtre de contexte sur un run long (+ trace de supervision requise)
type: feature
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-30
---

# 20260830094601309 — Mode auto : gérer la fenêtre de contexte sur un run long

## En clair

Depuis que `ezk-product-build` tourne en `--mode auto` **par défaut**, une seule
invocation peut enchaîner beaucoup de sprints d'affilée. À force, la mémoire de travail
de l'orchestrateur (sa **fenêtre de contexte**) se remplit. Le harness la compacte tout
seul, mais le skill n'a **aucun geste explicite** pour repartir propre. Cette fiche ajoute
ce geste, et rend la trace de supervision fiable quand personne n'est plus aux checkpoints.

## Contexte / Problème

Deux jauges différentes, qu'on confond facilement :

- **Tokens dépensés** — le portefeuille. C'est ce que règle `--tokens` (`cap`).
- **Fenêtre de contexte** — le remplissage du prompt courant, la mémoire de travail.

`cap` surveille la **première**, pas la seconde. Un run peut rester sous son enveloppe de
coût **et quand même** saturer sa fenêtre.

Aujourd'hui, ce qui protège la fenêtre tient au **design**, pas au mode `auto` :

1. **Sous-agents jetables.** Chaque sprint fait le gros du travail (lecture, code) dans un
   contexte isolé. L'orchestrateur ne récupère qu'un résumé de clôture
   (`ezk-sprint` SKILL.md : « Isole le contexte coûteux dans les sous-agents »).
2. **État sur disque.** `SPRINT.md` « survit à la compaction de contexte », comme les
   fiches et le journal.

**Le trou.** Le contexte de l'**orchestrateur** grossit tout de même au fil des sprints
(résumés de checkpoint, décisions journalisées). Le skill n'a **aucun déclencheur** du
type « contexte plein → recharge-toi depuis l'état disque et repars propre ». Sur un run
très long en `auto`, la fidélité du fil de tête peut se dégrader. La vérité reste sur
disque, donc on ne perd pas le travail livré — au pire du raffinement conversationnel.

**Effet de bord du défaut `auto`.** Le skill note lui-même que l'émission de supervision
est « best-effort » *parce qu'*un humain restait aux checkpoints. Ce n'est plus le cas par
défaut. La trace de supervision devient donc le **principal témoin** de ce qui s'est
décidé — elle mérite d'être fiable, pas optionnelle.

## Proposition

1. **Checkpoint « contexte plein ».** Un seuil d'occupation de la fenêtre déclenche un
   re-seed : l'orchestrateur se recharge depuis l'état disque (`SPRINT.md` + backlog
   tirable + journal de session) et reprend la boucle sans perdre le fil. Non bloquant en
   `--mode auto` (auto-géré + journalisé) ; simple info en `--mode manuel`.
2. **Trace de supervision requise en défaut `auto`.** Quand le défaut est `auto`, l'émission
   (`run_start`/`gate_reached`/…) passe de best-effort à **attendue** : si les outils MCP
   sont absents, le prévenir au lancement plutôt que de tourner en boîte noire.
3. **(Différé) `--budget` numérique.** Réserver un vrai plafond chiffré de tokens/sprint
   pour le jour où une **jauge de dépense en cours de run** est exposée au skill. Sans
   cette jauge, `cap` reste « arrête-et-demande » sur seuil jugé, pas un chiffre.

## Critères d'acceptation (à groomer avant `ready`)

- [ ] En `--mode auto`, un run long déclenche **au moins un** re-seed depuis `SPRINT.md`
      sans perdre l'état (prochaine fiche, décisions déjà prises) — démontré sur un run
      multi-sprints.
- [ ] Le re-seed est **journalisé** dans `SPRINT.md` (`## Notes / décisions`).
- [ ] Au lancement d'un `run` en défaut `auto` **sans** outils d'émission MCP, le skill
      **le signale** (au lieu de démarrer silencieusement).
- [ ] La doctrine (SKILL.md + ADR concerné) distingue explicitement les deux jauges
      « tokens dépensés » vs « fenêtre de contexte ».

## Comment vérifier

Dérouler un `ezk-product-build run --mode auto` sur un backlog de plusieurs fiches
tirables, jusqu'à approcher le seuil de fenêtre ; observer le re-seed + sa trace dans
`SPRINT.md` ; relancer sans outils MCP et vérifier l'avertissement de lancement.

## Provenance

Détachée de la bascule du défaut vers `--mode auto` (session 2026-08-30, branche
`claude/ezk-product-build-defaults-0cd106`). Points 2 et 3 renvoient à la note
« Pourquoi vz-product-builder refuse de démarrer sans ces outils » et au § « Vigilance
tokens » de `products/mega-city/skills/ezk-product-build/SKILL.md`.

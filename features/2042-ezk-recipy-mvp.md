---
id: 2042
product: mega-city
title: ezk-recipy — scanner les repos froids et proposer des fiches de skills
type: feature
priority: P2
status: todo
pr:
created: 2026-07-06
---

## Contexte / Problème
Le flywheel n'a qu'un canal chaud (ezk-ezk harvest = la session courante). Les rituels
fossilisés dans les repos froids (release.sh dupliqué, doctrines GHA réécrites, hooks
divergents) sont invisibles. Le run 0 manuel (2026-07-05, 17 projets) a montré le besoin ET
le risque : ~25 candidats bruts, ~60 % de déchet à absorber par une discipline de juge.

## Proposition
`skills/ezk-recipy/` = SKILL.md + `scripts/inventory.sh`, sous-commandes `help|scan|propose`
selon ADR-0013 : le script inventorie (read-only), le LLM croise l'inventaire avec le
catalogue réel + les capacités natives, gate ≥2 repos / non-couvert / multi-étapes, cap 5
propositions/run avec preuves datées, et `propose` délègue à `ezk-backlog add` après
validation humaine. Jamais de SKILL.md en sortie.

## Critères d'acceptation
- [ ] `scan` sur 3+ repos : le LLM ne lit que l'inventaire (vérifié sur transcript — aucun Read/Grep sur les repos scannés)
- [ ] `propose` crée des fiches via ezk-backlog add (dédoublonnées), max 5, avec preuves citées
- [ ] `propose` sans validation humaine explicite est REFUSÉ, y compris invoqué depuis un mode autonome (--checkpoints auto, fiche 0040)
- [ ] le playbook refuse de générer un skill et renvoie vers `ezk-ezk create`
- [ ] re-scan : les fiches existantes sont rafraîchies, pas dupliquées

## Notes
ADR-0013. Premières cibles déjà sourcées par le run 0 : ezk-release, ezk-gate,
ezk-branch-sweep, ezk-doc-drift (preuves en mémoire projet, audit 2026-07-05).

---
id: 0046
title: ezk-product-builder — briefing au démarrage (comment je travaille, avec quelles règles)
type: feature
priority: P3
status: todo
pr:
created: 2026-07-06
---

## Contexte / Problème
Au lancement d'ezk-product-builder, l'opérateur ne voit pas d'un coup d'œil comment le
skill va travailler : mode tokens actif, mode checkpoints (fiche 0040), règles/LOI en
vigueur (bundles bindés), agents disponibles et leurs modèles, état du backlog. Idée notée
le 2026-07-06 (« il doit indiquer comment il travaille et avec quelles règles ») — mise de
côté volontairement pour avancer sur 0027-0029 d'abord.

## Proposition
Une étape 0 « briefing » dans le playbook : avant le premier sprint, afficher un encart
court — modes (`--tokens`, `--checkpoints`), bundles/règles actives du profil bindé, équipe
(agents + model/effort), fiche backlog visée — puis continuer sans attendre de validation
(c'est un affichage, pas un checkpoint). `status` réutilise le même encart.

## Critères d'acceptation
- [ ] au lancement, l'encart briefing s'affiche (modes, règles, équipe, fiche visée) sans arrêt humain
- [ ] `status` réaffiche le même encart à la demande
- [ ] l'encart reste court (~10 lignes) — pas un dump du profil

## Notes
Dépend de 0029 (les modes à afficher) et gagne en valeur avec 0006 (des règles réelles à
lister). Parking volontaire : ne pas l'attaquer avant 0036/0028/0029.

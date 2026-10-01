---
id: 0143
title: "Unifier le nom des modes tokens (lean / cap / full) dans la doc"
type: chore
priority: P3
product: mega-city
version:
labels: [dette]
status: shipped
pr: "#295"
created: 2026-07-06
---

## Contexte / Problème
Le flag réel d'ezk-product-build est `--tokens lean|cap|full` (argument-hint l.3, section
l.78-87), mais l'ADR-0008 (l.27-30) et la description frontmatter du skill (reprise dans le
catalogue chargé à chaque session) disent « lean | plafond-dur | pleine-puissance ». Deux
vocabulaires pour la même chose = routage et doc affaiblis.

## Proposition
`lean|cap|full` partout : description frontmatter du skill, corps du SKILL.md, et note
datée dans l'ADR-0008 (amender, pas réécrire l'historique de l'ADR).

## En clair
Le flag s'appelle `--tokens lean|cap|full`. La doc parlait encore de « plafond-dur » et de
« pleine-puissance ». Les trois endroits (description du skill, corps du skill, ADR-0008) disent
maintenant `lean`, `cap` et `full`. L'ADR garde une note datée qui relie l'ancien vocabulaire au
nouveau.

## Critères d'acceptation
- [x] `grep -ri 'plafond-dur\|pleine-puissance' skills/ docs/` = 0 (hors note datée de l'ADR-0008)
      — il ne reste que les 2 lignes de la note datée de l'ADR-0008 ; 0 dans `SKILL.md`.
- [x] la description frontmatter et l'argument-hint utilisent les mêmes termes
      — `lean | cap | full` dans les deux.

## Comment vérifier
`grep -rn 'plafond-dur\|pleine-puissance' products/mega-city/skills products/mega-city/docs` ne
doit rendre que la note datée de l'ADR-0008.

## Notes
Extraite de la fiche 0145 (revue du 2026-07-06 : drive-by sans lien fonctionnel avec le
mode auto). Micro-PR indépendante, faisable à tout moment.

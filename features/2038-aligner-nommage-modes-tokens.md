---
id: 2038
product: mega-city
title: aligner le nommage des modes tokens du product-builder (lean|cap|full partout)
type: chore
priority: P3
status: todo
pr:
created: 2026-07-06
---

## Contexte / Problème
Le flag réel d'ezk-product-builder est `--tokens lean|cap|full` (argument-hint l.3, section
l.78-87), mais l'ADR-0008 (l.27-30) et la description frontmatter du skill (reprise dans le
catalogue chargé à chaque session) disent « lean | plafond-dur | pleine-puissance ». Deux
vocabulaires pour la même chose = routage et doc affaiblis.

## Proposition
`lean|cap|full` partout : description frontmatter du skill, corps du SKILL.md, et note
datée dans l'ADR-0008 (amender, pas réécrire l'historique de l'ADR).

## Critères d'acceptation
- [ ] `grep -ri 'plafond-dur\|pleine-puissance' skills/ docs/` = 0 (hors note datée de l'ADR-0008)
- [ ] la description frontmatter et l'argument-hint utilisent les mêmes termes

## Notes
Extraite de la fiche 0040 (revue du 2026-07-06 : drive-by sans lien fonctionnel avec le
mode auto). Micro-PR indépendante, faisable à tout moment.

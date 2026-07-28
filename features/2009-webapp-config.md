---
id: 2009
product: mega-city
title: webapp de config (édite les YAML profiles/bundles)
type: feature
priority: P3
status: idea
pr:
created: 2026-06-26
---

## Contexte / Problème
Composer profils/bundles via une UI (second temps).

## Proposition
Webapp qui édite les YAML `profiles/` et `bundles/` (data → UI triviale). Ne touche pas au cœur.

## Critères d'acceptation
- [ ] CRUD profils/bundles via UI, sortie = YAML valides
- [ ] le `bind` reste la seule voie de matérialisation

## Notes
**2026-07-17 (review)** : rétrogradée `todo → idea`. « Second temps » assumé dès l'origine,
jamais tirée en ~3 semaines — c'est de l'icebox (hors flux P0→P3), pas de l'actionnable.
À re-promouvoir via le gate `ready` le jour où une UI de composition devient prioritaire.

---
id: "20261013131853182"
title: "Trancher le sort de la valeur in-progress du schéma (ADR court)"
type: chore
priority: P2
product: mega-city
milestone: rationalisation
version: v0.16.0
labels: [sprint]
status: shipped
blocked:
pr: "local 351dc74e"
evidence: none # schéma + ADR, pas d'écran
split_from: "20261002130235353"
created: 2026-10-13
---

# 20261013131853182 — Trancher le sort de la valeur in-progress du schéma

**En clair.** Une fois « en cours » déduit des branches (fiche sœur), la valeur `in-progress` du
schéma des statuts n'est plus écrite par personne. Il faut trancher son sort, par un **ADR court** :
soit la garder comme état **calculé** (affiché par les vues, jamais écrit), soit la **retirer** du
schéma. Comme aucune fiche ne l'a jamais portée, la retirer ne migre rien — c'est un petit geste.

**Si tu arrives frais.** Le *schéma des statuts* est la liste fermée des `status:` admis
(`idea`, `ready`, `shipped`…), validée par un test. La règle « pas de code mort » pousse à retirer ce
qui ne sert plus.

## Contexte / Problème

La fiche sœur [« En cours » se déduit des branches](20261013131852984_en-cours-deduit-des-branches-portier-vue.md)
rend l'état « en cours » **calculé**, jamais écrit. Reste une décision durable : que devient la valeur
`in-progress` du schéma, que plus personne n'écrit (0 fiche sur 330) ? La laisser sans trancher, c'est
du code mort latent. L'option choisie borne le petit build qui suit.

## Proposition

Un **ADR court** tranche entre deux options, toutes deux petites :
- **Garder comme calculé** : documenter que `in-progress` est un état affiché par les vues, jamais
  écrit en frontmatter ; le validateur peut l'interdire en `status:` écrit.
- **Retirer** : ôter `in-progress` de la liste des `status:` admis (schéma + validateur). Aucune fiche
  ne l'emploie → pas de migration de contenu.

Appliquer l'option retenue (quelques lignes de schéma/validateur + le test qui va avec).

## Critères d'acceptation

- [ ] Un **ADR court** acte le sort de `in-progress` (gardé-calculé ou retiré), avec sa raison.
- [ ] L'option retenue est **appliquée** : schéma + validateur + test alignés.
- [ ] `grep -l 'status: in-progress' features/*.md` reste vide (rien à migrer, invariant préservé).

## Comment vérifier

```bash
pnpm --dir products/mega-city test   # le validateur de statuts reflète la décision de l'ADR
```

## Notes / décisions

- Découpée de la fiche `20261002130235353` le 2026-10-13 (le **critère 6** : trancher le schéma). Le
  mécanisme « en cours déduit des branches » est la fiche sœur, même version v0.16.0 ; à construire
  **après** elle (l'état calculé doit exister avant de retirer la valeur écrite).
- **Panel adverse facultatif** (la fiche mère le notait) : décision bornée, deux options claires,
  aucune migration de contenu. `ezk-reviewer` revoit le build dans tous les cas (ADR-0059).

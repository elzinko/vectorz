---
id: 0048
title: ezk-backlog — champ `product` optionnel dans le front-matter (backlogs multi-produits)
type: feature
priority: P2
product: mega-city
version:
status: shipped
pr:
created: 2026-07-13
---

> ⚠️ **Clôturée « sans objet » le 2026-07-17 (review) — aucun code livré.** Déplacée dans
> `done/` comme fiche résolue *won't-do*. Motif : sa prémisse (**un seul backlog partagé**
> multi-produits) est **contredite par ADR-0017 A13** (deux backlogs, résolution « le plus
> proche du cwd ») et par la décision PO du 2026-07-17 (garder deux backlogs + une **vue
> portfolio** générée par-dessus). La distinction de produit vient de l'**emplacement**
> (`features/` racine vs `products/mega-city/features/`), pas d'un champ `product:` par fiche —
> le champ n'a donc plus d'objet. À rouvrir seulement si un jour un backlog **unique**
> multi-produits est réellement adopté.

# 0048 — ezk-backlog : champ `product` pour les backlogs partagés

## Contexte / Problème

Décision côté cop1 (capture `docs/captures/2026-07-13-contrat-methode-et-versions.md`, Q6) :
cop1 et mega-city vont être co-développés dans un **seul monorepo avec un backlog partagé**.
Le front-matter des fiches ezk-backlog (`id/title/type/priority/version/status/pr/created`)
n'a **aucun champ pour dire à quel produit une fiche appartient** — dans un repo
multi-produits, la liste devient illisible et le tri par produit impossible.

## Proposition

Ajouter un champ **optionnel** `product:` au front-matter, dans `SKILL.md` (template YAML +
règles) et `feature-template.md` :

```yaml
product:             # optionnel — requis seulement si le repo héberge plusieurs produits
                     # ex. cop1 | mega-city | transverse
```

Règles d'usage dans la skill :
- **Repo mono-produit : champ omis** (zéro bruit, rien ne change pour les repos existants).
- **Repo multi-produits** (plusieurs produits déclarés/détectés) : `add` **demande** le produit
  (comme il demande `priority` — ne l'invente jamais) ; `regen` ajoute une colonne Produit et
  tolère les fiches sans champ (affichées `—`).
- **Adoption progressive** : pas de backfill massif — le champ s'ajoute quand on **touche** une
  fiche (add/grooming/ship), comme le veut la question d'origine (« les produits qui utilisent
  la skill ajoutent le champ lors des prochaines utilisations »).

## Critères d'acceptation

- [ ] `SKILL.md` : template front-matter + règles `add`/`regen` mis à jour (optionnel,
      demande en multi-produits, tolérance à l'absence).
- [ ] `feature-template.md` mis à jour (ligne commentée).
- [ ] Rétro-compatible : un backlog existant sans champ `product` régénère à l'identique.
- [ ] La propagation vers les projets consommateurs passe par le mécanisme de la fiche 0029
      (propagation des MAJ de skills) — pas de patch manuel par repo.

## Notes / décisions

- Demandé par le co-développement cop1↔mega-city (option E, ADR de révision d'ADR-023 à venir
  côté cop1). Lié : fiche 0029 (propagation), ADR-0006 (bind).

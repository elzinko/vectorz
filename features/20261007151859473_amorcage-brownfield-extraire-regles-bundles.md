---
id: "20261007151859473"
title: "Amorçage brownfield : extraire les règles d'un projet existant → bundles"
type: feature
priority: P2
product: vectorz
milestone: portabilite
version: V0.10
labels: [portabilite, brownfield, regles]
status: idea
pr:
evidence: none
created: 2026-10-07
---

# 20261007151859473 — Amorçage brownfield : extraire les règles → bundles

**En clair.** Quand on démarre vectorz sur un projet qui **existe déjà**, ses conventions sont
implicites dans le code. On veut que vectorz les **lise et les écrive en règles/bundles AVANT** de
travailler, pour que les agents les respectent ensuite. On codifie **ce qui est**, puis on l'impose.

**Si tu arrives frais.** Les « règles » de la méthode vivent dans `rules/<catégorie>/` et sont
matérialisées par des `bundles/<catégorie>.yml` (sinon une règle est orpheline). Prior art :
**Agent OS**, qui part du code existant pour remonter aux standards, au lieu d'écrire une spec vierge.

## Contexte / Problème

Aujourd'hui vectorz est **fiche-d'abord** : on décide, puis on construit (plutôt greenfield). Sur un
dépôt legacy, les conventions déjà en place (style, structure, nommage) ne sont **pas captées** — les
agents risquent de les ignorer ou de les casser.

## Proposition

POC d'abord : une passe d'extraction sur un repo cobaye.

1. Une commande/skill **lit un repo existant** et propose des **règles candidates** (style,
   structure, conventions observées).
2. Le **PO arbitre** chaque règle (jamais d'auto-application — ADR-0001, invariant « le LLM ne range
   pas »).
3. Les règles validées atterrissent dans `rules/` **et** `bundles/` (sinon orphelines).
4. Les **agents les chargent** ensuite dans le process.

## Critères d'acceptation

- [ ] Une commande/skill lit un repo existant et **propose** des règles candidates (jamais auto-appliquées).
- [ ] Les règles validées atterrissent dans `rules/` **et** `bundles/` (matérialisées, pas orphelines).
- [ ] Les agents chargent ensuite ces bundles dans le process.
- [ ] Le PO arbitre chaque règle ; aucune règle n'est posée sans son accord.

## Comment vérifier

```bash
# 1. Extraction sur un repo cobaye : des règles candidates sont proposées (pas écrites).
pnpm --dir products/mega-city ezk scout extract --root <repo-cobaye>
# 2. Après arbitrage, la règle existe dans rules/ ET dans un bundle.
ls products/mega-city/rules/<cat>/<regle>.md && grep -n "<regle>" products/mega-city/bundles/<cat>.yml
```

## Notes / décisions

- **Origine** : vision exprimée par le PO le 2026-10-07 (« le jour où je pars d'un projet existant,
  vectorz extrait les règles dans un ou des bundles pour que les agents s'en servent »).
- **Prior art** : Agent OS (Builder Methods) — standards-first, part du code.
- **Lié** : la keystone [générateur multi-IDE](20261007151859470_generateur-multi-ide-cli-moteur.md)
  (même thème portabilité / amorçage ailleurs que Claude Code).
- **À vérifier au grooming** : recoupe-t-on `ezk-scout` existant ? L'étendre plutôt que créer.

---
id: "20261007154842917"
title: "Note de migration scrum/ + bascule d'un projet consommateur (muti)"
type: chore
priority: P2
product: vectorz
milestone: rationalisation
version: V0.9
labels: [convention, arborescence]
status: idea
pr:
evidence: none # doc + refactor d'arborescence, pas d'UI
created: 2026-10-07
---

# 20261007154842917 — Note de migration + bascule d'un consommateur

**En clair.** Fiche 5 du lot V0.9. Les autres projets (muti, samplerz…) ont aussi leurs
`docs/sessions/`, `docs/retro-notes/`… On écrit une **note de migration** (la recette des `git mv`
+ `scrum: true`) et on la **prouve sur au moins un consommateur** (muti) : un seul commit atomique,
historique préservé.

**Si tu arrives frais.** Fiche sœur de la [fondation `scrum:`](20261001192624192_regrouper-artefacts-methode-dossier-scrum.md) ;
mécanisme et carte du lot dans [ADR-0066](../products/mega-city/docs/adr/0066-chemins-process-configurables-scrum.md).

## Contexte / Problème

La bascule d'un consommateur ne peut se faire qu'**après** la fiche 2 (les skills partagés doivent
lire la config). Avant ça, un consommateur qui poserait `scrum: true` verrait ses skills écrire
encore dans un `docs/` devenu vide. Une fois la fiche 2 livrée, la bascule est sûre et tient en un
commit.

## Proposition

1. **Note de migration** (dans la doc méthode) : les 5 `git mv` exacts + l'ajout `scrum: true`,
   présentés comme **un commit atomique**, avec le rollback (revert du commit).
2. **Appliquer à muti** (≥ 1 consommateur, pour prouver la recette) :
   `git mv docs/sessions scrum/sprints`, `git mv docs/retro-notes scrum/retro/notes`,
   `git mv docs/captures scrum/retro/captures`, `git mv docs/journal scrum/journal`,
   `git mv docs/pr-evidence scrum/evidence`, puis `scrum: true` dans son `.vectorz/config.yml`.
3. Vérifier qu'après bascule, les skills de muti résolvent bien vers `scrum/`.

## Critères d'acceptation

- [ ] La note de migration existe (5 `git mv` + `scrum: true` + rollback), lisible sans contexte.
- [ ] **Au moins un** consommateur (muti) est migré en **un commit**, historique préservé
      (`git log --follow` sur un fichier déplacé le montre).
- [ ] Après bascule, un artefact de process de muti résout vers `scrum/…` (via `ezk paths`).

## Comment vérifier

```bash
# Sur muti, après application de la recette :
ls scrum/sprints scrum/retro/notes scrum/journal scrum/evidence
git -C <muti> log --follow --oneline -- scrum/journal | tail -3   # historique préservé
ezk --root <muti> paths journal   # → scrum/journal
```

## Notes / décisions

- **Dépend de** la fiche 2 (impératif : skills lisent la config avant toute bascule de consommateur).
- **Dépendance externe** : le dépôt **muti** (hors monorepo). À constater accessible au grooming
  (ligne datée « dépendance muti — accès constaté le AAAA-MM-JJ ») avant de passer `ready`.
- Lot V0.9, lié par `milestone: rationalisation` + `version: V0.9` (pas de chapeau).

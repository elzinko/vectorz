---
id: "20261128094701629"
title: "La page Sprints liste tous les sprints, avec leur numéro, leur but, leur session et leur rétro"
type: feature
priority: P1
product: cop1
milestone: board
version:
labels: [theme:mission-control, sprints]
status: ready
blocked:
depends: ["20261114131612204"]
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128094701629 — La page Sprints liste tous les sprints, avec leur numéro, leur but, leur session et leur rétro

**En clair.** La page Sprints ne montre que 5 sprints sur 92, sous un nom technique. La maquette les liste
tous : « Sprint 32 — son but », sa session, et s'il a eu sa rétro. Dès que la méthode publie la liste
complète, l'écran la lit.

**Si tu arrives frais.** Mission control est l'écran de cop1. Il lit ce que la méthode publie et n'invente
rien (ADR-086). Un sprint est un lot de fiches construit d'une traite ; son titre est son but. La maquette
est la référence d'écran du PO : page « Sprints ».

## Contexte / Problème

La page dit elle-même « La méthode ne publie que les 5 derniers sprints sur 92 ». La fiche « Le sprint se
publie avec son numéro continu, son but et sa branche » ajoute au board publié un champ `sprints[]` : la
liste complète, avec numéro, but, début, fin, branche, fichier et fiches livrées. L'écran doit la lire.

## Proposition

1. **La liste** lit `sprints[]` quand la méthode le publie, sinon les 5 derniers comme aujourd'hui. La
   phrase « ne publie que les N derniers » disparaît quand la liste est complète.
2. **Chaque ligne** : « Sprint N — but », date et heure, durée, nombre de fiches, « session ‹branche› »
   (lien vers la page de la session), puce « rétro » ou « sans rétro ».
3. **La rétro d'un sprint** se déduit des captures publiées qui nomment ses sprints. Tant que les captures
   ne nomment pas leurs sprints, la puce dit « rétro : non publié ».
4. **« Afficher plus »** charge la suite ; le compteur dit « N sur M sprints ».

## Critères d'acceptation

- [ ] Avec `sprints[]` publié, la page liste tous les sprints, le plus récent d'abord, et le compteur dit
  le vrai total.
- [ ] Une ligne affiche « Sprint N — but » et « session ‹branche› » quand ces champs sont publiés ; un
  ancien sprint sans ces champs garde son nom et « session non publiée ».
- [ ] La recherche et les filtres portent sur la liste complète.
- [ ] Sans `sprints[]` (méthode plus ancienne), l'affichage d'avant est conservé.
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Sprints : http://localhost:5274 → Sprints
- `pnpm --dir products/cop1/packages/web exec vitest run`
- `pnpm --dir products/cop1/packages/app exec vitest run`

## Notes / décisions

- 2026-11-28 — Fiche née de la comparaison maquette ↔ app demandée par le PO.
- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. Repli sur les 5 derniers sprints quand la liste complète n'est pas publiée.

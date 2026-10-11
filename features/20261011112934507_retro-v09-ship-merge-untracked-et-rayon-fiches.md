---
id: "20261011112934507"
title: "Rétro v0.9 : ship-merge --local vs fichier non suivi concurrent + mesurer le rayon d'une fiche qui déplace"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [retro, ezk-pr, backlog]
status: idea
pr:
evidence: none
created: 2026-10-11
---

# 20261011112934507 — Rétro v0.9 (run auto 2026-10-11)

**En clair.** Deux frictions vécues en construisant v0.9 « ranger la maison » méritent un geste.
D'abord, `ship-merge --local` **refuse tout arbre sale**, y compris un simple fichier **non suivi**
laissé par une **autre session** dans le checkout principal partagé — ça bloque le merge local alors
qu'un `git merge --squash` n'embarque jamais un fichier non suivi. Ensuite, plusieurs fiches de
rationalisation **sous-estimaient leur rayon** : « bascule vers `scrum/` » annonçait « ~18 fixtures »
mais **168 fichiers .md** référencent ces dossiers (loi compilée incluse).

**Si tu arrives frais.** `ship-merge --local` (`skills/ezk-pr/scripts/ship-merge.sh`) fait le
squash-merge d'une branche de story sur `main` sans GitHub. Un *worktree* partage son `.git` et le
checkout principal avec d'autres sessions Claude.

## Contexte / Problème

Vécu pendant le run autonome v0.8→v0.10 du 2026-10-11 :

1. **`ship-merge --local` trop strict sur l'arbre sale.** Sa garde refuse si
   `git status --porcelain` n'est pas vide — pour éviter d'embarquer un changement **stagé** non
   validé. Mais elle refuse AUSSI sur un fichier **non suivi** (`??`), qu'un `merge --squash` +
   `commit` (sans `-a`/`add`) n'embarquerait jamais. Résultat : une autre session écrivant une
   capture de rétro dans `docs/captures/` du checkout principal a **bloqué** mes merges ; j'ai dû
   faire le squash-merge à la main (sûr, le fichier non suivi est resté intact).
2. **Rayon d'une fiche qui déplace, sous-estimé.** La fiche « basculer vers `scrum/` » listait
   « ~18 fixtures » ; en réalité **168 fichiers .md (356 occurrences)** référencent les 5 dossiers,
   dont les règles compilées en loi et des ADR/captures qui se citent. Décision au run : parquer
   (déménagement à faire sous revue). Une fiche qui `git mv` un dossier devrait **mesurer et
   afficher** son rayon de références avant d'être `ready`.

## Proposition

- **`ship-merge --local`** : distinguer *stagé/modifié* (refus, risque réel) de *non suivi* (laisser
  passer, ou refuser SEULEMENT si un fichier non suivi entre en collision avec le squash). Au
  minimum : un message qui dit « fichier non suivi d'une autre session — relance quand l'arbre est à
  toi, ou merge à la main » plutôt qu'un refus opaque.
- **DoR d'une fiche « déplacement »** : exiger une **mesure du rayon** (`git grep -l … | wc -l`) dans
  la fiche, pour que « ready » reflète le vrai coût (et déclenche « sous revue » au-delà d'un seuil).

## Critères d'acceptation

- [ ] `ship-merge --local` ne refuse plus sur un fichier **non suivi sans collision** (ou le dit
      clairement et propose le merge manuel), tout en refusant toujours un stagé non validé.
- [ ] Une note de DoR (ou le gabarit de fiche) demande la mesure du rayon pour une fiche qui déplace
      des dossiers.

## Comment vérifier

```bash
cd products/mega-city && pnpm test && pnpm test:scripts   # dont un cas ship-merge avec fichier non suivi
```

## Notes / décisions

- Sortie de la **rétro de v0.9** (run auto 2026-10-11, mode `lean`). Les autres apprentissages du run
  sont déjà fichés : le hook worktree (`20261011111526693`) et les 3 manques de `ezk-product-build`
  (`20261011103839682`). Cette fiche capture les deux frictions non encore fichées.

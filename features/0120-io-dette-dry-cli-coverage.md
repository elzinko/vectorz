---
id: 0120
title: dette I/O — factoriser resolveInside* (DRY) + couvrir la CLI capture
type: refactor
priority: P3
product: mega-city
status: todo
pr:
created: 2026-06-26
---

## Contexte / Problème
Revue de la fiche 0107 (non-bloquants).
- `resolveInsideRoot` (`src/io/capture.ts`) est un copier-coller de
  `resolveInsideProject` (`src/io/apply.ts`), à un message près → duplication DRY.
- La sous-commande CLI `capture` de `bin/lawgiver.ts` (parsing `--content`, garde
  `isCaptureKind`) n'est couverte par aucun test (le cœur l'est, pas le bord CLI).

## Proposition
- Extraire le garde anti-traversal dans un util partagé (`src/io/paths.ts`),
  utilisé par les deux coquilles I/O.
- Ajouter quelques tests sur le parsing CLI de `capture` (kind invalide → usage,
  `--content` absent → usage).

## Critères d'acceptation
- [ ] un seul `resolveInside*` partagé, les deux coquilles l'utilisent
- [ ] tests verts sur le parsing CLI capture (cas nominal + erreurs)

## Notes
Hygiène, pas de changement de comportement.

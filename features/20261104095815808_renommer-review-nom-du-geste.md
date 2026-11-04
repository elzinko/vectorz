---
id: "20261104095815808"
title: Renommer `--review` d'ezk-product-build d'un nom qui dit le geste humain, l'ancien nom restant lu
type: refactor
priority: P1
product: mega-city
milestone: qualite
version:
labels: [theme:autonomie]
status: idea
pr:
evidence: none # sortie de commande et texte de skill, pas d'écran
created: 2026-11-04
split_from: "20261104085959892"
---

# 20261104095815808 — Renommer `--review` d'un nom qui dit le geste humain

**En clair.** `--review` se lit « revue du code », alors qu'il arrête le run après chaque grooming pour
que le PO tamponne la fiche. L'ADR-0053 avait déjà renommé `--check-ready` pour la même raison. On
choisit un nom sans « review », l'ancien reste lu, et la skill emploie le nouveau.

## Contexte / Problème

Le 2026-10-30, le PO a lancé `run --mode auto --review` en croyant activer la revue du code ; le run
s'est arrêté pour faire tamponner les fiches. Détail dans la fiche mère.

## Proposition

- Choisir le nom au grooming. Pistes : `--ask-ready`, `--stamp-ready`, `--tamponne-moi`.
- `--review` et `--check-ready true` restent acceptés et mappent sur le nouveau nom ; le contexte de run
  dit « `--review` est l'ancien nom de `--X` ».
- La skill `ezk-product-build` (texte et `argument-hint`) et un amendement court de l'ADR-0053 emploient
  le nouveau nom.

## Critères d'acceptation

- [ ] Le réglage porte un nom sans « review », choisi au grooming.
- [ ] `--review` et `--check-ready true` restent acceptés et le contexte de run les nomme comme anciens noms.
- [ ] La skill et l'ADR-0053 (amendement) emploient le nouveau nom.
- [ ] Les tests du contexte de run couvrent le nouveau nom et l'ancien.

## Comment vérifier

```bash
ezk run context --mode auto --tokens lean --delivery per-feature --no-fetch --review
pnpm --dir products/mega-city vitest run src/core/__tests__/run-context.test.ts
```

## Notes / décisions

- Découpée de la fiche [`--review` se lit « revue du code »](done/20261104085959892_review-se-lit-revue-du-code.md)
  le 2026-11-04. Sœur : [Le contrat du run annonce l'arrêt de `--review`](20261104095815710_contrat-run-annonce-arret-review.md).
- Le nom est un choix de vocabulaire : à trancher au grooming, par le PO ou par `ezk-pm` en mode auto.

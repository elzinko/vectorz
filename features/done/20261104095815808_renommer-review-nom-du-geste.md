---
id: "20261104095815808"
title: Renommer `--review` d'ezk-product-build d'un nom qui dit le geste humain, l'ancien nom restant lu
type: refactor
priority: P1
product: mega-city
milestone: qualite
version:
labels: [theme:autonomie]
status: shipped
pr: "local (7550b68f)"
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

Le nom retenu est **`--stamp-ready`** (décision `ezk-pm`, mode auto, le 2026-11-04).

- `ezk run context` lit `--stamp-ready`. `--review` et `--check-ready true` restent acceptés et mappent
  dessus ; quand l'un d'eux est employé, le contexte de run ajoute une ligne : « `--review` est l'ancien
  nom de `--stamp-ready` ».
- La ligne d'arrêt du contrat (fiche [Le contrat du run annonce l'arrêt](20261104095815710_contrat-run-annonce-arret-review.md))
  cite `--stamp-ready`.
- La skill `ezk-product-build` emploie `--stamp-ready` partout ; une phrase garde l'ancien nom lisible.
  Son ouverture parle des cas d'arrêt du contrat, pas de « 4 STOP » figés.
- Un amendement court de l'ADR-0053 note le renommage et sa raison.

Deux surfaces : la commande et le texte (skill + ADR).

## Critères d'acceptation

- [x] `ezk run context … --stamp-ready` annonce l'arrêt après chaque grooming, en citant `--stamp-ready`.
- [x] `--review` et `--check-ready true` donnent le même contrat, plus une ligne qui les nomme anciens noms de `--stamp-ready`.
- [x] La skill `ezk-product-build` (texte et `argument-hint`) emploie `--stamp-ready` ; `--review` n'y apparaît plus que comme ancien nom.
- [x] L'ADR-0053 porte un amendement daté qui note le renommage.
- [x] Les tests du contexte de run couvrent le nouveau nom et les deux anciens.

## Comment vérifier

```bash
ezk run context --mode auto --tokens lean --delivery per-feature --no-fetch --stamp-ready
ezk run context --mode auto --tokens lean --delivery per-feature --no-fetch --review
grep -c -- '--stamp-ready' products/mega-city/skills/ezk-product-build/SKILL.md
pnpm --dir products/mega-city vitest run src/core/__tests__/run-context.test.ts
```

## Notes / décisions

- Découpée de la fiche [`--review` se lit « revue du code »](20261104085959892_review-se-lit-revue-du-code.md)
  le 2026-11-04. Sœur : [Le contrat du run annonce l'arrêt de `--review`](20261104095815710_contrat-run-annonce-arret-review.md).
- Le nom est un choix de vocabulaire : à trancher au grooming, par le PO ou par `ezk-pm` en mode auto.
- 2026-11-04 : `ezk-pm` (mode auto) retient **`--stamp-ready`** : il nomme le geste humain, garde l'anglais
  des réglages et suit l'ADR-0053. Réversible ; le PO peut en choisir un autre au grooming.

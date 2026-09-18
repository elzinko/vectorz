---
id: "20260918113211648"
title: "Template de fiche : distinguer « Critères d'acceptation » de « Comment vérifier »"
type: chore # feature | bug | refactor | chore | epic
priority: P2 # P0 | P1 | P2 | P3
product: mega-city # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: # optionnel — id de la fiche épic parente (type: epic)
labels: [méthode, template]
status: ready # idea | ready | in-progress | blocked | shipped
ready: 2026-09-18 # YYYY-MM-DD — posé par le gate `ready <id>` (DoR complète)
pr:
evidence: none # template markdown, pas d'écran
created: 2026-09-18
---

# 20260918113211648 — Template : distinguer critères d'acceptation et comment vérifier

## En clair

Le template de fiche ne séparait pas assez deux sections voisines : « Critères d'acceptation »
(ce qui doit être vrai) et « Comment vérifier » (comment le prouver). Résultat : on recopiait les
critères en commandes, et les deux se répétaient. On ajoute la consigne qui les sépare, pour que
toutes les fiches futures évitent ce piège.

## Contexte / Problème

Retour du PO (Thomas, 2026-09-18) sur la fiche du câblage `ezk-pr` : ses deux sections se
recopiaient. Le template interdisait déjà de recopier le **Gherkin** (« orienter et lier »), mais
**pas** de recopier les **critères d'acceptation** dans « Comment vérifier ». Sans cette consigne,
les deux sections se dupliquent, et « coché » devient auto-déclaré au lieu d'être prouvé par une
vérification indépendante.

## Proposition

Deux clarifications dans `products/mega-city/skills/ezk-backlog/templates/feature-template.md` :

1. **« Critères d'acceptation »** = le RÉSULTAT observable, pas la commande qui le prouve ; une
   case cochée = **prouvé** (idéalement par un panel/reviewer qui a rejoué « Comment vérifier »),
   jamais auto-déclaré.
2. **« Comment vérifier »** = la PROCÉDURE que le panel **rejoue pour cocher** — sans recopier ni
   le Gherkin **ni les critères**.

Changement de **contenu** du template (consignes de rédaction), pas de sa structure : la version
de layout (Skema) ne bouge pas.

## Critères d'acceptation

- [ ] La section « Critères d'acceptation » du template dit que c'est le **résultat** (pas la
      commande) et que « coché = prouvé par un panel », pas auto-déclaré.
- [ ] La section « Comment vérifier » du template dit que c'est la **procédure** que le panel
      rejoue, et interdit la recopie **des critères** (au même titre que le Gherkin).
- [ ] Les tests liés au template restent verts (version de layout inchangée, contrat de lisibilité).

## Comment vérifier

Un panel adverse lit les deux sections du template et confirme qu'elles ne se recoupent plus ;
il vérifie aussi que **cette fiche elle-même** respecte la distinction (dogfooding). Commandes,
depuis la racine d'un clone frais de vectorz :

```bash
sed -n '/## Critères d.acceptation/,/## Glossaire/p' products/mega-city/skills/ezk-backlog/templates/feature-template.md
bash products/mega-city/skills/ezk-backlog/scripts/test-layout-version.sh .
pnpm --dir products/mega-city exec vitest run src/__tests__/human-facing-lisibility-contract.test.ts
```

## Notes / décisions

- **Retour PO** (Thomas, 2026-09-18) : « corrige le template » — suite au constat de recopie sur
  la fiche du câblage `ezk-pr` ([[20260917221003631]]).
- **Dogfooding** : cette fiche applique la consigne qu'elle ajoute (les deux sections ne se
  recopient pas).
- Distinct du **CLI `ezk`** ([[20260903134906920]]) qui, lui, rendra les commandes de « Comment
  vérifier » lançables depuis n'importe quel terminal (portabilité) — sujet séparé.

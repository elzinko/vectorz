---
id: "20261128120000211"
title: "Distinguer « lot livré », que le run scelle seul, de « version complète », qui attend le PO"
type: feature
priority: P3
product: mega-city
milestone:
version:
labels: [theme:outillage-methode, origine:retro-2026-11-28]
status: idea
blocked:
depends: []
pr:
evidence: none
created: 2026-11-28
---

# 20261128120000211 — Distinguer « lot livré », que le run scelle seul, de « version complète », qui attend le PO

**En clair.** Le 14 octobre, un run autonome n'a pas pu poser le tag de sa version. Trois fiches réservées au PO y restaient rattachées. Le run avait pourtant livré tout son lot. Cette fiche sépare ce que le run peut sceller seul de ce qui attend le PO.

## Contexte / Problème

Une version porte des fiches que le run construit, et parfois des fiches qui attendent une décision ou un panel du PO. Aujourd'hui, seule la version complète se clôt. Le run ne peut donc rien sceller dès qu'une fiche attend le PO.

## Proposition

Le bilan de run et la clôture de version distinguent deux états : « lot livré », scellable par le run, et « version complète », qui demande toutes les fiches. Le run scelle son lot et liste les fiches qui attendent le PO. La coupe de la version reste un geste du PO.

## Critères d'acceptation

- [ ] Un run qui a livré tout son lot le scelle, même si la version porte une fiche réservée au PO.
- [ ] Le bilan nomme chaque fiche qui attend le PO, avec sa raison.
- [ ] La coupe et le tag de la version restent refusés tant qu'une fiche n'est pas livrée ou sortie.

## Comment vérifier

- Sur un backlog de test avec une fiche réservée au PO dans la version : le run scelle son lot et la coupe refuse avec la liste.

## Hors périmètre

- Poser le tag sans le PO.

## Notes / décisions

- 2026-11-28 — Née de [la rétro du 28 novembre](../docs/captures/2026-11-28-retro-run-migration-maquette.md), proposition retenue par le PO.

---
id: 2080
product: mega-city
title: ezk-retro — compte rendu markdown standard de cérémonie (capture versionnée, décisions PO tracées, via PR)
type: feature
priority: P2
epic:
status: todo
ready:
pr:
created: 2026-07-18
---

# 0080 — ezk-retro consigne ses cérémonies

## Contexte / Problème

La première rétro réelle (2026-07-18) a montré que le skill `ezk-retro` déroule bien sa
cérémonie (lentilles → convergence → juge → PO) mais **ne prévoit aucune trace
versionnée** : le compte rendu a été rédigé à la main, après coup, sur demande du PO
(« est-il possible de consigner les interactions de la rétro dans un fichier markdown ?
histoire de pouvoir y revenir ultérieurement »). Résultat : sans ce geste manuel, les
débats, les retraits d'auteurs et les verdicts du juge se seraient évaporés avec la
session.

## Valeur

Chaque rétro laisse un **document relisible des mois plus tard** : qui a proposé quoi,
ce qui a été écarté et pourquoi, ce que le PO a décidé — la matière première pour
mesurer ensuite si les règles adoptées servent (et les retirer sinon).

## Proposition

Étendre le SKILL.md d'`ezk-retro` (temps 5, rangement) :

1. La cérémonie **produit systématiquement** une capture
   `docs/captures/AAAA-MM-JJ-retro-<slug>.md` (convention existante des captures —
   l'épouser, pas de nouveau dossier), avec les sections éprouvées le 2026-07-18 :
   faits de départ (symptômes) · propositions par lentille (tour 1) · débats et
   retraits (tour 2) · verdicts du juge · propositions finales en langage courant ·
   décisions du PO (tableau, `⏳ en attente` tant que non tranché) · glossaire.
2. Rédigée en **voix lisible PO** (compose la fiche 0079 — la voix).
3. Livrée **via PR** avec le rangement des règles adoptées (une PR par rétro).
4. Modèle de référence : `docs/captures/2026-07-18-retro-cinq-sprints.md` (la première,
   rédigée à la main — devient le gabarit).

## Critères d'acceptation

- [ ] Le SKILL.md d'ezk-retro exige la capture en fin de cérémonie (diff visible,
      sections listées).
- [ ] La rétro suivante produit sa capture sans demande du PO (preuve : le fichier
      existe dans la PR de rangement).
- [ ] Le tableau « Décisions du PO » reflète les décisions réelles (jamais pré-rempli —
      garde-fou : c'est l'erreur commise puis corrigée le 2026-07-18).
- [ ] La capture est liée depuis la PR de rangement (traçabilité règle ↔ débat).

## Notes

- **Priorité P2 proposée** (à confirmer par le PO).
- Origine : rétro 2026-07-18, demande directe du PO. S'articule avec 0079 (la voix) ;
  0080 porte le support/artefact.

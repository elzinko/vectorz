---
id: "20261128120000203"
title: "Quand une story touche un contrat, la gate rejoue les tests de ses lecteurs et dit ce qu'elle n'a pas contrôlé"
type: feature
priority: P1
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

# 20261128120000203 — Quand une story touche un contrat, la gate rejoue les tests de ses lecteurs et dit ce qu'elle n'a pas contrôlé

**En clair.** Le 26 novembre, la story qui publie les alertes a ajouté un lot à l'exemple d'un contrat. Cinq tests de mission control ont cassé, car ils prenaient ce lot par sa place dans la liste. La gate de la story ne lançait que les tests de la méthode. Cette fiche fait rejouer les lecteurs du contrat, fait lire par clé, et fait dire à la gate ce qu'elle ne couvre pas.

**Si tu arrives frais.** Un contrat est le JSON qu'une commande `ezk … --json` publie. Ses lecteurs sont les programmes qui le lisent, ici le daemon de mission control (`products/cop1/packages/app`).

## Contexte / Problème

- Les tests du daemon lisent `lots[1]` dans l'exemple du contrat `board-show` (vu dans `ezkPlanTranslator.test.ts`).
- Le défaut n'est apparu qu'au sprint suivant, au moment de reprendre la branche.
- Le lint exclut `products/cop1/packages/web` (biome.json) ; la gate ne le dit pas.
- Même famille que la décision en attente du 24 novembre : un test par relais du daemon fait passer l'exemple entier du contrat.

## Proposition

Trois tranches dans une même fiche :

1. Une liste déclarée « contrat → lecteurs » (fichier du dépôt). La gate d'une story qui touche un contrat ou son exemple rejoue les tests de chaque lecteur. Un test échoue si un contrat n'a pas de lecteur déclaré.
2. Les tests et relais des lecteurs choisissent un élément du contrat par sa clé (version, id), jamais par sa place.
3. La sortie de gate porte une ligne « contrôlé : … » et une ligne « non contrôlé : … » (par exemple le lint du web de mission control).

## Critères d'acceptation

- [ ] Modifier l'exemple de `board-show` lance aussi les tests du daemon de mission control.
- [ ] Aucun test de lecteur n'accède à un élément du contrat par son index.
- [ ] Un contrat sans lecteur déclaré fait échouer un test de la liste.
- [ ] La sortie de gate nomme ce qu'elle n'a pas contrôlé.

## Comment vérifier

- Ajouter un lot en tête de l'exemple `board-show` dans une branche de test : la gate de la story échoue sur les tests du daemon, pas un sprint plus tard.

## Hors périmètre

- Brancher le lint sur le web de mission control.

## Notes / décisions

- 2026-11-28 — Née de [la rétro du 28 novembre](../docs/captures/2026-11-28-retro-run-migration-maquette.md), proposition retenue par le PO.

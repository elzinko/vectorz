---
id: "20260824122629925"
title: "Une FAQ « comment faire » pour tes questions récurrentes"
type: feature
priority: P1
product: mega-city
labels: [lisibilite]
version: V0.3
epic:
depends: ["20260824122629794"]
status: idea
pr:
created: 2026-08-24
---

## En clair

Tu te reposes souvent les mêmes questions : « ai-je déjà une commande pour ça ? », « qui analyse la méthode ? ». La réponse existe, mais elle est éparpillée. Cette fiche pose **une FAQ « comment faire »** : un seul fichier, une réponse courte par question, et un lien vers la commande ou l'ADR qui fait autorité.

Elle remet aussi à jour le **tableau des skills** du catalogue, pour qu'il se lise d'un coup d'œil. Un test empêche la FAQ et le tableau de mentir : une commande citée qui n'existe pas fait passer la CI au rouge.

## Contexte / problème

Constat PO (2026-08-24) : les mécanismes de la méthode (recette, rule, capability, profil, extract…) se mélangent. Tu perds du temps à re-chercher ou à re-demander. Le glossaire (`docs/glossaire-jargon-ezk.md`) définit les **mots**. Il manque le « **comment faire X** » : quelle commande, déjà implémentée ou pas.

## Décisions de grooming

- **Support** : un fichier `docs/faq-comment-faire.md`, lié depuis le README et `docs/index.md`. Pas d'onglet dans la carte : la carte est une vue générée, alors que la FAQ doit rester éditable à la main et lisible sur GitHub.
- **Dépendance levée** : la fiche sœur `20260824122629794` est livrée (PR #194, `/ezk-chef extract`). L'entrée « capitaliser une feature » est donc écrite, avec sa limite réelle : `extract` part d'une fiche livrée, pas encore du code d'un autre projet.
- **Tableau des skills** (volet repris de `20260813131737962`) : on réécrit le tableau de `products/mega-city/skills/README.md`. Une ligne par skill, une phrase par ligne, une colonne « profil » vérifiable (`global` ou `opt-in`). L'axe de maturité (ready / experimental / deprecated) n'est pas vérifiable par un script : il reste en « Suite ».
- **Qui analyse la méthode** (repris de `20260813131737971`) : une entrée de FAQ, pas un chantier. Trois rôles distincts : `/ezk-retro`, l'agent `ezk-steward`, la fiche 0057.
- **Fraîcheur** : un test lit la FAQ, relève chaque commande, agent ou script `pnpm` cité, et vérifie qu'il existe.

## Critères d'acceptation (reste réel)

- [x] `docs/faq-comment-faire.md` existe, ouvre par « En clair » et est liée depuis le README (et `docs/index.md`). Preuve : `faq-freshness.test.ts`.
- [x] 8 entrées réelles : trouver une commande ; noter une idée puis tirer une fiche ; lancer un sprint ; capitaliser une feature en recette ; savoir qui analyse la méthode ; clôturer une session ; tester un lot de PRs ; voir la carte de la méthode.
- [x] Chaque entrée = une réponse « En clair » + un lien vers une source qui existe. Preuve : le test (lien présent) et `check-links.sh` (lien valide).
- [x] Le tableau de `skills/README.md` liste **tous** les dossiers de skills (25), une ligne chacun, sans total codé en dur ni `install.sh`. Preuve : `catalog-readme.test.ts`.
- [x] Un test passe au rouge si la FAQ cite une commande, un agent ou un script inexistant, ou si un skill du dossier manque au tableau.
- [x] Sabotage prouvé à la main : `/ezk-fantome` ajouté en ligne 76 de la FAQ → test rouge, « L76: … ni skill, ni commande ».

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/__tests__/faq-freshness.test.ts src/__tests__/catalog-readme.test.ts
bash products/mega-city/bin/check-links.sh . features docs/adr docs/captures
```

Sabotage à la main : écrire `/ezk-fantome` dans la FAQ et relancer le premier test. Il passe au rouge et nomme la ligne.

## Suite (hors POC)

- Onglet FAQ dans la carte interactive, si tu en veux un.
- Générer le tableau des skills depuis les front-matter (aujourd'hui curé à la main, gardé par test) et y ajouter l'axe de maturité décidé par le PO.
- Nouvelles entrées au fil des questions récurrentes.
- Reste de `20260813131737971` : trancher « un seul juge de cohérence » et corriger `ezk-retro` (deux noms pour le juge ; le lien vers `0113-chief-judge.md` est mort, la fiche n'existe plus).
- Déployer `ezk-chef` et `ezk-bug` : aucun profil ne les porte aujourd'hui (la FAQ le dit pour `ezk-chef`).

## Notes

Origine : `/ezk-backlog add` du 2026-08-24. P1 proposée (PO « urgent »).

## ⤓ Absorbe (tri du 2026-09-30)

Cette fiche reprend le périmètre de :

- [`20260813131737962`](done/20260813131737962_nommage-catalogue-adr0022.md) — Nommage & catalogue. Deux volets sur trois étaient livrés ailleurs ; il restait le tableau scannable. _Repris ici_ : tableau complet, une ligne par skill, test « tous les dossiers sont catalogués ».
- [`20260813131737971`](done/20260813131737971_carte-roles-analyse-methode.md) — Carte des rôles d'analyse (retro / steward / 0057). _Repris ici_ : une entrée de FAQ. Le choix « un seul juge de cohérence » et la correction des références périmées dans `ezk-retro` restent à faire : voir « Suite ».

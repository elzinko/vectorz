---
id: "20261014200651962"
title: "Cycle de vie d'une version — préparer, valider/figer pour développer, compléter en souplesse"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [backlog, version, board]
status: idea
pr:
evidence: none # capacité de méthode (commande version + bouton côté board) ; preuve = tests + démo
created: 2026-10-14
---

# 20261014200651962 — Cycle de vie d'une version

**En clair.** Aujourd'hui, la « version en cours » est **implicite** : c'est la plus basse pas encore
étiquetée. On ne la **démarre** jamais vraiment. Je veux la rendre explicite : **préparer** une
version librement (brouillon), puis un geste PO — le « bouton » — qui la **valide et la fige** pour la
développer, puis la **développer** en gardant le droit d'ajouter des fiches de complétude (fix,
dépendances, dette) pour qu'elle soit vraiment aboutie. Le gel est **souple** : il pose une base, pas
un verrou.

**Si tu arrives frais.** Une *version* (ex. `v0.16.0`) regroupe un lot de fiches. Elle passe
aujourd'hui de « en cours » (la plus basse sans étiquette git, ADR-0070) à « livrée » (étiquetée). Il
n'y a **pas d'étape explicite** « validée, on développe » entre les deux.

## Contexte / Problème

- **La version en cours est subie, pas choisie.** ADR-0070 la définit comme « la plus basse pas
  taguée ». Dès qu'une version le devient, elle est « en cours » — sans geste de démarrage.
- **Pas de gel au niveau version.** Les gestes proches sont à d'autres grains : `sprint start --lot`
  fige le lot d'**un sprint** ; `version close` étiquette **à la fin**. Rien ne dit « je valide le
  périmètre de la version et je la passe en développement ».
- **Préparer puis figer n'est pas matérialisé.** Mettre/retirer des fiches d'une version en
  préparation, puis arrêter le périmètre, se fait à la main dans `PLAN.md` et les champs `version:`,
  sans cycle lisible.
- **La complétude arrive en cours de route.** Pendant le dev, des besoins surgissent (un fix, une mise
  à jour Dependabot, de la dette). Ils doivent pouvoir entrer **sans « rouvrir »** formellement la
  version — sinon soit on bloque, soit on perd la trace de ce qui était prévu vs ajouté.

## Proposition

À cadrer au grooming et avec l'architecte. Direction :

- **Un état de version explicite** : `brouillon` (préparable) → `figée` (en développement) → `livrée`
  (étiquetée). Le passage `brouillon → figée` est le **geste PO** (« le bouton »).
- **Côté commande `version`** : un verbe pour **figer/valider** (arrête la base du périmètre),
  distinct de `close` (étiquette finale).
- **Gel souple** : une fois figée, **ajouter** une fiche (fix, Dependabot, dette) reste permis, mais
  **tracé comme ajout** au périmètre gelé — pas comme une réouverture. La **base** (prévu) reste
  distinguable des **ajouts** (complétude).
- **Côté board v0.17** : le « bouton » et l'état de version s'affichent ; ça se branche sur les **deux
  jauges par version** déjà gravées (cadrage puis réalisation, ADR-074).
- **Articulation avec ADR-0070** : la « version en cours » devient la version **figée** (explicite),
  au lieu de « la plus basse pas taguée » (implicite). Le tirage s'appuie dessus.

## Critères d'acceptation

Niveau *idée* — la cible, à préciser au grooming.

- [ ] Une version porte un **état explicite** (`brouillon` / `figée` / `livrée`), lisible par la
      commande et par le board.
- [ ] Un **geste PO fige** une version (valide le périmètre, la déclare en développement), distinct de
      l'étiquette finale.
- [ ] Après le gel, **ajouter** une fiche de complétude (fix, Dependabot) est permis et **tracé comme
      ajout**, sans rouvrir la version.
- [ ] La **base gelée** reste distinguable des **ajouts** (prévu vs ajouté).
- [ ] Le **tirage** (ADR-0070) s'appuie sur la version figée.
- [ ] Gate locale verte (typecheck / lint / tests).

## Comment vérifier

Esquisse (noms indicatifs, à trancher au groom).

```bash
ezk backlog version freeze <X>     # brouillon → figée : arrête la base du périmètre (geste PO)
# ajouter ensuite une fiche version: <X> → marquée « ajout » (complétude), pas réouverture
ezk backlog version list           # montre l'état + base vs ajouts
# le board v0.17 affiche le bouton et l'état de la version
```

## Glossaire

- `gel souple` — figer le périmètre d'une version comme **base de référence**, tout en autorisant des
  ajouts **tracés**.
- `ajout de complétude` — une fiche entrée **après** le gel pour que la version soit aboutie (fix, mise
  à jour de dépendance, dette).

## Notes / décisions

- **Origine** : vision PO du 2026-10-14 (conversation de planning) — « préparer les versions et les
  modifier ensuite », « un bouton pour valider et figer pour développer », « droit d'ajouter des
  fiches (fix, Dependabot…) pour que la version soit aboutie ».
- **Étend** la commande `version` (livrée, [[20260824204751403]]) et le **board v0.17**
  ([[20261007135620590]], deux jauges par version, ADR-074). **Réconcilie** avec
  [ADR-0070](../products/mega-city/docs/adr/0070-le-tirage-reste-dans-la-version-en-cours.md) (le
  tirage reste dans la version en cours).
- **Grain** : le gel de version est **au-dessus** de `sprint start --lot` (grain sprint).
- **À groomer (archi)** : où vit l'état de version (front-matter d'un manifeste ? étiquette légère ?
  fichier ?) ; le verbe exact de la commande ; la sémantique « ajout » vs « réouverture » ; l'articulation
  précise avec ADR-0070 (une version figée supérieure peut-elle coexister avec une inférieure pas encore
  taguée ?).

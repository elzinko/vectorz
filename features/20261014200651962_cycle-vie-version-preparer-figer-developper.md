---
id: "20261014200651962"
title: "Cycle de vie d'une version — préparer, figer (marqueur vérifiable), compléter en souplesse"
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

**En clair.** On veut rendre **visible et durable** l'état d'une version dans son cycle : *brouillon*
(on la prépare), *figée* (son périmètre est arrêté), *livrée* (étiquetée). Le passage en *figée* est
un **geste PO** — le « bouton ». Ce gel **ne commande pas** le développement (le tirage reste à
l'ADR-0070) : c'est un **marqueur**. Mais un marqueur qu'on veut **vérifiable** (pouvoir prouver ce qui
était figé) et **persistant** (le retrouver en rouvrant le dashboard plus tard). Le gel est **souple** :
on peut ajouter après coup des fiches de complétude (fix, Dependabot), tracées comme ajouts.

**Si tu arrives frais.** Une *version* (ex. `v0.16.0`) regroupe un lot de fiches. Elle passe
aujourd'hui de « en cours » (la plus basse sans étiquette git, ADR-0070) à « livrée » (étiquetée). Il
n'y a **pas d'étape explicite** « validée, on développe » entre les deux.

## Contexte / Problème

- **L'état d'une version dans son cycle n'est ni explicite ni durable.** On devine « où elle en est »
  (préparée ? arrêtée ? livrée ?) à la prose de `PLAN.md` et aux champs `version:`. Pas de marqueur
  posé par le PO, persistant et relisable par le dashboard.
- **Pas de gel au niveau version.** Les gestes proches sont à d'autres grains : `sprint start --lot`
  fige le lot d'**un sprint** ; `version close` étiquette **à la fin**. Rien ne pose un marqueur
  « je valide et j'arrête le périmètre de cette version ».
- **Préparer puis figer n'est pas matérialisé.** Mettre/retirer des fiches d'une version en
  préparation, puis arrêter le périmètre, se fait à la main dans `PLAN.md` et les champs `version:`,
  sans cycle lisible.
- **La complétude arrive en cours de route.** Pendant le dev, des besoins surgissent (un fix, une mise
  à jour Dependabot, de la dette). Ils doivent pouvoir entrer **sans « rouvrir »** formellement la
  version — sinon soit on bloque, soit on perd la trace de ce qui était prévu vs ajouté.

## Proposition

À cadrer au grooming et avec l'architecte. Direction :

- **Un état de version explicite** : `brouillon` → `figée` → `livrée`. Le passage en `figée` est le
  **geste PO** (« le bouton »). **Ce n'est pas un gate de dev** : le tirage reste gouverné par
  l'ADR-0070 ; figer est un **marqueur**, pas un ordre.
- **Trois forces possibles pour « figer » — le vrai choix** :
  - **déclarer** — un drapeau (ex. `VERSIONS.md`) : dit « figé », n'empêche rien, ne prouve rien ;
  - **photographier** — un **tag git sur le commit** de référence : capture le contenu figé, rend
    toute dérive **détectable** par diff ;
  - **verrouiller** — une **garde** (hook / check) qui refuse d'éditer une fiche figée : empêche
    vraiment, plus lourd.
  Préférence PO (2026-10-15) : **photographier**, *pas* un `VERSIONS.md` déclaratif (un drapeau ne
  garantit rien sur les fiches).
- **Gel souple** : une fois figée, **ajouter** une fiche (fix, Dependabot, dette) reste permis, **tracé
  comme ajout** au périmètre gelé — la base (photographiée) reste distinguable des ajouts.
- **Côté board v0.17** : l'état se **lit** et s'affiche (cop1 lit la méthode, ne l'écrit pas) ; se
  branche sur les **deux jauges par version** (ADR-074).
- **N'interfère pas avec le tirage** (ADR-0070) : le gel est un marqueur **parallèle**, pas la
  « version en cours » du tirage.

## Critères d'acceptation

Niveau *idée* — la cible, à préciser au grooming.

- [ ] Une version porte un **état explicite et persistant** (`brouillon` / `figée` / `livrée`), posé
      en git (survit à un redémarrage du dashboard), lisible par la commande et par le board.
- [ ] Un **geste PO fige** une version (arrête + **photographie** le périmètre), distinct de l'étiquette
      finale.
- [ ] Le périmètre figé est **vérifiable** : on peut montrer le contenu exact figé et **détecter**
      qu'une fiche a bougé depuis (diff).
- [ ] Après le gel, **ajouter** une fiche (fix, Dependabot) reste permis et **tracé comme ajout**, sans
      rouvrir la version ; la base reste distinguable des ajouts.
- [ ] Le gel **ne change pas** ce que le tirage développe (ADR-0070 inchangé).
- [ ] Gate locale verte (typecheck / lint / tests).

## Comment vérifier

Esquisse (noms indicatifs, à trancher au groom).

```bash
ezk backlog version freeze <X>     # brouillon → figée : photographie le périmètre (geste PO)
ezk backlog version diff <X>       # dérive depuis le gel : base photographiée vs état actuel
# ajouter ensuite une fiche version: <X> → tracée « ajout », pas réouverture
ezk backlog version list           # montre l'état (brouillon/figée/livrée) + base vs ajouts
# le board v0.17 LIT et affiche l'état
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
  ([[20261007135620590]], deux jauges par version, ADR-074).
- **N'interfère pas avec le tirage** :
  [ADR-0070](../products/mega-city/docs/adr/0070-le-tirage-reste-dans-la-version-en-cours.md) reste
  seul maître de « quelle version on code » ; figer est un marqueur **parallèle** (décision PO
  2026-10-15 : le gel ne commande pas le dev).
- **Grain** : le gel de version est **au-dessus** de `sprint start --lot` (grain sprint).
- **Décidé (PO 2026-10-15)** : (a) figer est un **marqueur**, pas un gate de dev ; (b) il doit être
  **persistant** — en git, relisable au retour sur le dashboard, pas un état volatile de cop1 ;
  (c) **pas** un `VERSIONS.md` déclaratif — préférence pour **photographier** (un tag git sur le commit
  de référence).
- **À trancher au groom / archi** : (1) la **force** exacte — photographier (tag) suffit-il, ou
  faut-il **verrouiller** (une garde refusant l'édition d'une fiche figée) ? ; (2) le verbe `version
  freeze` / `unfreeze` et où le tag est nommé ; (3) la sémantique « ajout » vs « réouverture ».
- **Limite honnête** : git ne *verrouille* pas un fichier. Un tag **enregistre et détecte** (diff), il
  n'*empêche* pas. Seule une garde (force « verrouiller ») empêche vraiment — à peser si le besoin est
  la prévention, pas seulement la preuve.

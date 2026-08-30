---
id: "20260830104013889"
title: Tour guidé in-app résilient au refactoring (Driver.js + registre data-testid)
makes: Un tour d'onboarding (Driver.js) qui cible des data-testid stables, avec un test qui casse si une cible disparaît du DOM
source: # implémentation de référence partielle (interim HelpModal.vue seulement) — voir Statut
composes: []
status: draft # pattern décrit, implémentation de référence pas encore livrée dans muti (voir Statut)
home: central
created: 2026-08-28
updated: 2026-08-30
---

# Recette — tour guidé in-app résilient au refactoring (Driver.js)

> **Document vivant.** Recette ezk réutilisable : construire un tour d'onboarding guidé
> (coach marks / spotlight) qui **survit aux refactorings de l'UI**. C'est la matière d'une
> future fiche de feature vectorz déployable sur d'autres projets web.
> Implémentation de référence : **muti** (fiche `0030` — à venir ; modale d'aide intérimaire
> livrée en PR #133).
>
> Dernière mise à jour : **2026-08-28**.

## En clair

Un tour guidé pointe des boutons et des panneaux de l'app avec des bulles pas-à-pas. Le piège :
si on cible les éléments par leur **position** ou une **classe CSS**, le tour **casse au moindre
changement d'UI** — et personne ne le voit avant qu'un utilisateur le signale. La recette tient en
une idée : cibler par **`data-testid` stables**, tenir un **registre unique** de ces sélecteurs, et
poser un **test qui échoue** si un `data-testid` ciblé disparaît du DOM. On ne peut alors plus casser
le tour sans casser le rouge.

## 1. Le principe

```
Tour = liste d'étapes ──> chaque étape cible un [data-testid=…] ──> Driver.js surligne + bulle

Registre des testids ciblés ──(test)──> tous présents dans le DOM rendu   (sinon: ROUGE)
Parcours complet            ──(E2E) ──> chaque étape trouve sa cible, avance, se termine
```

Deux filets, pas un : un test **unitaire/rendu** garantit que les cibles **existent** ; un test
**E2E** garantit que le tour **se déroule** de bout en bout. Le premier casse tôt (au refactor), le
second attrape les régressions de flux.

## 2. La lib — Driver.js

- **Pourquoi** : léger, sans dépendance lourde, spotlight + popover intégrés, API simple.
- **Forme d'une étape** : `{ element: '[data-testid="calibrate-btn"]', popover: { title, description } }`.
- Le tour = un tableau ordonné d'étapes + `driver().setSteps(steps).drive()`.
- Reste **agnostique du framework** (Vue, React, vanilla) : il ne connaît que des sélecteurs CSS.

## 3. Le contrat de sélecteurs (le cœur de la résilience)

C'est ce qui rend le tour **résilient au refactoring** :

1. **Un registre unique** des `data-testid` ciblés par le tour (une seule liste, source de vérité) —
   ex. `TOUR_TARGETS = ['tracking-toggle', 'calibrate-btn', 'connect-panel', …]`.
2. Les étapes du tour **dérivent de ce registre** (pas de sélecteur en dur éparpillé).
3. **Un test qui échoue** si un `data-testid` du registre est **absent du DOM rendu** de l'app. On
   monte l'app (ou les écrans clés) et on asserte la présence de chaque cible.

Effet : quelqu'un renomme/supprime un `data-testid` en refactorant → le test passe au rouge **avant**
le merge. Impossible de casser le tour en silence.

> ⚠️ Pré-requis : **instrumenter** les zones ciblées avec des `data-testid` **stables** (pas des ids
> générés, pas des classes de style). Le `data-testid` devient un **contrat** — on ne le change pas à
> la légère.

## 4. L'E2E du parcours

- Lancer l'app, déclencher le tour, **le dérouler entièrement** : chaque étape trouve sa cible visible,
  on avance, le tour se termine proprement.
- Rejouer après **redimensionnement** / changement de plateforme (responsive, device) → le tour tient
  parce qu'il cible des `data-testid`, pas des pixels.
- Outils : Playwright (ou l'E2E maison du projet).

## 5. Rejouabilité (déclencheurs)

- **1er lancement** : auto-afficher le tour une fois, mémorisé par un flag (`localStorage`, ex.
  `app.tour.seen`).
- **À la demande** : un bouton d'aide (« ? ») rouvre le tour n'importe quand.
- Séparer les **déclencheurs** (bouton + flag) du **contenu** (les étapes) : on peut remplacer une
  modale d'aide statique intérimaire par le vrai tour **sans toucher aux déclencheurs**.

## 6. Réutilisable sur d'autres projets web

Le pattern ne dépend pas de l'app : registre de `data-testid` + Driver.js + test de présence + E2E.
Pour l'appliquer ailleurs : instrumenter les zones clés, écrire le registre, brancher les 2 filets de
test, câbler les déclencheurs.

## 7. Implémentation de référence (muti)

- **Fiche** : `0030` (onboarding guidé in-app) — porte l'exigence « testé & résilient au refactoring ».
- **Point d'entrée intérimaire livré** : `HelpModal.vue` (PR #133) — modale d'aide statique, rouverte
  par le bouton « ? », auto-affichée au 1er lancement (flag `localStorage muti.help.seen`). Le tour
  0030 **remplacera son contenu** en **réutilisant ses déclencheurs**.
- **Dépendance produit** : le tour doit enseigner le **flux déjà simplifié** (dans muti : calibrage à
  bouton unique, fiche `20260817130317085`) — construire le tour **après** la simplification, jamais
  l'inverse.

## 8. Options à trancher (au grooming)

- Où vit le **registre** des `data-testid` (un module partagé app+tests).
- Granularité des étapes (un tour long vs plusieurs mini-tours par thème).
- Le test de présence : monter **toute** l'app, ou seulement les écrans portant des cibles.
- Internationalisation du contenu des bulles.
- _(à compléter au fil de l'eau)_

## 9. Journal

- **2026-08-28** — création. Germe : fiche muti `0030` (retour PO : « testé et résilient au
  refactoring, au maximum »). Implémentation de référence à venir dans muti.

## Fichiers de référence (entonnoir — pointer, jamais copier)

Racine : **`~/git/bacasable/muti`**

- `HelpModal.vue` (PR #133) — point d'entrée intérimaire (déclencheurs `?` + flag
  `localStorage muti.help.seen`) que le vrai tour réutilisera
- Fiche `0030` — exigence « testé & résilient au refactoring »

## Statut de cette recette

Normalisée le 2026-08-30 (front-matter ajouté, étape 5 de la fiche
[`20260824185422122`](../features/20260824185422122_recette-artefact-premier-rang-et-gardien.md)).
**`status: draft`** : le **pattern** (registre `data-testid` + Driver.js + double filet de
test) est décrit, mais l'implémentation de référence n'est **pas encore livrée** dans muti —
seul un point d'entrée intérimaire (`HelpModal.vue`) existe. `source:` laissé vide plutôt que
pointer une implémentation qui n'existe pas. À repasser `ready` quand le tour 0030 est livré.

---
id: "20260825213807501"
title: Vue « Plan / prochain sprint » — rendre PLAN.md dans le board (suite scopée de 20260823124042842, sans objet sprint)
type: feature
priority: P2
product: mega-city
version:
epic:
status: todo
ready:
pr:
created: 2026-08-25
---

# 20260825213807501 — Vue « Plan / prochain sprint » dans le board

**En clair.** Aujourd'hui on voit le *stock* de features (le board d'avancement : toutes
les fiches triées par priorité, servi par `ezk:map`). On ne voit **nulle part** la
*séquence décidée* — l'ordre NOW / NEXT / LATER de `features/PLAN.md` — ni « quelle fiche
le prochain sprint va tirer ». Cette fiche ajoute un **onglet « Plan »** à la page
d'avancement : les mêmes cartes, mais rangées dans l'ordre du plan, plus un **petit
encart** qui explique en clair backlog / plan / sprint et pointe la prochaine fiche
tirable. On **compile depuis `PLAN.md`** (un fichier déjà curé) et depuis le front-matter
des fiches — on n'invente **aucun** objet « sprint », on ne dessine rien à la main.

**Si tu arrives frais.** *Board d'avancement* = la page `diagrams/avancement/board.html`,
servie par la commande `pnpm ezk:map avancement` ; elle liste les fiches du backlog en
cartes. *PLAN.md* = le fichier où l'ordre de travail est décidé à la main (NOW / NEXT /
LATER), distinct du backlog (le stock trié par priorité). *ready* = une fiche a passé le
gate « Definition of Ready » ; le prochain sprint tire la première fiche `todo` **et**
`ready` de l'ordre du plan.

## Contexte / Problème

La **carte du domaine** (PR #162) montre la *structure* de la méthode. Le **board
d'avancement** (fiche `20260823124042842`, lot 0, livré `main@7f0f12d`) montre le *stock* :
les fiches actives × priorité × statut, filtrables, cliquables vers leur source. Ce qui
manque, c'est le **flux décidé** : l'ordre NOW / NEXT / LATER que le PO curate dans
`features/PLAN.md`, et le lien vers le sprint (« la prochaine fiche tirable, c'est celle-là »).

Pour connaître cet ordre aujourd'hui, il faut **ouvrir `PLAN.md` à la main** et le
recouper de tête avec l'état `ready` de chaque fiche. Le PO l'a demandé le 2026-08-25 :
voir le plan / le prochain sprint directement dans la page, avec un encart qui rappelle la
différence entre backlog, plan et sprint.

**Garde-fou hérité (verdict panel adverse du 2026-08-23).** Le lot 1 de
`20260823124042842` — la **frise temporelle des sprints** et le **diagramme du process
scrum avec les fiches posées dessus** — a été **gelé** pour éviter d'inventer un « 4ᵉ
système de sprint » (objet *sprint-as-data*, risque ADR-0013). Cette fiche est le **dégel
scopé** que le panel attendait : elle rend **le `PLAN.md` qui existe déjà**, elle
n'introduit **pas** d'objet sprint et ne réintroduit **pas** la frise ni le diagramme du
process. Même principe que le board et que la carte : *compiler depuis les fichiers, ne
rien dessiner à la main.*

## Proposition

POC d'abord (visualiser), polish ensuite.

1. **Un onglet « Plan » sur le board** (`diagrams/avancement/board.html`) — un bascule
   « Board » (tri priorité, l'existant) ↔ « Plan » (ordre de `PLAN.md`). Mêmes cartes,
   mêmes tokens/CSS que le board : le design est **repris**, pas refait (exigence PO
   « même system design »).
2. **Les fiches rangées par horizon** : les cartes du plan groupées en couloirs
   **NOW / NEXT / LATER** (les sections de `PLAN.md`), dans l'ordre du document. Une carte
   du plan porte id + titre + statut + priorité + un repère `ready` / `todo` non-ready, et
   reste cliquable vers sa fiche source (comme le board).
3. **Un petit encart pédagogique** en tête de l'onglet : en clair, *backlog = tout le
   stock (priorité)*, *plan = l'ordre décidé (NOW/NEXT/LATER)*, *le prochain sprint tire la
   tête `ready` du plan*. L'encart affiche la **prochaine fiche tirable** (première `todo` +
   `ready` de l'ordre) et les **têtes bloquées** (les `todo` sans `ready:` qui la précèdent,
   à groomer) — exactement le signal que rend déjà `plan:head` en CLI.
4. **Compilé, jamais saisi.** Un cœur pur `plan-view-data.ts` (même patron que
   `avancement-data.ts`) : il étend la lecture de `PLAN.md` pour **garder les couloirs**
   (NOW/NEXT/LATER), joint chaque id à sa fiche (`loadFiches`), et calcule la tête tirable
   (`crossBacklogHead` existe déjà). Un bord I/O `regen-plan-view` injecte le bloc de
   données entre deux marqueurs gérés du board (même mécanique que `regen-avancement`). Un
   **test d'invariant** rougit si `PLAN.md` ou le backlog changent sans régénérer.

**Fondations déjà en place** (rien à réinventer) : `parsePlanOrder(planMd)` lit l'ordre
des ids ; `crossBacklogHead(ids, index)` calcule la tête tirable + les têtes bloquées +
les ids introuvables ; `loadFiches(root)` charge tout le front-matter ;
`buildAvancementData` + le patron de marqueurs gérés (`upsert…Block`) montrent le chemin
exact à suivre. Le seul vrai ajout de logique : **garder les sections** de `PLAN.md`
(NOW/NEXT/LATER) au lieu de les aplatir — une extension du parseur, testée en TDD.

## Critères d'acceptation (MVP — visualiser)

- [ ] `pnpm ezk:map avancement` : un onglet/bascule **« Plan »** apparaît sur le board et
      montre les fiches **dans l'ordre de `PLAN.md`**, groupées **NOW / NEXT / LATER**.
- [ ] Un **encart** explique en clair backlog / plan / sprint, affiche la **prochaine fiche
      tirable** (première `todo` + `ready` de l'ordre) et les **têtes bloquées** (`todo`
      sans `ready:` qui la précèdent).
- [ ] Chaque carte du plan cite **id + titre + statut + priorité** et **cliquer ouvre la
      fiche source** (lien servi par `ezk-map`, comme le board).
- [ ] Les données sont **compilées** depuis `PLAN.md` + les fiches ; un **test d'invariant**
      (« disque ≡ régénéré ») rougit si `PLAN.md` ou le backlog changent sans regen.
- [ ] **Zéro objet « sprint » nouveau, zéro donnée écrite à la main** dans la vue — respect
      du verdict panel 2026-08-23 (pas de frise temporelle, pas de diagramme de process).
- [ ] Le design **reprend celui du board** (mêmes variables CSS / composants) — cohérence
      visuelle vérifiable à l'œil et via le design-system existant.
- [ ] Les **ids du plan introuvables** dans `features/` sont **signalés** dans la vue (pas
      avalés en silence) — miroir du comportement de `plan:head`.

## Hors périmètre (lots suivants — notés, pas faits ici)

- **Bonus PO — éditer depuis la page** : sélectionner des fiches pour les passer `ready`
  et **réordonner le plan** depuis le navigateur. C'est un **write-back** vers les fiches /
  `PLAN.md` ; or le serveur `ezk:map` est aujourd'hui **GET-only, zéro dépendance**. Ça
  demande une décision d'archi séparée (endpoint d'écriture ? génération d'un patch à
  appliquer à la main ?) et un gate DoR propre → **fiche/lot dédié**, après le MVP visuel.
- **Toujours gelé** (verdict panel) : la frise temporelle des **sprints réels** et le
  **diagramme du process scrum** avec les fiches posées sur les étapes. Cette fiche ne les
  rouvre pas.

## Comment vérifier

```bash
# 1) noyau pur + invariant (le test rougit si PLAN.md/backlog changent sans regen)
pnpm --dir products/mega-city test

# 2) régénérer le bloc de données du board depuis le backlog réel
pnpm --dir products/mega-city avancement:regen   # (+ le nouveau regen de la vue plan)

# 3) ouvrir la page et basculer sur l'onglet « Plan »
pnpm ezk:map avancement
```

Preuve agent attendue au sprint : capture d'écran de l'onglet « Plan » (couloirs
NOW/NEXT/LATER + encart avec la prochaine fiche tirable), et le test d'invariant vert.

## Glossaire

- `board d'avancement` — la vue `diagrams/avancement/board.html` (fiches en cartes, triées
  priorité × statut), servie par `ezk:map`.
- `PLAN.md` — le fichier `features/PLAN.md` : la **séquence décidée** à la main (NOW / NEXT
  / LATER), distincte du backlog (stock trié par priorité).
- `tête tirable` — la première fiche `todo` **et** `ready` dans l'ordre du plan : ce que le
  prochain sprint pioche.
- `sprint-as-data` — un hypothétique **objet** « sprint » stocké en données ; délibérément
  **non** créé ici (verdict panel adverse 2026-08-23).

## Notes / décisions

- **Origine** : demande PO du 2026-08-25 (« voir le sprint futur ou le plan dans un onglet
  d'`ezk:map`, avec un encart backlog/plan/sprint »). Suite directe de la fiche livrée
  `20260823124042842` (board lot 0), dont le lot 1 (frise/process) reste gelé — ici on
  n'ouvre que le rendu de `PLAN.md`.
- **Décision de placement (à confirmer au grooming archi)** : onglet **sur** le board
  plutôt qu'une page `diagrams/plan/` séparée → réutilise le design et l'encart tient « sur
  la page », comme demandé. Alternative (page séparée) à trancher par l'agent archi.
- **Le bonus édition est volontairement différé** (write-back = décision archi + gate DoR
  séparés). Le PO a cadré : « on commence par visualiser ».
- Liens : `20260823124042842` (parent), `src/core/avancement-data.ts` (patron),
  `src/backlog/plan-order.ts` + `plan-head.ts` (fondations), verdict panel
  `docs/captures/2026-08-23-panel-adverse-refonte-taxonomie.md`.

---
id: "20261110185357446"
title: "Schéma Process zoomable — un seul plan qu'on approche (semantic zoom, React Flow)"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: idea
pr:
evidence: before-after
created: 2026-11-10
---

# 20261110185357446 — Schéma Process zoomable (semantic zoom, React Flow)

**En clair.** Aujourd'hui la vue Process montre un schéma figé, et la maquette propose
trois boutons Zoom (vue d'ensemble · étapes de chaque skill · une étape) pour changer de
niveau. On remplace ces boutons par **une seule surface qu'on approche à la molette** :
de loin on voit les 4 boîtes et la boucle rétro → backlog, on se rapproche et les étapes
de chaque skill apparaissent, encore plus près le détail d'une étape. Le niveau de détail
suit le zoom tout seul, comme dans un éditeur de nœuds (TouchDesigner).

**Si tu arrives frais.** *cop1* = le produit web de pilotage (mission control), dans
`packages/web` du monorepo. *Semantic zoom* = le niveau de détail affiché est **dérivé du
zoom** : on ne clique pas un bouton « niveau 2 », on s'approche et le niveau 2 arrive.
*React Flow* (`@xyflow/react`) = la lib de rendu de graphes/nœuds qui porte la molette, le
pinch et la mini-carte.

## Contexte / Problème

La vue Process actuelle est **statique** : un schéma rendu une fois, plus trois boutons
Zoom dans la maquette pour sauter d'un niveau à l'autre. Un saut de bouton casse le fil —
on perd où on était, et on ne sent pas que les trois niveaux sont **le même plan vu de
plus ou moins loin**.

Ce qu'on veut : une surface **continue**. Molette, pinch, boutons +/− ; le niveau de
détail se déduit du zoom. De loin, les 4 grandes boîtes du workflow et la boucle
rétro → backlog. En s'approchant, les étapes de chaque skill. Plus près encore, le détail
d'une étape.

## Proposition

React Flow (`@xyflow/react` v12) dans `@cop1/web`, avec une **séparation stricte en trois
couches** pour que le domaine soit testable sans React :

1. **Données** — une **commande neuve** `ezk process show --json` (contrat
   `contracts/process-show/v1/`), servie par le daemon de cop1 sur `GET /api/process/<projet>`.
   Sa sortie couvre les **trois niveaux** : les skills et leurs liens, les étapes de chaque
   skill, le détail d'une étape avec son réglage. C'est la fiche « étapes fines »
   (`20261110191135802`, livrée sur `main`) qui la fournit. Entrée brute — l'écran n'a aucune
   autre source à lire, et surtout pas la constante `SPRINT_STEPS` en dur dans
   `ProcessView.tsx`, qui disparaît.
2. **Projection pure par niveau** — une fonction du domaine, **sans React**, du genre
   `projectProcessToFlow(contract, niveau) → {nodes, edges}`. Testée en Vitest **sur un
   contrat réel**.
3. **Rendu** — React Flow à la frontière seulement : nœuds custom par `kind`, `MiniMap`,
   `Controls`. Le hook zoom→niveau **passe** le niveau à la projection ; la projection
   reste pure.

Détails d'UX :

- **Niveau dérivé du zoom, avec hystérésis ~10 %** : un hook calcule le niveau depuis le
  facteur de zoom, mais ne rebascule pas au moindre cran — sinon ça clignote à la
  frontière entre deux niveaux.
- **Changement de niveau sans déplacer la caméra** (règle `ux/no-layout-shift`) : on
  approche, le détail change, mais ce qu'on regardait reste sous le curseur.
- **Double-clic sur une boîte** = `fitView` animé qui cadre dessus.
- **La `carte-interactive.html` existante n'est pas touchée** — c'est une surface neuve,
  pas une refonte de l'ancienne.

POC d'abord : les trois niveaux marchent au zoom sur les vraies données. Polish (animations
fines, styles des nœuds) ensuite.

## Critères d'acceptation

- [ ] La vue Process est **une surface zoomable continue** (molette, pinch, boutons), plus
      une série de boutons de niveau.
- [ ] À faible zoom, on voit **les 4 boîtes du workflow et la boucle rétro → backlog**.
- [ ] En s'approchant, on voit **les étapes de chaque skill** ; plus près, **le détail
      d'une étape**.
- [ ] Le niveau affiché est **dérivé du zoom** (pas d'un bouton de niveau), avec une
      **hystérésis** qui empêche le clignotement à la frontière.
- [ ] Changer de niveau **ne déplace pas la caméra** (`ux/no-layout-shift`).
- [ ] **Double-clic** sur une boîte la cadre par un `fitView` animé.
- [ ] La **projection par niveau** est une fonction pure, testée en **Vitest sur un
      contrat réel** (`ezk process show --json`, contrat `process-show/v1`).
- [ ] Aucune étape du workflow n'est **codée en dur** dans le web : toutes viennent du
      contrat (plus de constante `SPRINT_STEPS`).
- [ ] La `carte-interactive.html` existante est **inchangée**.

## Comment vérifier

```bash
# Tests de la projection pure (domaine, sans React) sur les vraies données
pnpm --dir packages/web test -- process-projection

# Lancer cop1 et sonder la vue Process à la main / au navigateur
pnpm --dir packages/web dev
```

Preuve en PR (règle `development/pr-before-after-media`) : **captures avant / après aux
trois niveaux** — vue d'ensemble, étapes de skill, détail d'une étape —, l'« avant » étant
le schéma statique, l'« après » la surface zoomée au même niveau.

## Glossaire

- `semantic zoom` — le niveau de détail affiché est dérivé du facteur de zoom, pas d'un
  contrôle de niveau séparé.
- `hystérésis` — marge (~10 %) autour du seuil de bascule : on ne rebascule de niveau
  qu'une fois nettement passé le seuil, pour éviter l'aller-retour qui clignote.
- `fitView` — commande React Flow qui recadre la caméra pour faire tenir un ensemble de
  nœuds dans la vue.

## Notes / décisions

**Dépendances.**

- **La vue Process statique** qu'elle remplace :
  [La vue Process montre le workflow en schéma](done/20261104090517801_process-montre-le-workflow-en-schema.md)
  — **shippée** (cop1, milestone `board`). C'est l'« avant » des captures.
- **« La méthode émet ses étapes fines »** — la couche de données des **trois** niveaux. La
  méthode ne publiait pas les étapes des skills ; elles étaient **en dur dans le web**
  (`SPRINT_STEPS` dans `ProcessView.tsx`).
  **Cette fiche est désormais livrée sur `main`** :
  [La méthode émet ses étapes fines](done/20261110191135802_methode-emet-ses-etapes-fines.md)
  (`20261110191135802`, **livrée** le 15 nov. : `510276c0`). La dépendance est **levée**. Elle
  livre la commande `ezk process show --json` (contrat `contracts/process-show/v1/`), servie par
  le daemon sur `GET /api/process/<projet>`, et sa sortie couvre les trois niveaux. Le lien
  retour, depuis la fiche « étapes fines » vers celle-ci, n'est pas encore posé.

- **Forme d'entrée du niveau 3** — **contrat réel livré le 15 nov.** (`process-show/v1`, commit
  `510276c0`). La projection pure prend **cette** forme en entrée :
  `{ schema_version, skills[] { id, nom, enClair, etapes[] { id, num, titre, enClair, joueePar[],
  agents[], commandes[], regles[], reglages[] { cle, valeur } } }, liens[] { de, vers, libelle } }`.
  Quatre compétences publiées : `ezk-backlog` (4 étapes), `ezk-sprint` (8), `ezk-retro` (4),
  `ezk-archive` (2).

  **Écart avec la forme prévue le 11 nov.**, à prendre en compte au build :
  1. `joueePar` est une **liste** de références (`humain`, `agent:<x>`, `<skill>[:<sous-commande>]`),
     pas une chaîne. L'écran affiche donc un ou plusieurs acteurs par étape.
  2. **Ajouts** : un `id` stable par étape (clé des nœuds), des `reglages[]` par étape (la config
     qui la pilote), et des `liens[]` au niveau racine. Le niveau 1 lit ses arêtes là, au lieu de
     les déduire.
  3. `regles[]` est publié **vide** (défaut de la fiche « étapes fines ») : le niveau 3 affiche
     « aucune règle publiée », pas une liste inventée.
  4. **Absent du v1** : le niveau de modèle des agents, et les champs `momentEmis`, `gateId` et
     `effetStatutFiche` (prévus pour un v2). Le niveau 3 ne les montre pas tant que le contrat ne
     les publie pas.

## Avis architecte (2026-11-11)

Lecture du code réel : `products/cop1/packages/web/src/board/ProcessView.tsx` et le contrat
`products/mega-city/src/core/process-contract.ts`.

**Constat (corrigé le 2026-11-14 contre la fiche « étapes fines » livrée sur `main`).** Les
données des **trois** niveaux viennent d'une **commande neuve**, `ezk process show --json`
(contrat `contracts/process-show/v1/`), servie par le daemon sur `GET /api/process/<projet>`.
Ce n'est **pas** une extension de `ezk board process --json`, et ce n'est **pas**
`graph.compiled.json` (un artefact de build non versionné, qu'aucun contrat ne sert à l'écran).
Jusqu'ici les étapes fines étaient **en dur dans le web** (`SPRINT_STEPS`) ; cette source
disparaît.

**Décision — trois couches, le squelette vient de la commande.**

1. **Données (`products/mega-city`)** — la commande `ezk process show --json` et son contrat
   `contracts/process-show/v1/`, servis par le daemon sur `GET /api/process/<projet>`. C'est
   la fiche « étapes fines », **déjà livrée sur `main`**.
2. **Projection pure (`products/cop1/packages/web`, sans React)** —
   `projectProcessToFlow(contract, niveau) → {nodes, edges}`, testée Vitest sur un contrat
   réel.
3. **Rendu (même paquet, frontière React Flow)** — nœuds custom, MiniMap, Controls, hook
   zoom→niveau avec hystérésis. Le hook passe le niveau ; la projection reste pure.

**Règle qui en découle.** Le squelette du workflow (skills, étapes, sous-étapes) vient de
`ezk process show --json`, jamais d'une constante web. Retirer `SPRINT_STEPS` en dur est un
critère d'acceptation de cette fiche (couplé à la fiche « étapes fines »).

**Découpe — tranchée le 2026-11-14 : fiche entière.** L'argument de découpe reposait sur une
dépendance : seul le niveau 3 attendait les étapes fines. Cette dépendance est **levée** (la
fiche « étapes fines » est sur `main`), et sa commande `ezk process show --json` sert **un seul
canal pour les trois niveaux**. Il n'y a donc plus de couture de données où scinder : la fiche
reste **entière**. Le PO veut cette visualisation **très vite** pour voir et valider l'état du
process ; un canal unique déjà disponible va dans ce sens.

**Hors périmètre.** Le « dernier passage observé » par étape (ADR-084 point G4) demande des
moments par étape dans le journal — **décision PO, à ne pas embarquer ici** ; la maquette
l'affiche « non tracé ».

**Vocabulaire & version.** À l'écran, une milestone s'appelle désormais « objectif » ; le
champ reste `milestone:`. Pas de `version:` posé sur la fiche : un dossier en relecture chez
le PO propose que le numéro se pose **à l'étiquetage, après test**.

**Périmètre.** Surface neuve ; ne touche pas `carte-interactive.html`.

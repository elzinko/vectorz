---
id: "20260904091853974"
title: "Tenir un journal des galères résolues, pendant le dev"
type: feature
priority: P3
product: mega-city
version: V0.3
epic:
labels: [recettes]
status: idea
pr:
created: 2026-09-04
---

# Journal des difficultés — artefact indépendant

## En clair

Quand une galère est résolue en session (un réglage d'interface, un câblage oublié…), on veut
la **journaliser** : ce qui a coincé, comment on l'a réglé, pourquoi. Aujourd'hui c'est **mêlé
au « labo de cuisine »** (livré, #195) et écrit **dans `SPRINT.md`**, un scratch **partagé**
snapshoté seulement à la clôture. On veut en faire un **artefact indépendant**, écrit
**pendant** le dev, **directement** dans un fichier durable, **taggé par feature** — ce qui
débloque le travail en parallèle et sépare la **capture** (le journal) de sa **consommation**
(le labo / ezk-chef).

## Contexte / Problème

Le modèle propre, en 4 briques à ne pas confondre :

1. **Journal des difficultés** — la **capture** brute, indépendante, écrite pendant le dev.
2. **Récit de session** — la narration d'une tranche de travail, taggée par feature.
3. **Labo / ezk-chef** — un **consommateur à la demande** qui lit le journal pour générer des
   recettes (déjà livré, #195, via `ezk-chef-extract.sh`).
4. **ezk-archive** — la clôture (portier + handoff). Une **capacité** (cf. fiche sœur
   [20260904091853948](20260904091853948_ezk-archive-capacite-allegement.md)).

Trois défauts constatés (2026-09-04, avec le PO) :

- **Journal et labo fusionnés.** La fiche livrée
  [20260829123707100](done/20260829123707100_labo-de-cuisine-journal-difficultes.md) (labo,
  #195) décrit à la fois la **capture** et la **génération de recettes**. Or ce sont deux
  choses : la capture est **primaire et indépendante**, le labo **s'appuie dessus**.
- **Écrit dans `SPRINT.md`.** Ce scratch est **partagé** et transitoire ; il n'est archivé
  qu'à la clôture, par ezk-archive. Y loger le journal **couple** la capture au rituel de
  clôture et **bloque le parallélisme** (un seul `SPRINT.md`).
- **Axe de lecture flou.** « Par session » ou « par feature » ? Faux dilemme (voir
  proposition, point 3).

## Proposition

1. **Séparer capture et consommation.** Le **journal** devient un artefact **indépendant** ;
   le **labo / ezk-chef** reste un **outil à la demande** qui le **lit** (déjà le cas — on
   re-pointe simplement la source).
2. **Écrire pendant le dev, hors `SPRINT.md`.** Chaque entrée de galère va **directement**
   dans un fichier durable (p. ex. `docs/sessions/<date>-<slug>.md`, ou un `docs/journal/`
   dédié — à trancher au grooming), **sans** passer par le scratch partagé. Effet : plusieurs
   sprints peuvent tourner **en parallèle** (chacun son fichier), et ezk-archive n'a plus à
   **posséder** le snapshot des galères (il s'allège d'autant — cf. fiche sœur A).
3. **Tagger par feature.** Chaque entrée porte l'**id de fiche**. La lecture « par feature »
   devient un simple `grep <id>` ; la lecture « par session » reste le fichier lui-même. **Une
   capture, deux lectures** — pas de second magasin.
4. **Décision « session » (tranchée avec le PO).** « Session » est un concept du **LLM**
   (l'agent perd sa mémoire), **pas** de la méthode. On le **garde** comme **unité de capture**
   (le moment naturel où on journalise la friction), mais on ne l'introduit **pas** dans le
   vocabulaire méthode : les objets restent **feature / sprint / retro**. Les rétros lisent les
   frictions **par feature ou par thème**, jamais « par session ».
5. **Absorber le compte-rendu structuré.** Cette fiche **absorbe**
   [20260826121429274](done/20260826121429274_ezk-archive-compte-rendu-structure.md) (« ezk-archive
   émet un compte-rendu de session structuré ») : même sujet — le **format** du récit et ce
   qu'il rend **extractible** (galères, PR, fiches, actions), prérequis des vues.

## Décisions de grooming (2026-10-01)

- **Où écrire.** Dans `docs/journal/<date>-<slug>.md`, un dossier **à part** de `docs/sessions/`.
  La capture (brique 1) ne se mélange pas au récit (brique 2).
- **Un fichier par session.** Le `<slug>` est le nom de la branche git. Deux worktrees écrivent
  donc deux fichiers différents, et ne peuvent pas se marcher dessus.
- **Forme d'une entrée.** Un titre `## [<id-fiche>] <titre court>`, puis trois puces : ce qui a
  coincé, comment c'est réglé, pourquoi (facultatif).
- **Qui écrit.** Un petit script, `journal-add.sh`, pour qu'une entrée tienne en une commande.
- **Qui lit.** `ezk-chef extract` lit le journal à la demande : on re-pointe sa source. Le reste se
  lit avec `grep`.
- **Le mot « session ».** Il reste une unité de **capture**. Il n'entre pas dans le vocabulaire
  de la méthode, qui garde feature, sprint et rétro. Cette décision est écrite dans
  `docs/journal/README.md`.

## Périmètre de cette PR (POC)

1. `docs/journal/README.md` : format, tag par fiche, règle « un fichier par session », décision
   sur le mot « session ».
2. `products/mega-city/bin/journal-add.sh`, son test `test-journal-add.sh`, inscrit dans
   `test-scripts.sh`.
3. `ezk-chef-extract.sh` lit aussi `docs/journal/`, avec un cas de test.
4. `ezk-sprint/SKILL.md` demande d'écrire dans le journal. La section « Galères & gestes (labo) »
   de `SPRINT.md` reste lue (rétro-compatibilité), ses tests restent verts.

## Critères d'acceptation

- [x] `docs/journal/README.md` fixe le format, le tag par fiche, « un fichier par session » et la décision sur le mot « session »
- [x] `journal-add.sh` écrit une entrée **pendant** le dev, **hors** `SPRINT.md`, dans `docs/journal/<date>-<slug>.md`, et fonctionne sans recette ni labo (`test-journal-add.sh`, cas A)
- [x] deux sessions (deux slugs) donnent deux fichiers distincts : aucun conflit possible (cas C)
- [x] chaque entrée est **taggée par fiche** : `grep -rl <id> docs/journal/` rend les fichiers, `grep -rh -A4 "^## \[<id>\]" docs/journal/` rend les galères d'une feature (cas D)
- [x] `ezk-chef extract <id>` verse les entrées du journal dans les Préliminaires, avec un pointeur vers le fichier (`test-ezk-chef-extract.sh`, cas K et L)
- [x] `ezk-sprint` dit d'écrire dans le journal ; la section de `SPRINT.md` reste lue et `test-labo-cuisine.sh` reste vert
- [x] gate verte : test du script, test de l'extraction, `pnpm test:scripts`

**Preuves (2026-10-01).** Les deux tests rougissent bien quand on sabote le code :
`journal-add.sh` qui écrase au lieu d'ajouter (5 échecs), sans validation d'id (2 échecs), sans
assainissement du slug (arrêt franc). `ezk-chef-extract.sh` sans la borne d'identifiant laisse
passer une entrée d'une « superchaîne » d'id, et le cas K le détecte.

**Retour Codex (PR #290).** Deux noms de branche qui s'assainissent pareil (`feat/x` et `feat-x`)
donneraient le même fichier daté, donc un conflit add/add entre deux worktrees du même jour. Quand
l'assainissement change le nom, `journal-add.sh` ajoute un court condensat du nom d'origine. Le cas I
le prouve, et rougit si on retire le condensat.

## Comment vérifier

- **Indépendance** : `test-journal-add.sh` écrit dans un dépôt de test **sans** `recipes/` ni labo.
  Le journal existe et se remplit sans qu'aucune recette soit générée.
- **Parallélisme** : le même test journalise avec deux slugs. Il obtient deux fichiers, et aucun
  `SPRINT.md` n'est touché.
- **Par feature** : le test rejoue le `grep -rl <id> docs/journal/` ci-dessus.
- **Lecture par le labo** : `test-ezk-chef-extract.sh` ajoute un dépôt avec un journal. Les
  Préliminaires du brouillon citent l'entrée et le fichier source.
- **Commande** : `pnpm --dir products/mega-city test:scripts`.

## Suite (hors POC)

- Alléger `ezk-archive` : il ne possède plus le snapshot des galères (fiche sœur
  [20260904091853948](20260904091853948_ezk-archive-capacite-allegement.md)).
- `ezk-chef suggest` et `ezk-retro` lisent aussi le journal, par feature ou par thème.
- En-tête structuré des récits de session (PR, fiches, actions), repris de la fiche absorbée
  20260826121429274. C'est une facette du récit (brique 2), pas de la capture.
- Commande `ezk journal` dans le manifeste du CLI `ezk`.

## Notes / décisions

- **Statut idea** : direction validée par le PO (2026-09-04). Groomée le 2026-10-01 sur un POC
  borné (voir « Décisions de grooming »).
- **Provenance** : absorbe
  [20260826121429274](done/20260826121429274_ezk-archive-compte-rendu-structure.md) (compte-rendu
  structuré) — la fiche source est tombstonée (redirection) en attendant son retrait au
  grooming.
- **En aval** : nourrit le cluster recette / ezk-chef (labo #195 livré,
  [20260831075615809](done/20260831075615809_ezk-chef-suggest-recettes-du-sprint.md)), et les vues
  ([20260826072532452](done/20260826072532452_vue-sprints-realises-ezk-map.md) sprints,
  [20260826072532537](20260826072532537_vue-retros-actions-ezk-map.md) rétros).

---
id: "20260904091853974"
title: Journal des difficultés — artefact indépendant (hors SPRINT.md, écrit pendant le dev, taggé par feature) ; absorbe le compte-rendu structuré
type: feature
priority: P2
product: mega-city
version:
epic:
labels: [journal, ezk-chef, retro, methode]
status: idea
ready:
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
   [20260826121429274](20260826121429274_ezk-archive-compte-rendu-structure.md) (« ezk-archive
   émet un compte-rendu de session structuré ») : même sujet — le **format** du récit et ce
   qu'il rend **extractible** (galères, PR, fiches, actions), prérequis des vues.

## Critères d'acceptation (brouillon — DoR au grooming)

- [ ] Le journal est un artefact **indépendant** du labo (capture ≠ consommation).
- [ ] Les entrées s'écrivent **pendant** le dev, **hors** `SPRINT.md`, dans un fichier durable.
- [ ] Deux sprints en parallèle **n'entrent pas en conflit** sur le journal.
- [ ] Chaque entrée est **taggée par feature** ; `grep <id>` sort l'historique d'une feature.
- [ ] Le labo / ezk-chef lit ce journal **à la demande** (recettes toujours générables).
- [ ] La décision « session = capture, pas concept méthode » est écrite (ici ou en règle).

## Comment vérifier

- **Indépendance** : renommer/retirer le labo ne casse pas le journal ; le journal existe et
  se remplit sans qu'aucune recette soit générée.
- **Parallélisme** : deux worktrees qui journalisent en même temps produisent **deux**
  fichiers durables, aucun conflit sur un `SPRINT.md`.
- **Par-feature** : `grep -rl <id-fiche> docs/sessions/` (ou `docs/journal/`) rend toutes les
  galères de cette feature.

## Notes / décisions

- **Statut idea** : direction validée par le PO (2026-09-04), non groomée.
- **Provenance** : absorbe
  [20260826121429274](20260826121429274_ezk-archive-compte-rendu-structure.md) (compte-rendu
  structuré) — la fiche source est tombstonée (redirection) en attendant son retrait au
  grooming.
- **En aval** : nourrit le cluster recette / ezk-chef (labo #195 livré,
  [20260831075615809](done/20260831075615809_ezk-chef-suggest-recettes-du-sprint.md)), et les vues
  ([20260826072532452](20260826072532452_vue-sprints-realises-ezk-map.md) sprints,
  [20260826072532537](20260826072532537_vue-retros-actions-ezk-map.md) rétros).

---
id: 0095
title: ezk-product-builder n'émet aucun événement — ses checkpoints inter-sprints sont invisibles au Moniteur
type: bug
priority: P1
epic:
status: in-progress
ready: 2026-07-26
pr: '#55'
created: 2026-07-25
---

## Contexte / Problème

**Reproduction (2026-07-25).** `grep -rl "run_start\|gate_reached" products/mega-city/skills/`
renvoie **trois** skills : `ezk-sprint`, `vz-product-builder`, `supervision-demo`.
`skills/ezk-product-builder/SKILL.md` **ne contient aucune** consigne d'émission.

Or c'est `ezk-product-builder` que le PO lance pour construire (« je lancerai un
`ezk-product-builder build` »). Il **compose** `ezk-sprint`, qui lui émet — donc, une fois
les outils MCP branchés (fiche **0094**), on verra les gates `sprint-<slug>-checkpoint`…
mais **pas** le niveau au-dessus :

- le **run** appartiendra au premier `ezk-sprint` lancé, pas au product-builder ;
- les **checkpoints inter-sprints** — précisément les 4 moments où le PO est sollicité
  (inter-sprint, blocage, dérive tokens, idéation) — n'émettront rien ;
- une session de plusieurs sprints apparaîtra comme **N runs sans lien**, au lieu d'un run
  chapeau avec ses jalons.

C'est un **écart d'exécution de la fiche 0050**, pas une nouvelle idée : l'étape 2 de la
fiche racine **0030** disait explicitement « Consignes d'émission dans
**ezk-product-builder** (~15 lignes, checkpoint = gate) ». Le template de consignes a été
livré et intégré dans `ezk-sprint` ; le product-builder a été oublié.

## Proposition

Coller/adapter le bloc de consignes de `src/supervision/README.md` (§ « Template de
consignes d'émission ») dans `skills/ezk-product-builder/SKILL.md`, **en miroir exact de
la règle d'absorption déjà écrite dans `ezk-sprint`** :

- `run_start` au lancement du product-builder (`method_name: "ezk-product-builder"`) —
  c'est **lui** qui ouvre le run quand il est l'appelant ;
- `ezk-sprint`, appelé dans ce run, reçoit « un run est déjà ouvert » → **signal
  d'absorption**, il émet ses gates dans le run du parent (la règle existe déjà côté
  `ezk-sprint`, rien à écrire de neuf — juste à **vérifier qu'elle se déclenche**) ;
- `gate_reached` à **chaque checkpoint** du product-builder (inter-sprint, blocage, dérive
  tokens, idéation), `outcome` reflétant la nature de l'arrêt ;
- `escalate` sur les 4 décisions humaines qu'il refuse de prendre ;
- `run_finished` **par lui seul** (il a ouvert le run).

Vérifier au passage la symétrie avec `vz-product-builder` (qui, lui, émet déjà) : deux
product-builders qui ne se comportent pas pareil sur l'émission est un piège en soi.

## Critères d'acceptation

- [ ] Une session `ezk-product-builder` réelle produit **un seul** run dont
      `run.started` porte `method_name: "ezk-product-builder"`.
- [ ] Les `ezk-sprint` lancés dedans **n'ouvrent pas** de second run (absorption
      constatée dans le journal, pas seulement dans la prose de la skill).
- [ ] Chaque checkpoint inter-sprint apparaît comme un `gate.reached` distinct dans le
      Moniteur, avec son `report_ref`.
- [ ] `run.finished` est émis une fois, par le product-builder.
- [ ] Le validateur cop1 est vert sur le run complet (multi-sprints).

## Notes

- Dépend de la fiche **0094** pour être *observable* — mais peut être écrite avant
  (c'est du markdown de skill).
- Ferme l'étape 2 de la fiche racine **0030**.
- **2026-07-26 — PR #55 mergée. La fiche reste `in-progress`, et c'est volontaire :**
  les 5 critères sont tous **observationnels** (« une session réelle produit… »), et
  cette session-ci a démarré avant le branchement de vectorz (#54), donc sans outils MCP
  chargés. Ce qui restait à *écrire* est écrit ; ce qui reste est à *voir*. Même statut
  que **0094**, pour la même raison — les deux se ferment ensemble à la première session
  `ezk-product-builder` lancée sur vectorz après ce merge.
- **Livré par #55** : la consigne d'émission (il ouvre le run, 5 gates ASCII alignés sur
  sa table, 4 `escalate`, `run_finished` au seul ouvreur, distinction absorption /
  **run orphelin**) + un contrat testé à trois ancrages contre la récidive.
- **Suivi ouvert** : fiche **0099** (vérifier la structure des directives plutôt que
  compter les mentions — finding Codex). Parenté avec **0066** : deux findings bloquants
  de la revue étaient des bugs d'exécution dans du texte que rien ne compile
  (`gate_id` accentué refusé par le runtime ; « 4 checkpoints » pour une table qui en a 5).

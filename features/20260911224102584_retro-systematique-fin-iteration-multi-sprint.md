---
id: "20260911224102584"
title: "Rétro systématique en fin d'itération multi-sprint — appliquer les 2-3 actions clés, tamponner le reste"
type: feature # feature | bug | refactor | chore | epic
priority: P1 # P0 | P1 | P2 | P3
product: mega-city # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: # optionnel — id de la fiche épic parente (type: epic) ; une épic n'en référence jamais une autre
status: ready # idea | ready | in-progress | blocked | shipped
ready: 2026-09-12 # posé par le gate ready — DoR concourue par ezk-pm
pr:
evidence: none # cérémonie / CLI, aucun écran
created: 2026-09-11
---

# 20260911224102584 — La rétro se joue à la fin de l'itération, pas à chaque sprint

## En clair

La cérémonie de rétro existe (`ezk-retro`, shippée), mais on doit la **lancer à la main**.
On veut qu'elle parte **toute seule** — et au **bon rythme**. Le bon rythme, ce n'est pas
chaque sprint. C'est **la fin d'une itération** (un lot de plusieurs sprints).

Pourquoi pas chaque sprint : un sprint tout seul n'accumule pas assez de **métriques et de
frictions** pour qu'une rétro serve à quelque chose. On tournerait à vide. En **espaçant**
les rétros — une par itération multi-sprint — chaque rétro s'appuie sur de vrais chiffres.

À chaque rétro de fin d'itération : on **applique les 2-3 actions les plus utiles** tout de
suite, et on **met le reste en tampon** (backlog en `idea` + le carnet de prépa). On ne
noie pas l'itération suivante sous 15 chantiers.

## Contexte / Problème

Trois trous se combinent aujourd'hui :

1. **Le déclencheur n'existe pas.** `ezk-retro` (fiche `0167`, shippée) est une cérémonie
   **à la demande** (Sujet A). La fiche [[20260831075615969]] le dit noir sur blanc :
   *« ne déclenche pas la rétro — réglage séparé : qui lance la rétro, et quand »*. **Cette
   fiche-ci EST ce réglage.**
2. **La cadence n'est pas pensée.** Une rétro par sprint = trop tôt. Pas assez de sprints
   derrière soi pour voir une tendance. Résultat probable : fatigue de cérémonie et
   décisions prises sur trop peu de données.
3. **Le tri des actions n'est pas borné.** Une rétro peut sortir dix idées. Sans règle, on
   surcharge le sprint suivant. Il faut **appliquer peu, tamponner le reste**.

Le manque tient en une phrase : la rétro n'est **branchée sur rien** dans le cycle de
travail, et son rythme n'est pas réglé pour donner des mesures exploitables.

## Proposition

Piste à trancher au grooming (avec l'architecte). Rien de figé.

1. **Le moteur multi-sprint déclenche la rétro.** `ezk-product-build` enchaîne les sprints ;
   c'est lui qui, **en fin de run** (ou tous les N sprints, cadence configurable), invoque
   `ezk-retro run` sur le périmètre « itération ».
2. **Appliquer 2-3, tamponner le reste.** La rétro classe ses propositions par valeur/coût.
   Les **2-3 meilleures** sont appliquées dans la foulée. Le reste part en **tampon** :
   fiche `idea` au backlog (via `ezk-backlog add`) et/ou note dans le carnet [[0081]].
   Le PO garde la main — la liste appliquée / tamponnée est **arbitrable**, jamais silencieuse.
3. **Cadence au service des métriques.** L'espacement se règle pour qu'assez de métriques
   de sprint se soient accumulées entre deux rétros (lien avec le domaine « métriques de
   sprint »). Une itération = plusieurs sprints = un vrai jeu de données.

**Compose, ne réimplémente pas** :

- [[0167]] *(shippée)* — la cérémonie elle-même. On l'**invoque**, on ne la refait pas.
- [[0081]] — le carnet de prépa : l'**entrée** (chaque session note ses frictions au fil de
  l'eau). Sans lui, la rétro de fin d'itération part d'un souvenir. Avec lui, d'un corpus réel.
- [[20260831075615969]] — le **volet recette** de la rétro (invoquer `ezk-chef suggest`).
  Se joue dans la même cérémonie. Distinct, à composer.
- `ezk-product-build` — le moteur qui porte le déclencheur.

## Critères d'acceptation

- [ ] **Cadence.** Un `run` qui construit **≥ 2 sprints** déclenche **une** rétro à la
      clôture (`--retro end`, défaut) ; `--retro every:N` (N ≥ 2) en déclenche une **tous
      les N sprints construits** ; `--once` / `--max-sprints 1` n'en déclenche **jamais**.
      Vérifiable au journal `SPRINT.md` + à la trace de gate `retro-iteration`.
- [ ] **Compose sans réimplémenter.** Le déclencheur **invoque** `ezk-retro run
      "itération …"` ; aucun temps de la cérémonie (round-robin / juge / rangement) n'est
      recodé dans `ezk-product-build`. `composes:` inclut `ezk-retro`.
- [ ] **Enacte 2-3, le reste reste au backlog, PO à la main.** `ezk-retro` range déjà ses
      sorties (fiches + règles) ; à la clôture, **au plus 2-3** sont **enactées** dans la
      foulée, le reste **reste au backlog** (les fiches de la rétro = le tampon, en `idea`) —
      **jamais de re-`add`**. La liste « enacté / laissé » est **arbitrable** : STOP en
      `--mode manuel`, délégation `ezk-pm` + journal en `auto`.
- [ ] **Dégradation propre si le carnet [[0081]] est absent** : la rétro tourne quand même
      (signaux `SPRINT.md` du lot + session), le tampon va **au seul backlog**, sans erreur.
- [ ] **Vues & gate.** Graphe README (`composes:graph`) + carte (`map:data`) régénérés ;
      gate locale verte (typecheck / lint / tests, dont `expand` / `profiles-sync` /
      `compiled-graph` / `map-data`).

## Comment vérifier

- [ ] Lancer un `ezk-product-build` qui enchaîne plusieurs sprints → à la fin, **une** rétro
      part, propose des actions, applique les 2-3 retenues, tamponne le reste.
- [ ] Un run d'**un seul** sprint ne déclenche **pas** de rétro (on n'affame pas les métriques).
- [ ] Ouvrir le rapport de rétro : la liste « appliqué / tamponné » est explicite, chaque
      entrée arbitrable par le PO.

## Notes / décisions

- **Origine** : Thomas, 2026-09-11 — « faire une rétro uniquement en fin de multi-sprint,
  les étaler sinon on n'aura pas assez de métriques ». Le déclencheur + la cadence, au
  service de l'auto-amélioration mesurée.
- **`priority: P1`** posée comme reco (non tranchée explicitement par le PO) — ajustable.
- **Frontière** : cette fiche est le **quand/déclencheur** ; elle ne réécrit pas la cérémonie
  ([[0167]]), ni le carnet d'entrée ([[0081]]), ni le volet recette ([[20260831075615969]]).
- **Ne touche pas** au Sujet B / ADR-030 (contrat d'améliorabilité mesuré) — mais elle
  l'**alimente** en données en cadençant la collecte.
- **Anti-doublon** : le « qui lance la rétro et quand » est explicitement laissé ouvert par
  [[20260831075615969]] ; aucune fiche ne le portait. Fiche distincte, à composer.

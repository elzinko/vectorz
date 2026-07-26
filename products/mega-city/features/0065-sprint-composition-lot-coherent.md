---
id: 0065
title: Sprint composition — un sprint peut porter un lot cohérent de fiches ; granularité PR = incrément livrable cohérent
type: feature
priority: P2
status: idea
pr:
created: 2026-07-16
---

# 0065 — Sprint composition (lot cohérent) & granularité de PR

## Contexte / Problème

Question PO (session 2026-07-16, premier self-host) : la règle actuelle est stricte —
**« 1 ligne = 1 feature = 1 PR »** (`products/mega-city/skills/ezk-sprint/SKILL.md:59`, et
« 1 PR/feature » côté `ezk-backlog`). Le PO demande : un sprint ne pourrait-il pas porter
**un ou plusieurs fiches qui ont du sens ensemble** ? Deux bénéfices visés :

1. **Affiner les PR avec des revues adverses** — une unité cohérente se revoit mieux qu'un
   fragment isolé ;
2. **Trouver de la cohérence** — ex. *un ADR ⇒ un article*, ou un **lot de features couplées**.

## Proposition

À groomer. Piste (distinguer deux niveaux qu'on confond aujourd'hui) :

- **Sprint ≠ PR.** Un **sprint** peut grouper **un lot cohérent** de fiches vers un **but de
  sprint** (c'est la sortie du planning — fiche [0100](0100-sprint-intake-sante-backlog-metriques.md)).
  La **PR** reste l'unité de revue/merge.
- **Défaut : petite PR = 1 incrément livrable cohérent** (souvent 1 fiche) — meilleure revue,
  revert propre, une raison de changer.
- **Bundling en 1 PR autorisé** quand les fiches sont **inséparables** (l'une n'a pas de sens
  sans l'autre, ou doivent atterrir atomiquement pour garder le repo vert) **ou petites et
  tightement couplées** (ex. `ADR + son article`).
- **Revue adverse sur le LOT / le but de sprint** : donner au relecteur le **contexte de
  cohérence** (les fiches liées), **pas** via une PR obèse. La cohérence se juge au niveau du
  sprint, la revue atomique au niveau de la PR.

## Critères d'acceptation

- [ ] À définir au grooming (promotion `idea → todo`).

## Notes / décisions

- **Auto-démonstration** : les fiches **0063 (ezk-retro) + 0100 (intake/santé, ex-0064) + 0065 (ce
  sujet)** forment justement un **lot cohérent** (« améliorer la méthode ») — le cas exact
  décrit par le PO. Elles sont d'ailleurs capturées ensemble (PR #20).
- Relie [0100](0100-sprint-intake-sante-backlog-metriques.md) (le « lot » = sortie du sprint
  planning) et [0063](done/0063-ezk-retro-ceremonie-auto-amelioration.md) (la règle de composition
  est une **règle d'équipe évolutive** — donc gérable par `ezk-retro`).
- À trancher au grooming : la formule de règle (« 1 PR = 1 incrément livrable cohérent :
  souvent 1 fiche, parfois un couple ») et **où** l'inscrire (rule mega-city `rules/` vs
  `ezk-sprint`).
- Origine : session 2026-07-16. Priorité P2 à confirmer au grooming.
- 2026-07-17 — **articulation ADR-0016 §3 mega-city (PR #26)** : le planning y est fixé en
  tirage unitaire ready-only (`next --ready-only`) avec but de sprint journalisé —
  compatible avec le lot cohérent visé ici (le planning peut tirer plusieurs fiches ready
  vers un même but ; la PR reste l'unité de revue/merge). Cette fiche garde la question
  de la granularité sprint ↔ PR.

---
id: 0065
title: Sprint composition — un sprint peut porter un lot cohérent de fiches ; granularité PR = incrément livrable cohérent
type: feature
priority: P2
product: mega-city
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

## Mise à jour 2026-08-13 — le grain de *merge* (relance PO) → ADR-037

**Cas daté (session 2026-08-13).** Le PO relance depuis l'angle **opérationnel** :
« quand `ezk-product-builder` / `ezk-sprint` tournent beaucoup, on se retrouve avec
**plusieurs PR** — dur à gérer, tester et surtout **merger** (merges successifs). Un mode
`--sequence=pr-by-feature|1-pr` créant **une seule PR à plusieurs commits organisés par
feature**, avec les **corps de fiche de PR agrégés** et une **procédure de test agrégée**
en fin (en plus des procédures par PR), serait-il judicieux ? »

**Ce que la relance ajoute à 0065 (angle neuf).** 0065 posait la granularité *sprint ↔ PR*
côté **revue** (garder la PR atomique, porter la cohérence au niveau du sprint). La relance
isole un **second axe** distinct : le **grain de merge** — le *nombre de fois qu'on touche
`main`*. Dans ce repo, chaque merge tire des frictions réelles (collisions d'ids horodatés,
~45 liens cassés / ship, `main` qui décale et force à rebaser les suivantes) : réduire le
**nombre** de merges a une valeur propre, indépendante de la qualité de revue.

**Décision d'architecture : [ADR-037](../docs/adr/ADR-037-grain-merge-separable-du-grain-revue.md)** (Proposé, 2026-08-13).
- Sépare **grain de revue** (feature, atomique — inchangé) et **grain de merge** (levier de
  livraison décidé par l'orchestrateur).
- Nouveau levier `--delivery=per-feature|per-epic|batched` (noms à acter) sur
  **`ezk-product-builder`** — pas `ezk-sprint`, dont l'invariant « jamais 2 features dans
  *sa* PR » reste **intact** : il produit la matière, l'orchestrateur assemble au checkpoint
  inter-sprint.
- Mode agrégé = **1 `rebase-merge`** (PAS squash — sinon les N features s'écrasent en un
  commit fourre-tout et on perd la traçabilité voulue), **réservé aux lots cohérents** (même
  `epic:`). C'est exactement le « bundling autorisé quand les fiches sont inséparables /
  couplées » que 0065 tolérait déjà — **pas** la « PR obèse » qu'elle refusait pour des fiches
  indépendantes : la tension est **levée**, pas contredite.
- **`ezk-pr-pilot` = épine dorsale réutilisée** (sa branche d'intégration + son train de merge
  existent déjà), pas réimplémentée.

## Grooming 2026-08-13 — arbitrages PO tranchés

Les 3 arbitrages PO ouverts sont **tranchés** (session 2026-08-13), tous sur la reco d'archi :

1. **Déclencheur du regroupement = `epic:` auto + opt-in explicite.** Les fiches partageant un
   même `epic:` (marqueur de cohérence existant, ADR-0017) se regroupent **automatiquement** en
   mode agrégé ; un **opt-in explicite** permet de désigner un lot cohérent **hors épic** (ex.
   `ADR + son article`). **Pas de seuil de N** — il regrouperait des fiches indépendantes, soit
   la « PR obèse » que 0065 refuse.
2. **Nom du levier = `--delivery=per-feature|per-epic|batched`** (sur `ezk-product-builder`).
   « delivery » nomme l'axe réel (stratégie de livraison/merge). `per-feature` = défaut inchangé ;
   `per-epic` = regroupement auto par épic ; `batched` = lot désigné explicitement.
3. **Plafond = warning souple (~5-6 features/PR), non bloquant.** Au-delà, alerter « lot
   volumineux, revue lourde — confirmer ? » sans forcer le split (ni plafond dur arbitraire, ni
   absence de garde-fou).

DoR désormais complète (problème / valeur / critères + arbitrages levés). Reste avant *Accepté*
de l'ADR : **panel adverse** sur [ADR-037](../docs/adr/ADR-037-grain-merge-separable-du-grain-revue.md).

## Critères d'acceptation

Cadre posé par [ADR-037](../docs/adr/ADR-037-grain-merge-separable-du-grain-revue.md) ; à confirmer au grooming (promotion `idea → todo`) :

- [ ] `ezk-product-builder` expose `--delivery=per-feature|per-epic|batched` ; défaut `per-feature` = comportement actuel **inchangé** (aucune régression)
- [ ] Mode agrégé : une **branche d'intégration** porte N commits conventional (≥ 1 / feature), **1 seule PR** ouverte, merge en **`rebase-merge`** (commits par feature préservés sur `main`, jamais un squash fourre-tout)
- [ ] Corps de PR agrégé = **sommaire** (table `feature | fiche | statut gate`) + **une section par feature** (bloc thin `## Summary` / `## Lien fiche` / `## Comment tester` réutilisé) + **`## Tout valider en une passe`** ; les « Comment tester » par feature sont **conservés**
- [ ] `ezk-pr-pilot` (branche d'intégration + train de merge) **réutilisé**, pas réimplémenté
- [ ] `check-pr-body.sh` tolère la **répétition** des 3 titres sous des sections par feature
- [ ] Regroupement déclenché par **`epic:` auto + opt-in explicite** (pas de seuil aveugle) ; **warning souple ~5-6 features/PR** (non bloquant) — *arbitrages PO tranchés le 2026-08-13 (cf. section Grooming)*
- [ ] Panel adverse passé avant de graver ADR-037 (Proposé → Accepté)
- [ ] Gate locale verte (tests + liens markdown)

## Notes / décisions

- **Auto-démonstration** : les fiches **0063 (ezk-retro) + 0100 (intake/santé, ex-0064) + 0065 (ce
  sujet)** forment justement un **lot cohérent** (« améliorer la méthode ») — le cas exact
  décrit par le PO. Elles sont d'ailleurs capturées ensemble (PR #20).
- Relie [0100](0100-sprint-intake-sante-backlog-metriques.md) (le « lot » = sortie du sprint
  planning) et [0063](done/0167-ezk-retro-ceremonie-auto-amelioration.md) (la règle de composition
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

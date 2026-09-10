---
id: "20260910152227744"
title: Couche de règles PROJET-LOCAL (`.vectorz/`) — règles propres à un projet, composées + auditables
type: feature # feature | bug | refactor | chore | epic
priority: P2 # P0 | P1 | P2 | P3
product: vectorz # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: "20260910155608287" # cadrage : problématique des règles ezk (typologie/mesure/scoping)
status: idea # idea | ready | in-progress | blocked | shipped
ready:
pr:
evidence: none # mécanisme / CLI, pas d'écran
created: 2026-09-10
---

# 20260910152227744 — Couche de règles PROJET-LOCAL (`.vectorz/`)

## En clair

Aujourd'hui les règles ezk sont **globales** — elles s'appliquent à tous les projets qui
utilisent vectorz. On veut qu'un projet (ex. samplerz) puisse avoir ses **propres** règles de
dev (« conçois CE projet en hexagonal », « pas d'import `adapters` dans `domain` ») qui ne
débordent **pas** sur les autres, restent **auditables** (prouver → retirer) et réutilisent des
**bundles**. Décision d'archi actée en **[ADR-0050](../products/mega-city/docs/adr/0050-couche-regles-projet-local.md)**.

## Contexte / Problème

Deux natures de règle projet, que le mécanisme actuel ne sait pas scoper à un projet :

- **(a) invariant vérifiable** (« pas d'import `adapters/` dans `domain/` ») → un lint le vérifie
  a posteriori ;
- **(b) guidage génératif** (« hexagonal », « composition > héritage ») → un lint ne peut PAS le
  produire ; ça vit dans la **composition du prompt** des agents.

Les mémoires projet / `CLAUDE.md` ne suffisent pas : ni garantie d'application, ni audit
mesurable pour retirer une règle, ni composition ciblée par rôle, ni bundles.

## Proposition (design ADR-0050)

Une couche projet-local, **un seul mécanisme**, discriminée par `enforcements[]` :

- **`.vectorz/` = le contrat du projet** : règles locales + manifeste sélectionnant les bundles
  globaux + un binding par règle (`gate: <cmd | job CI>` | `advisory`).
- **Méta-gate d'honnêteté** au load : `MUST` interdit sans `enforcements[]` résolvable → advisory
  plafonné `SHOULD`/`GUIDE`. On sépare « chargée » (déterministe) de « appliquée » (gate).
- **Split** : Découvrir + Composer + Mesurer = vectorz ; **Exécuter** le gate = le projet.
- **Couplage inversé** : le projet expose ses gates, vectorz consomme le contrat (jamais le CI concret).
- **POC-first** : loader + schéma de manifeste + méta-lint. Pas de runtime de plugins par agent.

## Critères d'acceptation

- [ ] Un projet déclare dans `.vectorz/` une règle **locale** ; elle est **composée** dans le prompt
  des agents QUAND ils tournent dans ce projet, et **absente** ailleurs (scope étanche).
- [ ] Une règle `MUST` **sans enforcement résolvable est refusée au load** (erreur), pas
  silencieusement dégradée — où un **enforcement** est soit un **gate exécutable** (invariant
  machine, ex. import-linter), soit une **revue a posteriori** liée (règle de codage-JUGEMENT,
  ex. hexagonal, vérifiée sur la PR). Les deux types comptent.
- [ ] **Migration (finding Codex P1 PR #219)** : les règles `MUST` **existantes** sans enforcement
  (ex. `products/mega-city/rules/hexagonal/*`, `development/local-first-feedback.md`) ne deviennent
  **PAS inchargeables d'un coup**. Un chemin de migration est livré AVANT d'activer le méta-gate
  strict : grandfathering daté, **ou** reclassification `MUST → SHOULD/GUIDE`, **ou** binding vers
  une revue a posteriori. Le méta-gate strict ne s'active **qu'une fois le corpus migré**.
- [ ] Une règle locale **ne peut pas DESSERRER** un `MUST` global (durcir OUI, desserrer → erreur au load).
- [ ] Le loader **émet** le chemin résolu (`git rev-parse --show-toplevel`) + le SHA, et le **jeu
  EFFECTIF** composé (pas le déclaré).
- [ ] Chaque gate incrémente un **compteur d'audit** (chargé / violé / passé) → base du retrait mesuré.

## Comment vérifier — LE TEST SE FAIT VIA VECTORZ UTILISÉ PAR UN AUTRE PROJET

⚠️ **Contrainte PO** : le mécanisme ne se valide pas dans vectorz seul, mais dans le cadre d'un
**projet consommateur** (samplerz = banc d'essai). Le test vise la **couche déterministe** (règle
injectée + gate exécuté), **jamais** l'obéissance du LLM (non reproductible).

1. **ROUGE (loader débranché)** — dans samplerz, un diff qui viole une règle-gate témoin
   (`hexagonal-imports`) : le prompt composé **ne contient pas** l'id de la règle ; le gate n'est
   **jamais** invoqué ; la violation passe.
2. **VERT (loader branché, dans samplerz)** — même diff : (a) le prompt composé **contient** le
   texte de la règle (preuve « chargée ») ET (b) le gate déclaré **s'exécute et rend ≠ 0**
   (preuve « appliquée »).
3. **DEUX NATURES** — le banc exerce **une** règle-gate ET **une** règle advisory (« préfère la
   composition ») et prouve que le mécanisme **étiquette différemment leur garantie sans mentir**
   (l'advisory est injectée, jamais présentée comme garantie).
4. **SCOPING (négation)** — un **second** projet consommateur SANS cette règle : elle n'est **pas**
   chargée. Prouve qu'elle est locale et ne fuit pas en global.
5. **PRÉCÉDENCE** — un local qui tente d'abaisser un `MUST` global → le load **échoue**.

## Notes

- Dépend de : le mécanisme `rules/` + `bundles/` existant (le local l'ÉTEND, ne le duplique pas).
- Découle de la rétro samplerz 2026-09-06 : plusieurs règles proposées étaient méthode-wide, mais
  d'autres seraient propres à un projet — d'où ce besoin de scope.
- Alternatives rejetées (ADR-0050) : B (mémoires/`CLAUDE.md` seuls, pas d'enforcement/audit) ;
  C (registre mince + gates CI seuls — jette le guidage génératif (b)).

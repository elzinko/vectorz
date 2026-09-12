---
id: "20260912180313727"
title: "Repenser le backlog : fusionner PLAN dans BACKLOG (champs itération/version) + historiser les itérations (sprint + rétro)"
type: refactor # feature | bug | refactor | chore | epic
priority: P2 # P0 | P1 | P2 | P3
product: mega-city # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: # optionnel — id de la fiche épic parente
status: idea # idea | ready | in-progress | blocked | shipped
ready: # YYYY-MM-DD — posée par le gate `ready <id>`
pr:
evidence: none # méthode / fichiers markdown, aucun écran
created: 2026-09-12
---

# 20260912180313727 — Repenser le backlog : PLAN → BACKLOG + historique par itération

## En clair

Une session muti (2026-09-12) a buté sur **deux confusions de méthode** : (1) la différence
PLAN.md vs BACKLOG.md n'est pas évidente, et (2) il y avait **deux `SPRINT.md`** (un à la racine,
un périmé dans `features/`). Le PO propose de **simplifier** : garder **un seul `BACKLOG.md`**
(plus parlant) trié par priorité, enrichi d'un champ **itération** et/ou **version** disant quel
sprint a traité la fiche — et **supprimer le PLAN séparé**. En parallèle, **historiser chaque
itération** : archiver le `SPRINT.md` de fin de sprint dans un dossier dédié (proposition :
`features/iterations/`), à côté des **rétrospectives**, le tout **cadré par des templates**.
À **groomer avec l'architecte et un spécialiste scrum**.

## Contexte / Problème (vécu en muti, 2026-09-12)

Le backlog ezk a **4 artefacts** aux rôles proches, source de confusion pour le PO :
- **fiches** (`features/*.md`) — le quoi, source de vérité (front-matter).
- **BACKLOG.md** — index **régénéré**, trié par priorité. Jamais édité à la main.
- **PLAN.md** — séquence **curée** (ordre décidé, jalons, horizon NOW, narratif).
- **SPRINT.md** — brouillon **éphémère** du sprint en cours (racine, par-branche).

Frictions constatées :
1. **PLAN vs BACKLOG peu lisible.** Le BACKLOG est déjà trié par priorité ; ce que le PLAN ajoute
   (séquence intra-priorité, jalon, NOW, pourquoi) n'est pas évident, et le PLAN **dérive** (il
   accumulait 4 mois d'historique de re-séquençage, et son lien « Sprint en cours » pointait vers
   le mauvais fichier).
2. **`SPRINT.md` en double** : `/SPRINT.md` (racine, courant) **et** `features/SPRINT.md` (périmé,
   sprint « 0019 »). La méthode place SPRINT.md à la **racine** (éphémère) ; `features/` ne doit
   contenir que fiches + BACKLOG + PLAN + README + `done/` + template. Nettoyé en muti (le périmé
   supprimé), mais le fond — deux conventions qui coexistent — est un problème de **méthode**, pas
   propre à muti.
3. **Coût** : maintenir 2-3 artefacts curés en parallèle = surcoût + dérive (liens cassés, doublons).

## Proposition (esquisse — à groomer avec archi + scrum)

### A. Fusionner PLAN dans BACKLOG
- Garder **un seul `BACKLOG.md`** (plus parlant), trié par priorité.
- Ajouter aux fiches un champ front-matter **`iteration`** et/ou **`version`** : l'itération (sprint)
  qui a **traité** la fiche, et/ou le jalon (V1, 1.7.0…) visé.
- La **séquence** / le **NOW** / le **jalon** — aujourd'hui portés par PLAN — seraient portés par
  ces champs (tri/filtre) ou par une **petite section curée en tête** du BACKLOG, plutôt qu'un
  fichier séparé.
- **À trancher** : le BACKLOG reste-t-il **régénéré** (auto, non éditable) ou devient-il **éditable** ?
  Si régénéré, comment encoder la séquence intra-priorité (champ `order:` ? section curée en tête ?).

### B. Historiser les itérations (sprint + rétro)
- À la **clôture** d'une itération, **copier le `SPRINT.md`** dans un fichier d'historique.
- Emplacement proposé (PO) : **`features/iterations/`** (jugé plus adapté que le `docs/sessions/`
  actuel de `ezk-archive`) — **un `.md` par itération**.
- Y ranger aussi les **rétrospectives** en `.md` (vectorz a déjà un « carnet de rétro » + des
  clôtures d'itération — à réconcilier, pas réinventer).
- **Formats cadrés par des templates** (template sprint, template rétro) à valider.
- **À trancher** : `features/iterations/` vs `docs/sessions/` existant ; nommage ; rapport avec
  `ezk-archive` (qui archive déjà SPRINT.md dans `docs/sessions/`) ; vocabulaire **« itération »
  vs « sprint »**.

## À décider au grooming (archi + spécialiste scrum)

- **PLAN** : supprimé, ou réduit à un « PLAN maigre » (NOW + jalon seulement) ? (alternative discutée en muti)
- **BACKLOG** régénéré vs éditable — impact direct sur la façon de porter la séquence.
- **Champs** `iteration` / `version` : sémantique exacte, qui les pose (le `ship` ? le sprint ?), un ou deux champs.
- **`features/iterations/`** : structure, templates (sprint + rétro), et fusion avec le flux
  `ezk-archive` → `docs/sessions/` (éviter un 3ᵉ doublon de convention).
- **Vocabulaire** unifié : itération / sprint / session.

## Comment vérifier (une fois défini)

- Une fiche indique **quelle itération l'a traitée** (champ visible dans le BACKLOG).
- L'**historique par itération** est consultable (un fichier par itération, rétro incluse).
- Plus de **PLAN/SPRINT en double** ni de convention qui dérive ; un seul chemin clair.

## Notes / décisions

- **Origine** : session muti 2026-09-12 (retour PO). Confusion PLAN/BACKLOG + `SPRINT.md` dupliqué.
  Nettoyage muti déjà fait (`features/SPRINT.md` périmé supprimé, lien PLAN corrigé, commit `d24792b` muti).
- **Impacte les skills** : `ezk-backlog` (PLAN, BACKLOG, `regen`, champs front-matter), `ezk-archive`
  (`docs/sessions/` + archive SPRINT), `ezk-sprint` (SPRINT.md), et les **scripts regen + vues
  générées** de mega-city.
- **Contrainte connue** : toucher `features/` en vectorz oblige à régénérer les vues (carte, board,
  plan, graph, BACKLOG) — tout changement de format devra mettre à jour ces générateurs.
- À groomer avec **ezk-architect** + un rôle **scrum** (ezk-qa ou équivalent).

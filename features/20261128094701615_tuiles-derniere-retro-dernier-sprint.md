---
id: "20261128094701615"
title: "Les tuiles « Dernière rétro » et « Dernier sprint » disent leur titre, leur date et leur contenu"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control, projets]
status: ready
blocked:
depends: ["20261114131612204"]
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128094701615 — Les tuiles « Dernière rétro » et « Dernier sprint » disent leur titre, leur date et leur contenu

**En clair.** Sur Projets et sur la Vue d'ensemble, la tuile « Dernière rétro » dit « 63 rétros · dates non
publiées ». Pourtant la page Rétros connaît le titre et la date de chacune. La tuile « Dernier sprint »
affiche un nom technique tronqué. On branche les deux tuiles sur les données publiées.

**Si tu arrives frais.** Mission control est l'écran de cop1. Il lit ce que la méthode publie et n'invente
rien (ADR-086). Une rétro laisse une capture : son thème, sa date, ses propositions. La maquette est la
référence d'écran du PO : pages « Accueil » et « Vue d'ensemble ».

## Contexte / Problème

La maquette montre « Rétro des sprints 29-30 · 4 nov. · 3 propositions » avec une puce « 2 décisions PO »,
et « Sprint 32 — Chaque projet montre les recettes qu'il implémente ». L'app montre un compte nu et un
identifiant coupé. Les captures de rétro sont déjà servies à la page Rétros. Le numéro et le but du sprint
arrivent avec la fiche « Le sprint se publie avec son numéro continu, son but et sa branche ».

## Proposition

1. **Dernière rétro** : le thème de la capture la plus récente, sa date, le nombre de propositions, et une
   puce « N décisions PO » quand des propositions attendent. Un clic ouvre la page de cette rétro.
2. **Dernier sprint** : « Sprint N — but » quand la méthode les publie, sinon le nom actuel. Un clic ouvre
   la page du sprint.
3. **Dernier objectif** : un clic ouvre la page de l'objectif.
4. Sans capture publiée, la tuile garde « non publié ».

## Critères d'acceptation

- [ ] La tuile « Dernière rétro » montre le thème, la date et le nombre de propositions de la capture la
  plus récente ; la puce des décisions en attente n'apparaît que s'il y en a.
- [ ] La tuile « Dernier sprint » montre « Sprint N — but » dès que la méthode les publie.
- [ ] Chaque tuile ouvre la page de son objet.
- [ ] Un projet sans capture ni compte rendu garde « non publié », jamais une valeur inventée.
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Vue d'ensemble : http://localhost:5274 → Vue d'ensemble
- `pnpm --dir products/cop1/packages/web exec vitest run`

## Notes / décisions

- 2026-11-28 — Fiche née de la comparaison maquette ↔ app demandée par le PO.
- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. À tirer après la fiche du sprint numéroté.

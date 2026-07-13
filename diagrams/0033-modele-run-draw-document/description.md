# Modèle typé → run / draw / document + siège d'autorité (illustre la fiche 0033)

> Source de vérité de ce diagramme (prose). Le `.mmd` et le `.svg` en sont générés.

Synthèse du brainstorm 2026-07-12/13. Un **seul modèle typé** (source de vérité) — des **nœuds**
(rôles/sièges avec attributs) et des **arêtes** (interactions typées : `kind`, `maxRounds`, `arbiter`) —
produit **trois projections** :

- **RUN** : les agents l'exécutent (boucles, autorité, garde-fous).
- **DRAW** : le diagramme + son image (via `ezk-diagram`).
- **DOCUMENT** : la doc générée (org-chart, catalogue de rôles).

Au **RUN**, une interaction typique est la **boucle bornée Dev ⇄ Reviewer** : le reviewer produit des
findings (GO/NO-GO), le dev **applique** ou **rejette-avec-justification**, dans la limite de **N rounds**.
Si ça converge → **GO**. Sinon (plafond atteint, ou décision hors de l'autorité du dev) → **ESCALADE**
vers le **siège d'autorité**.

Le **siège d'autorité** est un **port à double occupant** : en mode **INTERACTIF** c'est l'**humain** (toi) ;
en mode **AUTONOME** c'est le **superviseur cop1** (un agent occupe le siège). Les agents worker sont
**agnostiques au mode** — seul l'occupant du siège change.

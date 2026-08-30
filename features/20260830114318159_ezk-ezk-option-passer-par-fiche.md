---
id: "20260830114318159"
title: ezk-ezk — option configurable « passer par la méthode » (proposer une fiche au lieu de créer un skill direct)
type: feature
priority: P2
product: mega-city
version:
epic:
depends: []
status: idea
ready:
pr:
created: 2026-08-30
---

## En clair

Aujourd'hui `ezk-ezk` fabrique un **skill directement** (depuis une discussion de session,
via `harvest`/`create`). L'idée du PO : lui ajouter un **mode configurable** où, au lieu de
sortir le skill tout de suite, il **passe par la méthode** — il **propose une fiche** de
backlog (avec les specs et les contraintes déjà dedans), et le skill est ensuite construit
par le flux normal (groom → build → ship). « Bien faire la fiche, c'est déjà tout dire. »

## Contexte / Problème

`ezk-ezk create` produit un `SKILL.md` sans passer par une fiche — le skill naît hors du
backlog. Ça saute l'anti-doublon, la revue, la DoR et la trace (la fiche = le document,
ADR-0029). Pour un geste ponctuel c'est pratique ; pour un skill qui va vivre, on aimerait
qu'il **entre par la porte de la méthode** comme tout le reste.

Le PO ne veut **pas retirer** le comportement direct (parfois on veut juste le skill). D'où
une **option**, pas un remplacement.

## Proposition (à groomer)

Une option (flag ou config) sur `ezk-ezk` — ex. `--via-fiche` / `--propose` — qui, au lieu de
matérialiser le skill, **délègue à `ezk-backlog add`** une fiche pré-remplie :
- le **problème** et la **valeur** tirés de la discussion ;
- les **specs et contraintes** (ce que le skill doit faire, ses garde-fous) ;
- un lien vers la matière source (session / repo).

Puis le flux normal reprend : groom → `ezk-sprint` construit le skill → ship. Le comportement
direct (`create` sans l'option) reste inchangé.

## Critères d'acceptation (à affiner)

- [ ] `ezk-ezk` accepte une option qui, au lieu de sortir un `SKILL.md`, crée une **fiche**
      via `ezk-backlog add` (dédoublonnée), avec specs + contraintes.
- [ ] Le comportement **direct** (création immédiate du skill) reste disponible par défaut ou
      sous l'autre valeur de l'option — les deux modes coexistent.
- [ ] La fiche produite est **tirable** (assez de matière pour groomer sans redemander).
- [ ] Frontière écrite avec `ezk-chef extract` (fiche 20260824122629794) : `ezk-ezk` propose
      un **skill** via fiche ; `ezk-chef extract` produit une **recette**. Objets différents.

## Notes

- **Origine** : discussion PO du 2026-08-30 (consolidation « famille recette » + « ezk-ezk
  devrait passer par la méthodologie »). Capturée pour ne pas la perdre — **pas encore
  arbitrée** (priorité P2 provisoire).
- **Voisins** : `ezk-ezk` (harvest/create existants), `ezk-chef extract` (producteur de
  recettes, fiche 20260824122629794), `ezk-backlog add` (le délégataire).
- À trancher au groom : nom exact de l'option, valeur par défaut (direct vs via-fiche),
  périmètre (juste `create` ou aussi `harvest`).

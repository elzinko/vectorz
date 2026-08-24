---
id: "20260823124042842"
title: Vue d'avancement — les fiches positionnées sur le process scrum, sprints passés/en cours/futurs
type: feature
priority: P2
product: mega-city
version:
epic:
status: todo
ready: 2026-08-24
pr:
created: 2026-08-23
---

## En clair

Une **deuxième vue**, séparée de la carte du domaine : elle montre *où en est le
travail*. La liste des features triée par priorité et statut, les sprints (passés,
en cours — possiblement plusieurs —, futurs), et un diagramme dynamique du process
scrum où l'on **voit les fiches posées sur les étapes**. Vue macro d'abord, détail
par étape au clic. Grosse évolution, prototype exigeant côté UX/UI.

> Priorité P2 **confirmée** (2026-08-23). **Groomée et READY le 2026-08-24** sur le
> périmètre lot 0 (voir la section Grooming) — tirable par le prochain sprint.
>
> **Verdict du panel adverse (2026-08-23)** : le lot 1 n'est PAS sprint-as-data
> (risque « 4ᵉ système scrum », ADR-0013) — c'est le **board lot 0**, compilé depuis
> le frontmatter EXISTANT (fiches × priorité × statut), zéro objet nouveau, même
> invariant de test que la carte. Sprint-as-data ne se décide qu'après, si le board
> prouve le manque — pièce au dossier : `SPRINT.md` singleton déjà corrompu par
> l'entrelacement de deux chantiers (constat du panel, rapport B-6). Capture :
> `docs/captures/2026-08-23-panel-adverse-refonte-taxonomie.md`.

## Contexte / problème

La carte du domaine (PR #162) montre la **structure** de la méthode : skills, juges,
loi, profils. Rien ne montre le **flux** : quelles fiches avancent, dans quel sprint,
à quelle étape du process. Aujourd'hui il faut lire `features/BACKLOG.md`, `PLAN.md`
et les archives de `docs/sessions/` pour reconstituer l'avancement de tête.

Décision de conception PO (2026-08-23) : **deux vues séparées** — la carte du domaine
(déjà livrée) et cette vue d'avancement. Les confronter aidera aussi à voir les
erreurs de la première.

## Proposition

1. **Le board** : les fiches du backlog, triées par priorité puis statut
   (idea / todo / ready / in-progress / blocked / shipped), avec filtres.
2. **La frise des sprints** : sprints passés, en cours, futurs — avec l'ordonnancement
   des fiches embarquées et leur état. Plusieurs sprints peuvent être en cours.
3. **Le diagramme du process** : les étapes macro de la méthode (fiche → tirage →
   sprint → validation → rétro, base visuelle : les schémas classiques du « scrum
   development process ») avec **les fiches positionnées sur leur étape courante**.
   Zoom : cliquer une étape macro ouvre son détail.
4. **Même principe que la carte** : tout est compilé depuis les fichiers (frontmatter
   des fiches, plan, graphe) — rien n'est dessiné à la main. `map-data`/`graph` sont
   la fondation ; cette vue ajoute un compilateur « avancement ».

**Constat (recadré par le panel puis le grooming)** : le sprint n'est pas un objet de
données (`SPRINT.md` éphémère, `docs/sessions/` en prose) — mais ce N'EST PAS le premier
lot : le board lot 0 se construit sans lui, et c'est l'USAGE du board qui dira si cet
objet mérite d'exister (critère dédié dans la DoR ci-dessous).

## Grooming du 2026-08-24 — DoR posée sur le LOT 0 uniquement

**Problème** : rien ne montre le flux (où en sont les fiches) — il faut lire trois
fichiers de tête. **Valeur** : le PO voit l'avancement d'un coup d'œil, et le board
révélera par l'usage quelle donnée manque VRAIMENT (avant d'inventer un objet sprint).
**Périmètre lot 0, fermé** : le board compilé depuis le frontmatter EXISTANT — fiches ×
priorité × statut × étage (taxonomie) × épic, avec filtres — servi par `pnpm ezk:map`
(nouvelle carte `diagrams/avancement/`), compilateur + invariant de test « données
disque ≡ régénérées », zéro objet nouveau, zéro saisie à la main.
**Hors lot 0 (gated, décision après usage)** : la frise des sprints, le diagramme du
process avec fiches posées, et TOUT objet sprint-as-data (verdict panel — pièce B-6 au
dossier).

## Critères d'acceptation (lot 0)

- [ ] `pnpm ezk:map avancement` ouvre le board : toutes les fiches actives, triées
      priorité puis statut, filtrables (statut, étage, épic, produit).
- [ ] Chaque carte du board cite id + titre + statut + priorité + épic — cliquer ouvre
      le fichier source (lien direct servi par ezk-map).
- [ ] Les données sont compilées (`avancement-data`, même patron que map-data) ; le
      test d'invariant rougit si le backlog change sans régénérer.
- [ ] Zéro donnée écrite à la main dans la vue.
- [ ] Une section « ce que le board ne sait PAS montrer » liste les manques constatés —
      c'est ELLE qui instruira (ou pas) le sprint-as-data.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
pnpm ezk:map --list
```

La vue apparaît comme une carte servie par ezk-map, avec son test d'invariant
« données sur disque ≡ données régénérées ».

## Notes

Origine : retour PO du 2026-08-23 sur la carte compilée. À rapprocher de
`features/PLAN.md` (la séquence décidée) et du champ `epic:` (regroupements) —
la vue les affiche, elle ne les remplace pas.

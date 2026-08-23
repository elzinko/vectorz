---
id: "20260823124042842"
title: Vue d'avancement — les fiches positionnées sur le process scrum, sprints passés/en cours/futurs
type: feature
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-23
---

## En clair

Une **deuxième vue**, séparée de la carte du domaine : elle montre *où en est le
travail*. La liste des features triée par priorité et statut, les sprints (passés,
en cours — possiblement plusieurs —, futurs), et un diagramme dynamique du process
scrum où l'on **voit les fiches posées sur les étapes**. Vue macro d'abord, détail
par étape au clic. Grosse évolution, prototype exigeant côté UX/UI.

> Priorité P2 **confirmée** (le PO a délégué le choix, 2026-08-23). Statut `idea` :
> à groomer.
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

**Prérequis révélé — le sprint n'est pas un objet de données.** Le backlog donne déjà
features, priorités, statuts (frontmatter). Mais rien ne dit « la fiche X appartient au
sprint N » : `SPRINT.md` est un scratch éphémère et `docs/sessions/` des archives prose.
Pour la frise, il faut un artefact **sprint versionné** (id, dates, fiches embarquées,
état) — probablement le vrai premier lot de cette fiche.

## Critères d'acceptation

- [ ] Grooming fait : périmètre du lot 1 tranché (sprint-as-data d'abord ?).
- [ ] Un objet sprint versionné existe et est rempli par les rituels existants
      (sans double saisie : les cérémonies l'alimentent).
- [ ] La vue affiche les fiches par priorité/statut, filtrables.
- [ ] Le diagramme du process montre les fiches sur leurs étapes ; macro → détail au clic.
- [ ] Zéro donnée écrite à la main dans la vue (même invariant de test que la carte).

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

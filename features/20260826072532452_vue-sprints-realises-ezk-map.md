---
id: "20260826072532452"
title: Vue « sprints réalisés » dans ezk:map — relire chaque sprint (ou groupe) livré, compilé depuis les archives
type: feature
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-26
---

# Vue « sprints réalisés » dans `ezk:map`

## En clair

Une sous-page de `ezk:map` pour **revoir les sprints déjà faits**. On voit chaque
sprint livré — seul ou groupé avec d'autres — et ce qu'il a produit. La vue **lit
tes archives existantes** ; elle n'invente aucun nouvel « objet sprint ».

## Contexte / Problème

Aujourd'hui, un sprint réalisé est éparpillé. Son récit vit en prose dans
`docs/sessions/`. Les fiches qu'il a livrées sont passées dans `features/done/`.
Le `PLAN.md` en garde des lignes barrées. Pour revoir « ce qu'a fait tel sprint »,
il faut recroiser trois endroits de tête.

Ce besoin **n'est pas neuf** : c'est le lot que la fiche livrée [[20260823124042842]]
avait **volontairement mis de côté**. Cette fiche a livré le board des fiches, mais a
réservé « la frise des sprints passés / en cours / futurs ». Le panel adverse du
2026-08-23 craignait un « 4ᵉ système scrum » (un objet sprint saisi à la main). La
fiche disait : on rouvre **quand l'usage le réclame**. Retour PO du 2026-08-26 — il le
réclame.

## Proposition (esquisse — à groomer)

Une carte `sprints` servie par `pnpm ezk:map sprints`, sur le **patron d'onglet
existant** (`bin/regen-<x>-data.ts` + `bin/ezk-map.ts`, comme `avancement`).

- **Un script compile** la liste des sprints livrés depuis les sources **déjà là** :
  `docs/sessions/` (les comptes-rendus), les fiches `done/` et leur `pr:`, le `PLAN.md`.
- **Vue macro** : la liste des sprints, du plus récent au plus ancien, **groupables**
  (un « groupe de sprints » = un lot de comptes-rendus liés, ex. un product-build).
- **Détail au clic** : ce qu'un sprint a livré (fiches, PR, décisions), avec lien vers
  le fichier source.

**Garde-fou (verdict panel).** On **compile depuis l'existant**, on ne crée pas d'objet
sprint saisi à la main. C'est exactement la frontière que le panel refusait.

## Critères d'acceptation (esquisse — non ready)

- [ ] `pnpm ezk:map sprints` liste les sprints livrés, du plus récent au plus ancien.
- [ ] Chaque entrée cite date · PR/fiches livrées · lien vers le compte-rendu source.
- [ ] Les sprints sont **groupables** (relire un product-build comme un tout).
- [ ] Données **compilées** (invariant de test « disque ≡ régénéré », patron `avancement`).
- [ ] **Zéro** donnée de sprint saisie à la main (respect du verdict panel).

## Comment vérifier

```bash
pnpm ezk:map sprints
```

La page liste l'historique des sprints ; recouper une entrée avec le fichier
`docs/sessions/` correspondant → même contenu, rien d'inventé.

## Notes

- **Suite du lot gated** de [[20260823124042842]] (board livré, frise réservée). Le
  dé-gating est déclenché par le retour PO du 2026-08-26.
- **Voisine** de la vue rétros [[20260826072532537]] — même famille « relire ce qui
  s'est passé », compilé depuis les archives.
- **Product `mega-city`** : c'est là que vivent la map, les scripts `bin/` et les onglets.
- **À trancher au grooming** : ce qu'est précisément un « groupe de sprints » (heuristique
  de regroupement des comptes-rendus), et si la frise temporelle du process (fiches posées
  sur les étapes) fait partie de ce lot ou reste séparée.

---
id: 0064
title: Une seule liste de features pour tout le monorepo (champ `product:`) — la double liste coûte plus qu'elle ne rapporte
type: refactor
priority: P0
epic:
status: todo
ready:
pr:
created: 2026-07-26
---

# 0064 — Une seule liste de features (champ `product:`)

## Contexte / Problème

Le monorepo porte **deux** backlogs : `features/` (racine) et
`products/mega-city/features/` (méthode). La séparation devait isoler deux domaines ;
elle produit surtout du **conflit et de l'outillage de contournement**. Constats sur
pièce, pas en théorie :

1. **Collision d'ids.** Les deux listes numérotent à partir de 0001 : `0059` et `0061`
   existent **des deux côtés**. Au `reconcile` du 2026-07-26, la PR #50 intitulée
   « Moniteur lisible — … (0059, 0061) » était **ambiguë** : il a fallu ouvrir
   `features/done/` pour savoir de quelles fiches on parlait. Un rapprochement
   fiche↔PR censé être mécanique (ADR-0018) redevient du jugement.

2. **De l'outillage payé pour lire à travers la coupure.** `plan:head` (fiche mc-0097,
   livrée par #53 le 2026-07-26) **n'existe que** parce qu'un `PLAN.md` unique doit
   mêler deux listes ; `mc-0098` est déjà son follow-up (descente épic→enfant).
   `PLAN.md` doit préfixer les ids méthode par `mc-`, et `next --ready-only` doit
   « router vers la bonne liste » — trois mécanismes qui n'auraient aucune raison
   d'être avec une liste unique.

3. **Une règle de désambiguïsation à la place d'une structure.** ADR-0017 A13 tranche
   « le backlog le plus proche du cwd ; si l'ambiguïté demeure, **demander** ». Une règle
   qui doit poser une question à l'humain pour ranger une fiche est le symptôme, pas la
   solution.

**Pourquoi ça compte.** Le coût est récurrent et croissant : chaque nouvelle capacité de
backlog (plan, reconcile, épics, `depends:`…) doit être pensée deux fois, ou être
accompagnée de son adaptateur cross-liste. Et la valeur attendue de la séparation n'est
pas au rendez-vous : elle se justifie quand des produits ont des **cycles de release** ou
des **équipes** distincts. Ici : un opérateur, un monorepo, un `PLAN.md`.

## Proposition

Une **liste unique** à la racine (`features/`), et le produit devient une **donnée de la
fiche**, pas une donnée de l'arborescence :

- front-matter `product:` (ex. `vectorz` | `cop1` | `mega-city`) — **obligatoire**, au
  même titre que `type` et `priority` ;
- ids **continus sur l'ensemble** : plus jamais deux fiches avec le même numéro ;
- `regen` groupe/filtre l'index par produit (colonne conditionnelle, comme `Version` et
  `Épic` — ADR-0017 A12) ;
- `PLAN.md` cite des ids nus (fin du préfixe `mc-`).

**À trancher au grooming** (le panel adverse tranchera, cf. Notes) :

- **stratégie de migration** — renuméroter la liste méthode (liens à réécrire, historique
  git des fiches préservé par `git mv`) **ou** décaler en réservant une plage ; l'option
  « garder les ids et distinguer par `product:` » est à écarter si elle laisse subsister
  des doublons de numéro ;
- **sort de `plan:head`/`plan:order`** — `plan:head` devient sans objet ; `plan:order`
  reste utile (il donne la séquence). À retirer proprement, pas à laisser pourrir.

## Critères d'acceptation

- [ ] Il n'existe plus qu'**une** liste de fiches actives ; `products/mega-city/features/`
      ne contient plus de fiche (dossier retiré ou vidé, décision tracée)
- [ ] Chaque fiche porte un `product:` renseigné ; l'index régénéré permet de lire le
      backlog **par produit**
- [ ] **Aucun id en double** sur l'ensemble (actifs + `done/`) — vérifié par le script,
      pas à l'œil (doctrine ADR-0001)
- [ ] `PLAN.md` ne préfixe plus aucun id ; `next --ready-only` ne route plus entre listes
- [ ] `ezk-backlog` mis à jour (ADR-0017 A13 amendé : plus de résolution par cwd) ;
      `plan:head` retiré ou justifié ; ADR (ou avenant ADR-0017) qui acte la décision
- [ ] Les liens inter-fiches existants ne cassent pas (ou sont réécrits) — vérifié
- [ ] Gate locale verte

## Notes / décisions

- **P0 demandée par le PO le 2026-07-26** : « je trouve super relou d'avoir une liste de
  feature par sous-projet… il n'en faudrait qu'une, ce serait plus simple et surtout on
  aurait moins de conflit. Par contre ça oblige à déclarer le produit ».
- **Décision structurante ⇒ panel adverse avant build** (`ezk-architect` + juge), comme
  les autres décisions de structure. La fiche est `todo`, **pas `ready`** : le gate DoR
  passe après le panel, qui doit trancher la stratégie de migration.
- **Coût déjà payé, assumé** : `plan:head` (mc-0097) a été livré le matin même du jour où
  cette fiche est écrite, et deviendra sans objet ; `mc-0098` (son follow-up) tombe avec
  lui. Ce n'est pas une raison de conserver la double liste — c'est une raison de trancher
  vite, avant d'en payer un troisième.
- Fiche volontairement **rangée dans la liste racine** — celle qui survit.

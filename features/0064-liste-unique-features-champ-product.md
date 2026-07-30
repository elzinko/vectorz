---
id: 0064
title: Une seule liste de features pour tout le monorepo (champ `product:`) — la double liste coûte plus qu'elle ne rapporte
type: refactor
priority: P0
product: vectorz
epic:
status: in-progress
ready: 2026-07-30
pr: "#66"
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

2. **De l'outillage payé pour lire à travers la coupure.** `plan:head` (fiche 0097,
   livrée par #53 le 2026-07-26) **n'existe que** parce qu'un `PLAN.md` unique doit
   mêler deux listes ; `0098` est déjà son follow-up (descente épic→enfant).
   `PLAN.md` doit préfixer les ids méthode par `mc-`, et `next --ready-only` doit
   « router vers la bonne liste » — trois mécanismes qui n'auraient aucune raison
   d'être avec une liste unique.

3. **La preuve par l'absurde, faite le jour même.** Cette fiche a été créée sous l'id
   **0064** à la racine — alors que la liste méthode portait déjà un `0064` (« Sprint
   intake — DoR & santé du backlog », P2, 2026-07-16). **La collision s'est produite
   pendant la rédaction de la fiche qui la dénonce**, alors même que son auteur en avait le
   problème en tête et venait d'en documenter deux cas. Ce n'est pas une inattention :
   chaque liste numérote depuis 0001, donc la collision est **structurelle** — elle se
   reproduira à chaque fiche créée des deux côtés, quelle que soit la vigilance.
   *Suite (2026-07-26)* : la collision a été **levée à la main** en renumérotant la fiche
   méthode en [0100](../../../features/0100-sprint-intake-sante-backlog-metriques.md)
   — 8 fichiers touchés, dont **deux ADR** (0016, 0018) et un lien markdown qui aurait
   cassé. Ce correctif **confirme** le constat au lieu de l'annuler : il a fallu un
   arbitrage humain et une passe manuelle pour un simple numéro, et l'id `max+1` du côté
   racine (0065) était lui-même déjà pris côté méthode.

4. **Une règle de désambiguïsation à la place d'une structure.** ADR-0017 A13 tranche
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

- [x] Il n'existe plus qu'**une** liste de fiches actives ; `products/mega-city/features/`
      ne contient plus de fiche (dossier vidé + README stub)
- [x] Chaque fiche porte un `product:` renseigné ; l'index régénéré permet de lire le
      backlog **par produit** (colonne Produit)
- [x] **Aucun id en double** sur l'ensemble (actifs + `done/`) — vérifié par le script
      (warning `regen` + table `MIGRATION-0064-remap.json`)
- [x] `PLAN.md` ne préfixe plus aucun id ; `next` / `plan:head` ne routent plus entre listes
- [x] `ezk-backlog` mis à jour (ADR-0017 A14) ; `plan:head` adapté liste unique
- [x] Les liens inter-fiches existants ne cassent pas (ou sont réécrits) — vérifié
- [x] Gate locale verte

## Notes / décisions

- **P0 demandée par le PO le 2026-07-26** : « je trouve super relou d'avoir une liste de
  feature par sous-projet… il n'en faudrait qu'une, ce serait plus simple et surtout on
  aurait moins de conflit. Par contre ça oblige à déclarer le produit ».
- **2026-07-30 — Groom + ready (soupape PO « avance »).** Décisions de migration tranchées :

  | Question | Décision |
  |---|---|
  | Où vivent les fiches ? | `features/` racine uniquement ; `products/mega-city/features/` vidé (+ README stub) |
  | `product:` | obligatoire : `vectorz` (ex-racine) · `mega-city` (ex-méthode) |
  | Collisions d'ids (62) | ids racine **inchangés** ; ids MC non-collisionnants **inchangés** ; collisions MC → `0106+` (ordre croissant des anciens ids) |
  | `plan:head` | adapté à la liste unique (lit `product:` FM) ; plus de routage cross-liste / préfixe `mc-` |
  | ADR | avenant ADR-0017 A13 (+ note sur 0048 won't-do invalidée par ce pivot) |

  Gate `ready: 2026-07-30` posé après ce cadrage (DoR complète).
- **Décision structurante ⇒ panel adverse avant build** (`ezk-architect` + juge), comme
  les autres décisions de structure. Le 2026-07-30 le PO a autorisé l'avance : panel
  allégé + décisions ci-dessus journalisées (pas de second tour adverse).
- **Coût déjà payé, assumé** : `plan:head` (0097) a été livré le matin même du jour où
  cette fiche est écrite, et deviendra sans objet ; `0098` (son follow-up) tombe avec
  lui. Ce n'est pas une raison de conserver la double liste — c'est une raison de trancher
  vite, avant d'en payer un troisième.
- Fiche volontairement **rangée dans la liste racine** — celle qui survit.
- 2026-07-26 — **collision d'id levée ponctuellement** (0064 → 0100, cf. point 3).
  `0064` et `0100` sont désormais **uniques sur l'ensemble** — mais la mesure faite à
  l'occasion donne l'ampleur du reste : **62 ids sont portés des deux côtés** (tout
  `0001`→`0063` sauf `0048`, actifs + `done/` confondus). Le « 0059 et 0061 » du point 1
  n'était que les deux cas rencontrés, pas le compte. Aucune renumérotation de masse n'a
  été faite : c'est la **stratégie de migration**, à trancher au grooming (le panel), pas
  à improviser. Commande de contrôle :
  `comm -12 <(ids features) <(ids products/mega-city/features)`.

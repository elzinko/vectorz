---
id: "20260826072532622"
title: Revue & validation des fiches dans ezk:map — pouce 👍/👎 (verdict versionné, partagé entre sessions)
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

# Revue & validation des fiches dans `ezk:map` (pouce 👍/👎)

## En clair

Pouvoir **relire les fiches depuis le board** et leur mettre un **pouce haut ou bas**,
pour dire « celle-ci OK / celle-là non ». Le verdict est **partagé** : il est commité dans
le repo et vu par toutes tes sessions. Deux enjeux à cadrer : aujourd'hui la map **ne fait
que lire** (il faut lui apprendre à écrire), et comme **plusieurs sessions tournent en
parallèle**, le verdict doit être rangé de façon à **ne pas créer de conflit**.

> **Groomé le 2026-08-26.** Décision PO : verdict **versionné / partagé** (pas personnel).
> Conséquence directe : rangé dans un **fichier annexe fusion-compatible**, jamais dans le
> frontmatter des fiches. Statut laissé `idea` — le gate `ready` promeut.

## Contexte / Problème

Le board des fiches est déjà là (fiche livrée [[20260823124042842]] :
`pnpm ezk:map avancement`). On **voit** les fiches, on clique pour ouvrir le fichier. Mais
on ne peut **rien marquer** — aucune trace de « je l'ai revue, elle est bonne / à revoir ».

Deux faits techniques constatés :

- **La map est en lecture seule.** `bin/ezk-map.ts` est un serveur `node:http` local
  (`127.0.0.1`) qui ne fait que **servir des pages** (routes GET, aucune écriture). Mettre
  un pouce, c'est la **première écriture** depuis la map — une vraie évolution, pas un
  bouton de plus.
- **Plusieurs sessions écrivent le même repo.** Ranger le verdict dans le frontmatter de
  chaque fiche ferait que deux sessions marquant deux fiches **se marcheraient dessus** au
  merge, en plus d'alourdir le schéma (même raison qui a fait sortir les dates des fiches,
  cf. [[20260823121712716]]).

## Valeur

Passer le backlog **en revue** et **signaler à tous** ce qui est bon ou à revoir. Le
verdict devient un **signal partagé** qui informe le tri et le grooming : une fiche 👎 est
visible par la prochaine session qui la tire, pas enfouie dans une tête.

## Proposition (groomée — verdict versionné, fusion-compatible)

**Le rangement (le cœur de la décision).** Le verdict vit dans un **fichier annexe
versionné**, séparé des fiches (ex. `features/reviews/verdicts.*`). Une **entrée par
fiche** — `id → { verdict: up|down, date }` — le fichier **trié par id**. Deux sessions qui
marquent des fiches **différentes** modifient des lignes différentes : le merge git est
**trivial**. On ne touche **jamais** le frontmatter des fiches.

**L'écriture depuis la map.** `ezk-map.ts` gagne **un seul** point d'écriture : un endpoint
local (POST) qui **upsert** l'entrée du verdict dans le fichier annexe. Le board (HTML
généré) reçoit un **peu de JS** : un clic 👍/👎 envoie la requête. La map n'écrit **que** ce
fichier — elle ne modifie pas les fiches et **ne committe pas toute seule** (le commit
reste un geste, dans le flux normal).

**L'affichage.** Chaque carte du board montre son état — **validée / rejetée / non revue** —
et le board est **filtrable** par état.

## Périmètre

**Dans le lot (visé ready)** : le 👍/👎 par fiche sur le board, l'écriture dans le fichier
annexe versionné, la persistance, l'affichage + filtre de l'état, le format fusion-compatible.

**Hors lot (gated — décision après usage)** :
- **Exploiter** le verdict (filtrer le tirage sur les 👍, workflow de re-groom des 👎,
  alerte) — c'est de l'action, pas de l'affichage.
- **Attribution** multi-utilisateur (qui a voté) et **historique** des changements de verdict.
- **Auto-commit** du verdict depuis la map (laissé au flux normal dans ce lot).

## Décisions laissées à l'étape Archi (avec recommandation)

1. **Emplacement** : fichier annexe versionné **(recommandé)** — **pas** le frontmatter
   (dérive + conflits inter-sessions).
2. **Format fusion-compatible** : une entrée par id, fichier trié, upsert **(recommandé)** —
   pour que des marquages sur fiches distinctes ne produisent aucun conflit.
3. **Écriture** : endpoint POST local sur `ezk-map` + fetch au clic **(recommandé)** ; la map
   écrit le fichier, **le commit reste manuel** (pas d'auto-commit surprise en multi-session).
4. **Cet incrément « la map écrit » mérite sans doute un ADR court** (engage l'architecture
   GET-only → GET+écriture, et la stratégie anti-conflit) — panel/archi au sprint.

## Dépendances

- **Cible** : le board d'avancement [[20260823124042842]] (déjà livré) — c'est lui qui
  affiche les fiches.
- **Touche** `bin/ezk-map.ts` (lui apprendre à écrire). Interne au monorepo.
- **Pas** de dépendance externe (hors monorepo, service, secret) — slot DoR conditionnel
  non requis.
- ⚠️ **Contrainte n°1 (sessions parallèles)** : le fichier de verdicts **doit** être
  fusion-compatible. C'est un critère d'acceptation dur, pas un détail.
- **Voisines** : vues sprints [[20260826072532452]] et rétros [[20260826072532537]] (mêmes
  sous-pages `ezk:map`, mais elles LISENT ; celle-ci ÉCRIT — c'est sa singularité).

## Critères d'acceptation

- [ ] Sur le board (`pnpm ezk:map avancement`), chaque fiche porte un **👍 / 👎** cliquable.
- [ ] Au clic, le verdict est écrit dans un **fichier annexe versionné** — **jamais** dans
      le frontmatter de la fiche.
- [ ] Le verdict **persiste** : relancer la map, il est toujours affiché.
- [ ] L'état **validée / rejetée / non revue** est **visible** et **filtrable** sur le board.
- [ ] Le fichier de verdicts est **fusion-compatible** : deux marquages sur des fiches
      différentes (simulant deux sessions) **ne produisent aucun conflit** de merge.
- [ ] `ezk-map` n'écrit **que** ce fichier ; il **ne modifie pas** les fiches et **ne
      committe pas** tout seul.
- [ ] Gate locale verte (typecheck/lint/tests) + liens markdown OK.

## Comment vérifier

```bash
pnpm ezk:map avancement
```

1. Mettre **👍** sur une fiche, **👎** sur une autre → le fichier annexe contient les deux
   entrées ; arrêter puis relancer la map → les deux verdicts s'affichent.
2. Simuler deux marquages sur des fiches **différentes** (deux branches), puis merger →
   **aucun conflit**.
3. Vérifier qu'**aucune fiche** (frontmatter) n'a été modifiée par le geste.

## Notes

- **Neuf** : rien d'équivalent au backlog.
- **Choix PO 2026-08-26** : verdict **versionné / partagé** (et non personnel/local).
- **Rupture assumée** : première **écriture** depuis la map (GET-only confirmé dans
  `bin/ezk-map.ts`). C'est le morceau le plus lourd des trois sous-pages demandées.
- **Product `mega-city`**.

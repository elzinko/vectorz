---
id: "20260826173221323"
title: Racine de données paramétrable dans les vues — le déblocage de l'ancrage par projet
type: refactor
priority: P2
product: mega-city
version:
epic: "20260813124026215"
status: idea
ready:
pr:
created: 2026-08-26
---

# 20260826173221323 — Racine de données paramétrable dans les vues

## En clair

Aujourd'hui, les vues (board, map, plan, avancement) ne savent regarder **que** les fiches de
vectorz. Le dossier qu'elles lisent est calculé depuis l'emplacement du script, jamais depuis un
projet qu'on leur désigne. Résultat : impossible d'installer la méthode dans un autre projet (muti)
et d'y voir **ses** fiches. On rend cette racine **paramétrable** — un argument ou une variable
d'environnement. C'est le **premier déblocage** de l'ancrage de la méthode par projet.

## Contexte / Problème

- Le **cœur est déjà propre** : `loadFiches(rootDir)` prend la racine **en paramètre**
  (`products/mega-city/src/loaders/fiches.ts:53`).
- Mais les **binaires des vues figent la racine** via `import.meta.url` — donc toujours le dépôt
  vectorz : `bin/regen-avancement.ts:19`, `bin/regen-map-data.ts:20`, `bin/regen-plan-view.ts:20`,
  `bin/ezk-map.ts:33`, `bin/check-fiches.ts:19`. (`bin/plan-head.ts:64` **affiche** le plan mais ne
  régénère PAS l'onglet Plan — c'est `regen-plan-view.ts` qui produit la vue ; retour Codex 2026-08-27.)
- Conséquence : board / map / plan / avancement ne peuvent afficher que les fiches **de vectorz**.
  Un projet hôte ne peut pas voir les siennes — ce qui rend l'install-par-projet inutile côté vues.
- **Verrou indépendant de la grande décision d'archi** (options 0-4 de l'épic
  [20260813124026215](20260813124026215_deploiement-methode-llm-native.md)) : quelle que soit la
  façon d'installer la méthode (copie, store versionné, plugin), les vues devront lire une racine
  **désignée**. D'où le **faible regret** : cette brique est vraie dans tous les scénarios.

## Proposition

- Introduire une **résolution de racine unique et explicite**, même ordre partout :
  **argument CLI** > **variable d'env** (ex. `EZK_ROOT`) > `INIT_CWD` / cwd > **défaut = dépôt
  courant** (comportement actuel préservé).
- L'appliquer aux **5 bins** des vues. Réutiliser le pattern **déjà présent** ailleurs :
  `scripts/regen-backlog.sh` accepte déjà une racine en argument, et la supervision fait
  `resolveProjectPath(arg, INIT_CWD, cwd)` — ne pas réinventer.
- Conserver la **garde anti-traversée** de `ezk-map.ts` (interdit de sortir de la racine), rebasée
  sur la racine désignée.
- **Non-régression stricte** : sans argument ni env, comportement **identique** à aujourd'hui.

## Critères d'acceptation

- [ ] Les bins des vues (`avancement` / `regen-avancement` / `regen-map-data` / **`regen-plan-view`** /
      `ezk-map` / `check-fiches`) acceptent une **racine explicite** (arg > env `EZK_ROOT` > défaut actuel).
      `regen-plan-view` inclus : il régénère **l'onglet Plan** ; `plan-head` ne fait qu'**afficher**, il ne régénère aucune vue.
- [ ] Depuis un autre dossier, désigner un projet hôte fait afficher **les fiches DE ce projet**
      (pas celles de vectorz).
- [ ] **Sans** argument ni env : comportement **inchangé** (test de non-régression).
- [ ] Garde anti-traversée **rebasée** sur la racine désignée (pas de lecture hors racine).
- [ ] Gate locale verte (build / test / lint).

## Comment vérifier

```bash
# la vue lit les fiches d'un AUTRE projet
EZK_ROOT=/chemin/vers/muti pnpm --dir products/mega-city ezk:map
# sans rien : comportement d'avant (fiches de vectorz)
pnpm --dir products/mega-city ezk:map
```

Attendu : avec `EZK_ROOT`, la page montre les fiches du projet désigné ; sans, celles de vectorz,
à l'identique d'aujourd'hui.

## Notes / décisions

- **Fille de l'épic** [20260813124026215](20260813124026215_deploiement-methode-llm-native.md) —
  le **déblocage n°1** identifié en session archi du 2026-08-26.
- **Faible regret** : brique vraie quelle que soit l'option d'ancrage retenue (0-4). Peut être
  tirée **avant** le grooming panel de l'épic sans rien présupposer.
- **Prérequis pratique** du « site de monitoring montre les fiches du projet courant » (fiche rename
  [20260826173005368](20260826173005368_renommer-ezk-map.md)) et de l'install-par-projet.
- **Adjacent mais distinct** de `20260823121712844` (durcir `regen-backlog` — refuser une racine par
  défaut nichée) : ici on **ouvre** une racine désignée aux vues, là on **verrouille** un défaut
  dangereux du backlog.
- **Priorité proposée P2** (ajustable) : **P1** défendable si tu veux attaquer tôt l'isolation muti
  (c'est le déblocage concret). Noms de flags / env (`EZK_ROOT`) à confirmer au grooming.

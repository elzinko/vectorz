---
id: "20260829214131713"
title: "ezk-sessions — vue navigateur de l'état des sessions (live, machine-locale)"
type: feature
priority: P1
product: mega-city
version:
epic:
status: in-progress
ready: 2026-08-29
pr:
created: 2026-08-29
---

# ezk-sessions — vue navigateur (live)

## En clair

La CLI `ezk-sessions state` montre déjà l'état des sessions en texte (livrée, PR #188). Cette
suite ajoute une **vue navigateur** de la même chose : le même tableau (dossiers de travail ·
branches · sessions actives/dormantes · PR · supprimable) et les collisions, mais dans une page
web lisible d'un coup d'œil.

Un piège de conception à respecter : contrairement à l'onglet « avancement » de la map (qui
vient des **fiches committées**, donc figé et partagé), l'état des sessions est **vivant et
propre à ta machine**. Il ne doit **jamais** être committé (sinon churn + faux conflits en
boucle). La vue se calcule **en direct**, à l'ouverture.

## Contexte

- Suite de [[20260825141012293]] (POC `state`, livré PR #188) : le collecteur pur
  `products/mega-city/src/core/sessions-data.ts` et la collecte I/O existent déjà. Cette fiche
  **réutilise le même collecteur** — une seule source de vérité (CLI + vue web).
- La fiche parente proposait « onglet `pnpm ezk:map sessions` sur le modèle avancement ». Or
  `bin/ezk-map.ts` est un **serveur de fichiers statiques** de `diagrams/<slug>/`, et
  l'avancement est un `board.html` **régénéré depuis les fiches committées**. Le modèle ne
  transpose pas aux données live/machine-locales → **décision d'archi requise** (déléguée à
  `ezk-architect`, ADR court) : vue live servie vs onglet map, sans committer d'état vivant.

## Critères d'acceptation (finalisés — ADR-0043)

- [ ] `pnpm --dir products/mega-city ezk:sessions map` ouvre dans le navigateur une page
      rendant l'état **live** : même contenu que `ezk-sessions state` (tableau +
      recommandations + collisions, fichiers chauds mis en avant).
- [ ] La page part de `collect()` + `buildSessionsData` du **même binaire** — aucune
      duplication, `state` et `map` sur la même donnée.
- [ ] Le rendu est une **fonction pure** `renderSessionsHtml(data: SessionsData): string`
      dans `src/core/sessions-html.ts`, sans I/O.
- [ ] La page est **calculée à chaque requête** et servie **en mémoire** : **aucun fichier
      d'état écrit** (pas de `diagrams/sessions/`, rien à gitignorer). Dépôt propre après ouverture.
- [ ] Serveur **local uniquement** (`127.0.0.1`), repli de port sur `EADDRINUSE`, ouverture
      navigateur best-effort, zéro dépendance réseau.
- [ ] `bin/ezk-map.ts` reste **inchangé** ; ses tests (`ezk-map-menu.test.ts`) passent toujours.
- [ ] Tests sur `renderSessionsHtml` : le HTML reflète les lignes du collecteur (dont
      collision et fichier chaud).
- [ ] Sur ce repo multi-worktrees, la page affiche la session courante **active** et signale
      la collision réelle.

## Comment vérifier

```bash
pnpm --dir products/mega-city ezk:sessions map    # ouvre la page live dans le navigateur
pnpm --dir products/mega-city test                # dont renderSessionsHtml
git status                                          # dépôt propre : aucun fichier d'état écrit
```

Sur ce repo multi-worktrees, la page doit afficher la session courante **active** et signaler
la collision réelle (comme la CLI), et le dépôt doit rester **propre** après ouverture (aucun
fichier d'état committé).

## Notes / décisions

- **Réutilise** `src/core/sessions-data.ts` (pur) + la collecte I/O de `bin/ezk-sessions.ts` —
  extraire la collecte dans un module partagé si besoin (single source of truth).
- **Décision d'archi prise** (ADR-0043, 2026-08-29) : sous-commande `ezk:sessions map`, vue
  **calculée en direct + servie en mémoire** (jamais committée). `bin/ezk-map.ts` inchangé
  (option B écartée : casse son métier « fichiers statiques » ; option C regen gitignoré
  écartée : snapshot périmé). Dette assumée : ~40 lignes de patron serveur recopiées d'ezk-map
  (extraction d'un helper partagé différée pour ne pas risquer le fichier partagé).

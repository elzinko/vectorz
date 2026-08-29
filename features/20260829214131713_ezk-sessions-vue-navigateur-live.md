---
id: "20260829214131713"
title: "ezk-sessions — vue navigateur de l'état des sessions (live, machine-locale)"
type: feature
priority: P1
product: mega-city
version:
epic:
status: todo
ready:
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

## Critères d'acceptation (à finaliser selon l'ADR archi)

- [ ] Une commande ouvre dans le navigateur une page rendant l'état **live** des sessions :
      même contenu que `ezk-sessions state` (tableau + encart recommandations + collisions,
      fichiers chauds mis en avant).
- [ ] La page **réutilise le collecteur** de la fiche parente — aucune duplication de logique.
- [ ] **Aucun état de session vivant n'est committé** dans le dépôt (pas de churn, pas de faux
      conflit inter-sessions). Si un fichier est généré, il est **gitignoré** ou éphémère.
- [ ] Serveur **local uniquement** (boucle locale), zéro dépendance réseau, comme `ezk-map`.
- [ ] Découvrable : accessible depuis le menu de la map **ou** via une commande claire
      (`pnpm ezk:sessions map` / `pnpm ezk:map sessions`), selon l'ADR.
- [ ] Tests sur le rendu HTML (le tableau reflète les lignes du collecteur).

## Comment vérifier

```bash
# selon l'ADR : soit
pnpm --dir products/mega-city ezk:sessions map
# soit
pnpm --dir products/mega-city ezk:map sessions
pnpm --dir products/mega-city test
```

Sur ce repo multi-worktrees, la page doit afficher la session courante **active** et signaler
la collision réelle (comme la CLI), et le dépôt doit rester **propre** après ouverture (aucun
fichier d'état committé).

## Notes / décisions

- **Réutilise** `src/core/sessions-data.ts` (pur) + la collecte I/O de `bin/ezk-sessions.ts` —
  extraire la collecte dans un module partagé si besoin (single source of truth).
- **Décision d'archi déléguée à `ezk-architect`** (2026-08-29) : comment servir une vue live
  sans committer d'état, avec ou sans intégration à `bin/ezk-map.ts` (fichier partagé, à ne pas
  casser). L'ADR fixe l'approche et les critères ci-dessus.

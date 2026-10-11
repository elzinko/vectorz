---
id: "20261007154842506"
title: "Brancher les skills/scripts/bins sur le résolveur de chemins (retirer les chemins en dur)"
type: refactor
priority: P2
product: vectorz
milestone: rationalisation
version: v0.9.0
labels: [convention, arborescence]
status: ready
pr:
evidence: none # refactor d'outillage, pas d'UI
created: 2026-10-07
---

# 20261007154842506 — Brancher les skills sur le résolveur de chemins

**En clair.** Fiche 2 du lot V0.9. Une fois le résolveur posé (fiche 1), on remplace les ~39
chemins `docs/…` **codés en dur** dans les 7 skills par un appel au résolveur. Comme le défaut
reste legacy, **le comportement ne change pas** : c'est un refactor vers l'indirection, les tests
restent verts. Après ça, un projet peut changer de disposition par config seule.

**Si tu arrives frais.** Fiche sœur de la [fondation `scrum:`](20261001192624192_regrouper-artefacts-methode-dossier-scrum.md) ;
mécanisme et carte du lot dans [ADR-0066](../products/mega-city/docs/adr/0066-chemins-process-configurables-scrum.md).

## Contexte / Problème

Les chemins de process vivent en dur dans 7 skills (~39 références), sur trois mondes : prose des
`SKILL.md`, scripts bash, bins TS. Tant qu'ils ne lisent pas le résolveur de la fiche 1, aucun
projet ne peut changer de disposition sans éditer les skills partagés.

## Proposition

Remplacer les littéraux `docs/(sessions|retro-notes|captures|journal|pr-evidence)` par l'abstraction :

- **Bins TS** (ex. `ezk-sessions.ts`, `retro-captures.ts`, `sprint-report.ts`) : importer
  `scrumPaths(projectRoot)`.
- **Scripts bash** (`journal-add.sh`, `pr-evidence.sh`, et les scripts d'`ezk-archive` :
  `archive-commit.sh`, `handoff.sh`) : appeler `ezk --root "$ROOT" paths <clé>`.
- **Prose des `SKILL.md`** (les 7) : remplacer le littéral par « le dossier résolu par
  `ezk paths <clé>` », avec le chemin canonique en exemple lisible.

Le défaut reste legacy → **zéro changement de comportement**.

**Ancrage — trois catégories (vérifié le 2026-10-07).** Le grep brut remonte ~36 fichiers ; seules
les deux premières catégories se rebranchent :

1. **Code de production qui ÉCRIT ces chemins → à rebrancher** : `bin/journal-add.sh`,
   `bin/pr-evidence.sh`, `bin/ezk-chef-extract.sh`, `skills/ezk-archive/scripts/{archive-commit.sh,handoff.sh}`,
   `skills/ezk-retro/scripts/note.sh`, `skills/ezk-sprint/scripts/sprint.sh` ; côté TS
   `bin/retro-captures.ts`, `src/core/{retro-capture.ts,runs-data.ts,ezk-chef-suggest.ts}`,
   `src/loaders/runs.ts`, `src/supervision/journal.ts`.
2. **Prose des `SKILL.md` → à pointer vers `ezk paths`** : `ezk-archive`, `ezk-backlog`, `ezk-chef`,
   `ezk-product-build`, `ezk-retro`, `ezk-sprint` (6).
3. **Hors périmètre** : les **fixtures de test** (`**/test-*.sh`, `src/**/__tests__/*.ts`) — elles
   bougent avec la bascule (fiche 3), pas ici ; et les **vérificateurs de liens**
   (`bin/check-links.sh`, `bin/test-links-repo.sh`) qui citent `docs/…` comme **exemples de liens**,
   pas comme chemins d'écriture.

## Critères d'acceptation

- [ ] **Catégorie 1** (code de production bash + TS) : le grep ci-dessous — **hors fixtures de
      test, vérificateurs de liens et `SKILL.md`** — ne renvoie plus aucun chemin exécuté en dur ;
      ces fichiers lisent le résolveur / `ezk paths`.
- [ ] **Catégorie 2** : les 6 `SKILL.md` (ezk-archive, ezk-backlog, ezk-chef, ezk-product-build,
      ezk-retro, ezk-sprint) référencent `ezk paths <clé>` au lieu du littéral (contrôle à l'œil).
- [ ] `pnpm --dir products/mega-city test` et `test:scripts` restent **verts** (défaut legacy,
      comportement inchangé) — les fixtures ne sont **pas** touchées ici (elles bougent en fiche 3).

## Comment vérifier

```bash
cd products/mega-city && pnpm build && pnpm test && pnpm test:scripts
# Catégorie 1 (code de prod) : 0 chemin exécuté en dur, hors fixtures / link-checkers / SKILL.md.
( git grep -nE "docs/(sessions|retro-notes|captures|journal|pr-evidence)" -- \
    products/mega-city/bin products/mega-city/src products/mega-city/skills \
    ':!**/test-*.sh' ':!**/__tests__/**' ':!**/check-links.sh' ':!**/test-links-repo.sh' ':!**/SKILL.md'; rc=$?
  case $rc in 0) echo "KO — résidu de code de prod ci-dessus"; exit 1;; 1) echo "OK — code de prod propre";; *) echo "ERREUR grep (rc=$rc)"; exit 2;; esac )
```

## Notes / décisions

- **Dépend de** la fiche 1 (le résolveur doit exister). Débloque les fiches 3 (bascule vectorz) et
  5 (migration des consommateurs).
- Lot V0.9, lié par `milestone: rationalisation` + `version: V0.9` (pas de chapeau).

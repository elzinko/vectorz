---
id: "20261007154842506"
title: "Brancher les skills/scripts/bins sur le résolveur de chemins (retirer les chemins en dur)"
type: refactor
priority: P2
product: vectorz
milestone: rationalisation
version: V0.9
labels: [convention, arborescence]
status: idea
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

## Critères d'acceptation

- [ ] `git grep -nE "docs/(sessions|retro-notes|captures|journal|pr-evidence)" products/mega-city/skills products/mega-city/bin`
      ne renvoie **plus aucun chemin exécuté** (il peut rester des mentions en prose d'exemple,
      clairement marquées « configurable »).
- [ ] Les 4 scripts bash et les bins TS concernés lisent le résolveur / `ezk paths`.
- [ ] `pnpm --dir products/mega-city test` et `test:scripts` restent **verts** (comportement
      inchangé, défaut legacy).

## Comment vérifier

```bash
cd products/mega-city && pnpm build && pnpm test && pnpm test:scripts
# 0 chemin exécuté en dur (distinguer les 3 codes de retour de grep) :
( git grep -nE "docs/(sessions|retro-notes|captures|journal|pr-evidence)" products/mega-city/skills products/mega-city/bin; rc=$?
  case $rc in 0) echo "à vérifier : occurrences ci-dessus (prose d'exemple ou résidu ?)";; 1) echo "OK — plus aucune occurrence";; *) echo "ERREUR grep";; esac )
```

## Notes / décisions

- **Dépend de** la fiche 1 (le résolveur doit exister). Débloque les fiches 3 (bascule vectorz) et
  5 (migration des consommateurs).
- Lot V0.9, lié par `milestone: rationalisation` + `version: V0.9` (pas de chapeau).

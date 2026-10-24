---
id: "20261024130842250"
title: "Board web : les runs réels — adaptateur projectChantiers → runs/chantiers/timeline/moments"
type: feature
priority: P1
product: cop1
milestone: board
version: "v0.24.0"
labels: [dashboard, board, read-model, supervision, cop1]
status: ready
pr:
evidence: before-after
created: 2026-10-24
split_from: "20261018121537582"
---

# 20261024130842250 — Board web : les runs réels (journal)

**En clair.** Dernière sœur : le board montre les **vrais runs** — runs, chantiers, chronologie et
moments — tirés du journal de supervision via `projectChantiers` (livré en v0.18). Le cœur du travail
est l'**adaptateur** qui transforme la sortie du read-model en données du board, avec trois traductions
de types qui ne se mappent pas 1:1.

**Si tu arrives frais.** `projectChantiers(...)` réunit les journaux des worktrees et rend un
`ChantierProjection[]` (sessions, évènements, cycle de vie). C'est la part **« live »** de
`BoardProject` : `runs`, `chantiers`, `timeline`, `moments`, et les `metrics` live.

## Contexte / Problème

3e des 3 sœurs de [brancher le board sur les vraies données](done/20261018121537582_brancher-board-web-vraies-donnees.md).
La couche de lecture live existe (`projectChantiers`, v0.18) mais **personne ne l'appelle** hors tests.
Il manque l'adaptateur `ChantierProjection[]` / `RunProjection` → `BoardProject` / `BoardChantier` /
`BoardRun`, et les trois mappings de types nommés dans la fiche source.

## Proposition

- **Adaptateur** `projectChantiers` → champs live de `BoardData`, branché dans l'endpoint (sœur 1).
- **Trois mappings de types** (pièges nommés par la fiche source) :
  - cycle de vie read-model `running | at_gate | finished | orphan` → état board `live | gate | done | dead` ;
  - liste d'évènements étiquetés par session → hiérarchie **run → moments → transitions de fiche** (projection à écrire) ;
  - tokens read-model **toujours « absent »** (garde D9 d'ADR-079) → afficher l'**absence honnête**
    (« non mesuré » justifié), jamais un faux chiffre.

## Critères d'acceptation

- [ ] Le board affiche les **vrais runs** : runs, chantiers et chronologie tirés de `projectChantiers`,
      nom de session réel, moments réels — aucun texte inventé.
- [ ] Les **tokens absents** s'affichent comme une absence explicite et justifiée, pas comme un faux chiffre.
- [ ] Les trois mappings de types sont couverts (cycle de vie → état ; évènements → moments → transitions ; tokens honnêtes).
- [ ] Preuve **avant / après** en PR : part runs sur échantillon → part runs sur le vrai journal d'un projet réel.

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/journal-validator test   # projectChantiers vert
pnpm --dir products/cop1/packages/web build && pnpm --dir products/cop1/packages/web test
# Ouvrir le board d'un projet qui a des runs : runs/chantiers/timeline/moments = le vrai journal.
```

## Notes / décisions

- Sœur de [board-web (fiche source)](done/20261018121537582_brancher-board-web-vraies-donnees.md),
  découpée au grooming (2026-10-24). Contrat :
  [ADR-074](../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md) ; read-model et
  garde tokens : [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D8/D9 ;
  `projectChantiers` livré en v0.18 ; maquette validée en v0.17/v0.18.
- **Dépend de la sœur 1** (le tuyau) et de `projectChantiers` (déjà livré).

- **Sprint board (2026-10-24), via ezk-sprint — reportée, non entamée.** L'adaptateur `projectChantiers → runs/chantiers/timeline/moments` et la provenance des runs sont un **build structurel du board** → réservé au **panel/maquette**, pas d'autonomie hands-off.

- **Toujours `ready` (2026-10-24).** La part plan est servie (sœurs 1+2) ; les **runs** restent à brancher.
  L'adaptateur `ChantierProjection → BoardRun/BoardChantier/TimelineEvent` est la seule part manquante ;
  `BoardProject.runs` est volontairement `{}` (aucun faux run). À traiter en même temps : les constats FAIBLES
  de la revue adverse — collision de noms de projets (clé `name`), `git` absent pris pour « aucun tag »
  (versions taguées affichées comme courantes), comparaison de tag `V`/`v` (hors diff, `backlogReader.ts:115/119`).

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
blocked:
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

- [x] Le board affiche les **vrais runs** : runs, chantiers et chronologie (lancement, jalons) tirés de
      `projectChantiers`, nom de session/branche réel — aucun texte inventé. **Moments de fiche différés**
      (le journal ne les émet pas ; ADR-084 G4).
- [x] Les **tokens absents** s'affichent comme une absence explicite et justifiée, pas comme un faux chiffre.
- [x] Mappings couverts : cycle de vie → état ; évènements → fil (lancement/gate) ; tokens honnêtes. La
      branche évènements → **transitions de fiche** reste différée (aucun évènement `fiche.transition`).
- [x] Preuve **avant / après** : vérifiée sur **fixtures** (test) et sur un run keyé réel (ce run,
      `board:v0.24.0`) ; le vrai backlog d'avant G5 reste vide (journaux sans clé) — se remplit avec les
      runs keyés à venir.

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

- **Bloquée sur une donnée amont (constaté 2026-10-24, run board autonome).** Avant de construire
  l'adaptateur, j'ai inspecté les **132 journaux réels** de vectorz (`.supervision/runs/*/events.jsonl`).
  Résultat : `projectChantiers` **ne produirait rien**, parce que la donnée que le board attend n'est pas
  émise :
  - **0 `run.started` sur 55 ne porte la clé `chantier`** que `projectChantiers` exige pour grouper
    (sans elle, `readRun` ignore le journal). Le modèle multi-sessions (ADR-079) n'a donc **aucune donnée**.
  - Les payloads ne portent **ni moments (transitions de fiches), ni verdict, ni jetons, ni durée** —
    exactement les champs riches de `BoardRun`/`Moment`. Types d'évènements présents : `heartbeat`,
    `gate.reached`/`gate.resumed`, `run.started`/`run.finished`, `escalation` ; `run.started.payload` =
    `{method, seat}` seulement.
  - **Conséquence** : construire l'adaptateur maintenant afficherait des runs **vides** sur le vrai
    backlog — invérifiable, exactement le piège « livré ≠ tourne ». Ce n'est **pas** un manque de panel :
    c'est un manque de **donnée source**.
  - **Vrai prérequis** (probablement sa propre fiche, côté émetteur de supervision) : écrire la clé
    `chantier` dans `run.started`, et enrichir les payloads (fiches traitées → moments, verdict, jetons).
    Une fois ces champs émis, l'adaptateur `ChantierProjection → BoardRun/BoardChantier/TimelineEvent`
    devient direct et prouvable. En attendant, `BoardProject.runs` reste `{}` (aucun faux run), ce qui est
    le comportement honnête déjà en place.

- **Précision (2026-10-24) — l'émetteur n'est PAS à créer, il est shippé.** La fiche
  [émetteur clé de chantier](done/20261015133600328_emetteur-cle-de-chantier.md) est livrée : l'émetteur
  SAIT écrire la clé. Le blocage est à l'**usage** : les runs réels de vectorz sont mono-session et n'en
  posent pas (0 clé chantier, même sur les journaux contrat v0.2 du 17/10), et les payloads restent
  minces (ni moments, ni verdict, ni jetons). Donc **aucune fiche émetteur à créer** (ce serait un
  doublon) : il faut que de vrais runs multi-sessions posent la clé ET des payloads enrichis avant que
  l'adaptateur montre du réel. C'est un blocage de **donnée vécue**, pas de code manquant.

- **Livré (2026-10-26, v0.24.0) — vue MINCE, débloquée par [ADR-084 G5](../docs/adr/ADR-084-surface-emission-declaree-et-moments.md).**
  Adaptateur `projectChantiers → runs/chantiers/timeline`
  (`products/cop1/packages/app/src/features/board/chantierAdapter.ts`), branché dans `boardProvider`,
  testé sur fixtures + revue adverse (GO, réserves appliquées : ordre récent-d'abord, badge branche,
  borne de récence). Vue **fidèle mais mince** : les **moments de fiche, jetons et verdicts restent
  absents** tant que le journal ne les émet pas — jamais un faux chiffre. État vide honnête sur les
  journaux d'avant G5. **Enrichissement = fiche future** : émettre `fiche.transition` (moments) + les
  jetons, puis remplir `LiveRun.moments`/`tok`.

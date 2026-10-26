---
id: "20261026095125469"
title: "Les skills émetteurs tamponnent la clé de chantier au run_start"
type: feature
priority: P1
product: mega-city
milestone: board
version: "v0.23.0"
labels: [supervision, emetteur, board, cop1]
status: shipped
pr: "local a117a666"
evidence: none # tuyauterie d'émission ; prouvée par le test-garde + le journal d'un run réel
created: 2026-10-26
---

# 20261026095125469 — Les skills émetteurs tamponnent la clé de chantier au run_start

**En clair.** Aucun run réel ne porte aujourd'hui sa **clé de chantier**, donc le board ne peut
réunir aucun run. L'émetteur **sait** poser cette clé — mais les skills ne lui passent pas les
deux coordonnées dont elle se dérive (`version` + `milestone`). On corrige l'**usage** : chaque
skill qui ouvre un run tamponne `version` + `milestone` à l'ouverture. **Zéro changement de
contrat** — on n'ajoute rien, on utilise ce qui existe déjà.

**Si tu arrives frais.** La *clé de chantier* regroupe les runs d'un même travail (« réaliser
v0.23 ») ; elle se dérive de `version` (+ `milestone`) et se pose dans `run.started`. Le code qui
la dérive (`deriveChantierKey`) est livré depuis v0.18 ; seul l'**appel** ne lui donne pas ses
coordonnées.

## Contexte / Problème

Constat du 2026-10-24 : **0 `run.started` sur 55** ne porte la clé `chantier`. Conséquence :
`projectChantiers` (le read-model qui réunit les journaux par chantier) **ignore tous les
journaux**, et la vue des runs du board n'a rien à afficher. Or tout est câblé côté émetteur :

- `run_start` accepte déjà `version` et `milestone` (optionnels) — `mcp-server.ts`:70-71 ;
- l'émetteur en dérive la clé — `runtime.ts`:124-128, posée dans `run.started` :311-318 ;
- le lecteur la relit — `projectChantier.ts`:67-68.

Le seul trou : les **4 skills émetteurs** (`ezk-sprint`, `ezk-product-build`, `vz-product-builder`,
`supervision-demo`) appellent `run_start` **sans** `version` ni `milestone`. C'est un manque
d'**usage**, pas de code. Tranché par le panel adverse de
[ADR-084](../../docs/adr/ADR-084-surface-emission-declaree-et-moments.md) (décision **G5**, verdict
unanime : seul geste sûr, **zéro contrat**).

## Proposition

Éditer la section « Émission de supervisabilité » de chacun des 4 skills émetteurs pour que leur
consigne `run_start` **transmette `version` + `milestone`** (les coordonnées du travail en cours,
que le skill connaît à l'ouverture). Ajouter un **test-garde déterministe** qui lit les `SKILL.md`
et échoue si l'un d'eux omet ces coordonnées dans sa consigne `run_start`.

## Critères d'acceptation

- [ ] Les 4 skills émetteurs passent **`version` ET `milestone`** à `run_start` dans leur consigne
      d'émission.
- [ ] Un **test déterministe** échoue si l'un de ces skills omet `version`/`milestone` dans sa
      consigne `run_start` (garde contre la régression silencieuse).
- [ ] Un run réel ouvert par l'un de ces skills porte une clé `chantier` **non vide** dans
      `run.started.payload` (vérifiable sur le journal `.supervision/runs/<id>/events.jsonl`).
- [ ] **Zéro changement** au contrat `cop1/supervisability@0.2`, au kit émetteur, au validateur.

## Comment vérifier

```bash
# Le test-garde (déterministe, rejouable, ciblé)
pnpm --dir products/mega-city exec vitest run src/supervision/__tests__/skill-emission-contract.test.ts

# Le journal d'un run réel
#   ouvrir un run via un skill émetteur, puis :
#   jq .payload.chantier .supervision/runs/<id>/events.jsonl | head -1   → une clé non vide
```

## Notes / décisions

- Issue de la décision **G5** de [ADR-084](../../docs/adr/ADR-084-surface-emission-declaree-et-moments.md),
  seul geste validé à l'unanimité par le panel adverse (contrat/gel, QA, PM) — les deux autres
  gestes (arête de graphe `emits`, moment `fiche.transition`) ont été écartés ou différés.
- **Débloque** la fiche
  [board web — les runs réels](../20261024130842250_board-web-runs-reels-adaptateur-projectchantiers.md)
  côté **donnée amont** : une fois la clé posée, l'adaptateur de cette fiche a de quoi réunir. Les
  **moments** de fiche (transitions) restent **différés** (G4 de l'ADR-084, NO-GO en l'état).
- `status: ready` posé sur **direction explicite du PO** (2026-10-26) + l'ADR-084 panel-revu comme
  preuve de DoR ; la concurrence `ezk-pm` n'a pas tourné (agent non bindé dans ce contexte).

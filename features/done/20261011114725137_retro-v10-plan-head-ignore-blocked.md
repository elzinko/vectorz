---
id: "20261011114725137"
title: "Rétro v0.10 : plan-head ignore le drapeau blocked: (plan-lot le respecte)"
type: bug
priority: P2
product: mega-city
milestone:
version:
labels: [retro, backlog, cli]
created: 2026-10-11
status: merged
pr: "merged — fusionnée dans 20261002133125418"
evidence: none
merged_into: "20261002133125418"
---

# 20261011114725137 — Rétro v0.10 : `plan-head` ignore `blocked:`

**En clair.** `ezk backlog plan-head` présente comme « tête tirable » une fiche qui porte pourtant un
drapeau `blocked:` (parquée). `ezk backlog plan-lot`, lui, l'écarte correctement. Deux commandes qui
lisent la même tête ne devraient pas diverger : `plan-head` doit respecter `blocked:` comme `plan-lot`.

**Si tu arrives frais.** `blocked:` est un champ orthogonal (fiche 652) : une fiche peut être
`status: ready` ET `blocked:` (prête sur le papier, mais mise de côté). `plan-head` et `plan-lot`
calculent tous deux la prochaine fiche à tirer.

## Contexte / Problème

Surfacé en construisant la boussole `ezk now` (fiche 20261010091118580, run auto 2026-10-11). En
parquant des fiches de v0.9/v0.10 (version vidée + `blocked:` posé), j'ai constaté :

- `ezk backlog plan-head` → `tête : 20261007154842643 … ready ✓ TIRABLE` alors que cette fiche est
  **parquée** (`blocked:` non vide).
- `ezk backlog plan-lot 1` → écarte la même fiche (la liste sous « tête bloquée / skipped : drapeau
  blocked: »), tête réelle = la fiche suivante non bloquée.

Cause : `crossBacklogHead` (`src/backlog/plan-head.ts`) teste `status` mais **pas** `blocked:` ; sa
carte (`PlanCard`) ne porte même pas le champ. `plan-lot` (`src/backlog/plan-lot.ts`) a l'éligibilité
`status === 'ready' && !done && type !== 'epic' && blocked === ''`. La boussole a dû contourner en
filtrant `blocked:` elle-même.

## Proposition

- Faire porter `blocked` à `PlanCard` et l'exclure de la tête dans `crossBacklogHead` (une fiche
  bloquée descend en « bloquée avant » / signalée, jamais « tirable »), pour aligner `plan-head` sur
  `plan-lot`.
- Retirer le contournement de la boussole (`bin/ezk-now.ts`) une fois `plan-head` corrigé.

## Critères d'acceptation

- [ ] `ezk backlog plan-head` n'affiche jamais une fiche `blocked:` comme « tirable » (test unitaire
      sur `crossBacklogHead` avec une fiche ready+blocked).
- [ ] `plan-head` et `plan-lot` s'accordent sur la tête pour un même état de backlog.
- [ ] La boussole `ezk now` peut retirer son filtre `blocked:` local (il vit alors dans `crossBacklogHead`).

## Comment vérifier

```bash
cd products/mega-city && pnpm test   # nouveau cas crossBacklogHead ready+blocked
```

## Notes / décisions

- Sortie de la **rétro de v0.10** (run auto 2026-10-11, mode `lean`). Le reste du run v0.10 : boussole
  `ezk now` livrée (ADR-0072) ; générateur multi-IDE parqué (ADR + sortie Cursor non vérifiable) ;
  brownfield groomé `ready` mais différé (feature large).

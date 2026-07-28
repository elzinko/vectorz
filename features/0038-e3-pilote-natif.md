---
id: 0038
product: vectorz
title: E3 — Pilote natif complet (stories front-matter, exécuteur générique, gate zéro-BMAD)
type: feature
priority: P2
epic: 0034
status: blocked
pr:
created: 2026-07-16
---

# 0038 — E3 : le pilote tourne sur fiches natives

> **Gates d'entrée** : E1 fait (= fiche 0020 / lot L6 de 0034, post-démo) ; ADR-022
> révisé (L4, fenêtre DP8). Ne pas tirer avant. **Gate de sortie = gate d'entrée d'E4
> (fiche 0039)** : un run pilote de bout en bout vert, zéro lecture BMAD.
>
> **Statut `blocked`** (2026-07-17, review) : les gates d'entrée ci-dessus sont durs et
> non satisfaits (0020 todo, ADR-022 encore WIP) — même traitement que 0017/0018. Repasser
> `todo` quand E1 + ADR-022 révisé sont faits (dé-blocage = tirage possible).

## Contexte / Problème

[ADR-029](../docs/adr/ADR-029-emancipation-bmad-politique-archivage.md) (Accepté) : le
pilote change de carburant — les stories BMAD (`_bmad-output/`) sont remplacées par le
backlog natif `features/*.md`, et l'exécuteur BMAD par un exécuteur générique. Ordre
cardinal : **construire, prouver, puis retirer** — cette fiche construit et prouve ;
la 0039 retire.

## Proposition (les 4 volets d'ADR-029 §E3 + liste de reprise de 0037)

1. **Stories natives** — le Method port lit `features/*.md`. Reprise complète (constat
   [0037](done/0037-arbitrage-double-writer-sprint-status.md), vérifié en code) :
   - *Statuts* : mapping BMAD → front-matter natif (`rewriteStoryStatus`, table à définir).
   - *Écriture en retour* : port promu lecture-écriture — reprendre les **5 sites**
     `persistStatus` (`OrchestratorService.ts:362`, appels l.150/206/284/299/305) + le
     miroir body EA13-S4 ; règle de cohabitation avec l'édition humaine du front-matter.
   - *Épic/ordre* : remplacer `extractStoryKeysForEpic` (`OrchestratorService.ts:387`) —
     les fiches natives n'ont ni épic ni ordre aujourd'hui (champ à concevoir).
   - *Checksum* : `BMADReader.ts` l.13-51 + `computeChecksum` l.81 — équivalent natif ou
     abandon motivé.
   - Mettre à jour l'invariant `sprint-status-coupling-invariant.test.ts` — **les 5
     entrées** de l'allowlist (constat 0037).
2. **Exécuteur générique** — remplace `DefaultBMADCommandRunner` (les commandes par story
   ne viennent plus des workflows `_bmad/`) ; destin de `SupervisorPlaybookLoader`/
   `BmadCycle` tranché (format playbook natif — nouvel en-tête, catalogue de commandes du
   Method port — ou mort du concept).
3. **Gouvernance** — re-cibler le sidecar iamthelaw (`FileSidecarAdapter` →
   `_bmad/_memory/iamthelaw-sidecar/`) vers un emplacement natif (`.cop1/`) ou l'acter
   mort avec le canal BMAD.
4. **Tests** — `orchestrator-e2e` / `orchestrator-real-run` migrent sur fixtures natives.

## Critères d'acceptation

- [ ] Un run pilote de bout en bout (épic-jouet) **vert sur fiches natives, zéro lecture
      BMAD** (`_bmad/`, `_bmad-output/` non consultés — prouvé par trace/allowlist)
- [ ] Les statuts écrits en retour atterrissent dans le front-matter des fiches (et
      cohabitent avec une édition humaine simultanée — cas testé)
- [ ] Tests d'intégration du pilote verts sur fixtures natives
- [ ] Invariant de couplage mis à jour (5 entrées) et vert
- [ ] Gate locale complète (build/tests/lint) + CI verte

## Notes / décisions

Découpage en sous-PRs probable (1 volet = 1 PR max) — l'épic-jouet final est le juge de
paix. La fenêtre transitoire (gel des runs pilote) documentée dans 0037 s'applique
jusqu'au merge du dernier volet. Fiche exigée par ADR-029 action item 3.

---
id: 0039
product: vectorz
title: E4 — Retrait de BMAD (relogement, suppression, purge) + tags d'époque
type: refactor
priority: P2
epic: 0034
status: done
pr:
created: 2026-07-16
---

# 0039 — E4 : retrait de BMAD, l'époque 2 est physique

> **Gate d'entrée (dure, ADR-029)** : la fiche [0038](0038-e3-pilote-natif.md) est
> shippée — un run pilote vert zéro-BMAD existe. **Strictement post-démo** (la
> suppression code casse le build du daemon via la chaîne d'import). Ne pas tirer avant.
>
> **Statut `blocked`** (2026-07-17, review) : dépend de 0038 (elle-même blocked) — gate
> dur non satisfait. Repasser `todo` quand 0038 est shippée.

## Contexte / Problème

[ADR-029](../docs/adr/ADR-029-emancipation-bmad-politique-archivage.md) (Accepté),
Décision 1 §E4. Le remplaçant est construit et prouvé (0038) — on retire. **Trois natures
de travail** (panel ADR-029 : « tri + relogement + purge », PAS une suppression
mécanique) : 59 fichiers TS prod mentionnent BMAD — 25 dans les 4 unités spécifiques,
34 dans des features survivantes à ÉDITER.

## Proposition (ordre impératif)

1. **Tag d'ancrage `epoch-1-bmad-final`** posé avant tout retrait (rollback = revert de
   la PR ou checkout du tag ; les customisations `_bmad/` ne se réinstallent PAS).
2. **(a) Relogement** de l'infra générique hébergée sous `bmad-orchestration/` :
   `AgentSdkSupervisorAdapter`, `DefaultModelTierRouter`, `ClaudeAvailability`,
   `InMemorySupervisorAdapter`, `SupervisorService` (exports `sprint-core/index.ts:240-270`)
   → leur feature de destination, **avant** toute suppression de dossier.
3. **(b) Suppression du BMAD-spécifique** : `bmad-bridge`, `bmad-reader`,
   `bmad-orchestration` (résiduel post-relogement), `DefaultBMADCommandRunner` (~25
   fichiers) ; flag `useBMAD` + agents legacy `PMAgent/QAAgent/DevAgent` (D6 tranché) ;
   garde pré-flight (`orchestrator.ts`) ; surface CLI/env (`init-bmad-bridge`,
   description `--runner`, `COP1_BMAD_ADAPTER`, `COP1_ALLOW_STUB_RUNNER`) ; `_bmad/` et
   `_bmad-output/` du working tree — **après** extraction des décisions vivantes des
   planning-ADRs vers `docs/adr/` (ADR-029 Décision 2 ; ADR-005/009 déjà statués caducs).
4. **(c) Purge des références** : les ~34 fichiers de features survivantes **édités** ;
   docs vivants BMAD-couplés (GETTING_STARTED, running-cop1-on-a-project,
   supervisor-playbook) réécrits ou archivés ; `docs/bmad-version-audit.md` archivé.
5. **Garde-fou permanent** : règle allowlist « **zéro import/chemin `bmad`** dans le
   graphe de prod cop1 », étendue aux fixtures des features survivantes (durcit L2 /
   fiche 0040).
6. **Tag `epoch-2-post-bmad`** au merge + section README « Époques » + bannières ⚫ sur
   les ADR de la séquence rendus caducs.

## Critères d'acceptation

- [x] `grep -riE 'bmad' products/cop1/packages/*/src` (hors tests des features
      survivantes justifiés) = **zéro** ; règle CI allowlist verte et permanente
      (`tools/boundary/no-bmad-in-prod.test.ts`)
- [x] `_bmad/` et `_bmad-output/` absents du working tree ; décisions vivantes extraites
      avant suppression (aucun lien mort dans `docs/`)
- [x] Build + suite complète + CI verts ; le mode moniteur (démo) inchangé
- [x] Tags `epoch-1-bmad-final` (pré-retrait) et `epoch-2-post-bmad` (post-merge E4 code) ;
      README « Époques » à jour ; registre docs/adr/README.md à jour
- [ ] mega-city 0058/0059 : re-scope émission-side confirmé côté mega-city (note déjà
      posée sur 0058) — aucune fiche vivante ne référence les briques supprimées

## Notes / décisions

Fiche exigée par ADR-029 action item 3. Rollback documenté : revert de LA PR (convention
1 PR/lot — si le lot est trop gros, sous-PRs (a)/(b)/(c) dans cet ordre, chacune
revertable). Le supervisor-playbook verrouillé « BMAD 6.0.0-Beta.8 » meurt avec (b) sauf
si E3 a créé son format natif.

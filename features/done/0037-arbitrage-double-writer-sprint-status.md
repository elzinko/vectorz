---
id: 0037
product: vectorz
title: Arbitrage double-writer sprint-status.yaml (porter la décision D7)
type: chore
priority: P1
epic: 0034
status: shipped
pr: "#14"
created: 2026-07-15
---

# 0037 — Arbitrage double-writer sprint-status.yaml

## Contexte / Problème

Amont validé par panel adverse (2026-07-15). La décision **D7** de la fiche
[0034](../0034-mise-a-plat-post-pivot.md) (« double-writer `sprint-status.yaml`, jamais
tranché entre avril et juillet — re-porter en fiche avant archivage du snapshot, L3 »)
n'est portée par **aucune fiche** (vérifié : `ls features | grep -E 'double|sprint-status|writer'`
= rien avant cette fiche). C'est un angle mort structurant : `sprint-status.yaml` est déclaré source-of-truth
(ADR-009) mais deux chemins l'écrivent, et le **mode moniteur nominal** (ADR-028) change
qui devrait le posséder. Bloque l'archivage propre du brownfield-snapshot (§10.5).

**RESCOPÉE 2026-07-15 (ADR-029, relecture PO)** : la direction est tranchée —
`sprint-status.yaml` est un artefact BMAD (ADR-009) qui **meurt en E4** ; la source de
vérité native du statut est le **front-matter des fiches** (convention ezk-backlog). Les
lecteurs runtime basculent en E3. Cette fiche ne porte plus l'arbitrage de destination,
mais la **fenêtre transitoire**.

## Proposition

1. Documenter les deux écrivains concurrents de `sprint-status.yaml`
   (`YamlSprintStatusAdapter` + le second à identifier, fichier:ligne) et les deux
   lecteurs (`YamlSprintStatusAdapter.ts:18`, `OrchestratorService.ts:89`).
2. Documenter la fenêtre transitoire jusqu'à E4 : les writers BMAD restent vivants —
   **gel des runs pilote** sur la fenêtre (le pilote n'est pas utilisé aujourd'hui,
   coût nul) ; mettre à jour l'invariant `sprint-status-coupling-invariant.test.ts` au
   fil de la bascule E3.
3. Lister ce que E3 devra reprendre : mapping statuts BMAD → front-matter, écriture en
   retour (`persistStatus`, 5 sites), sémantique épic/ordre, checksum.

## Constat (2026-07-15 — sprint 3, vérifié en code)

**Correction du présupposé** : `YamlSprintStatusAdapter` n'écrit **pas** (adapter
*interim, read-only* — zéro `writeFile`, en-tête `YamlSprintStatusAdapter.ts:7-13`).
Le « double-writer » du snapshot §10.5 est en réalité :

- **Writer cop1** : `OrchestratorService.persistStatus`
  (`OrchestratorService.ts:362` — `readFile` → `rewriteStoryStatus` → `writeFile`,
  **5 sites d'appel** : l.150, 206, 284, 299, 305) + **miroir du statut dans le corps de
  la story** (EA13-S4, même fonction, `## Status:` du `.md`).
- **Writer BMAD** : les workflows de la méthode elle-même (`_bmad/`) mutent
  `sprint-status.yaml` pendant les commandes (create-story/dev-story…) — externe à
  cop1, actif **uniquement en runs pilote**. (Preuve indirecte : les corps de workflows
  sont gitignorés (`_bmad/bmm/`) ; la mutation est documentée par l'en-tête généré du
  fichier lui-même — « backlog → in-progress … via create-story » — et par
  `workflow-manifest.csv` + snapshot §« owner: BMAD (per ADR-009) ».)

**Lecteurs** (2 runtime) : `YamlSprintStatusAdapter.ts` — chemin
`_bmad-output/implementation-artifacts/sprint-status.yaml` à la l.18, lecture
(`existsSync`/`readFileSync`) l.34-35 — et `OrchestratorService.ts:89-94`
(`readFile` direct + `extractStoryKeysForEpic`, définie l.387).
L'invariant `sprint-status-coupling-invariant.test.ts` tient la fenêtre : son allowlist
(l.17-34) compte **5 entrées**, dont les **2 lecteurs runtime** (l.19 adapter, l.22
OrchestratorService) ; les 3 autres sont le test lui-même (méta, l.24), une référence en
commentaire (`BMADReader.ts`, l.28) et l'homonyme `.cop1/sprint-status.yaml`
(`YamlStatusStore.ts`, l.33 — fichier distinct). E3 devra mettre à jour **les 5**.

**Fenêtre transitoire (jusqu'à E4)** : les deux writers restent vivants. **Gel des runs
pilote acté** sur la fenêtre (coût nul — le pilote n'est pas utilisé ; le mode moniteur
ne touche pas ce fichier). L'invariant test reste le garde-fou et sera mis à jour au fil
de la bascule E3.

**Liste de reprise E3** (complète) :
1. *Statuts* : mapping BMAD → front-matter natif (`rewriteStoryStatus`, table à définir).
2. *Écriture en retour* : port promu lecture-écriture — reprendre les 5 sites
   `persistStatus` + le miroir body EA13-S4 ; règle de cohabitation avec l'édition
   humaine du front-matter.
3. *Épic/ordre* : remplacer `extractStoryKeysForEpic` (`OrchestratorService.ts:387`) —
   les fiches natives n'ont ni épic ni ordre aujourd'hui.
4. *Checksum* : `BMADReader.ts` l.13-51 (Map l.13, enregistrement l.36,
   `verifyIntegrity` l.43-51) + `computeChecksum` l.81 (détection de modification des
   stories) — décider équivalent natif ou abandon motivé.

## Critères d'acceptation

- [x] Writers et lecteurs nommés (fichier:ligne) — cf. Constat (corrections : l'adapter
      est read-only, le 2ᵉ writer est BMAD lui-même ; lignes contre-vérifiées par la
      revue — 2 erreurs de référence corrigées avant merge)
- [x] Fenêtre transitoire documentée (gel des runs pilote acté jusqu'à E4)
- [x] La liste de reprise E3 est complète (statuts, écriture+miroir, épic, checksum)
- [x] Décidé **avant** l'archivage du brownfield-snapshot (L3 non entamé — §10.5 peut
      pointer ici)

## Notes / décisions

D7 tranchée en direction par ADR-029 + relecture PO (2026-07-15) : ni `.cop1/` ni
`.supervision/` — le fichier disparaît avec BMAD, le front-matter des fiches est la
source de vérité native. Cette fiche documente le transitoire ; le lot code vit dans E3
(la fiche E3 devra embarquer la « liste de reprise » ci-dessus telle quelle).

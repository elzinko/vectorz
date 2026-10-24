---
id: "20261013143324505"
title: "Borner le coût du chemin daté de sprint:report (scan transcripts + gh pr list)"
type: refactor
priority: P3
product: mega-city
milestone: qualite
version:
labels: [performance, supervision, github-optionnel]
status: shipped
pr: "local (251b3225)"
evidence: none # commande, pas d'écran
created: 2026-10-13
---

# 20261013143324505 — Le chemin daté de sprint:report doit rester rapide

**En clair.** Quand `sprint:report` trouve une trace de supervision, il **date** le sprint — et là
il scanne tout l'historique : `gh pr list` (réseau) + tous les transcripts. Sur un gros dépôt comme
vectorz (49 runs), ça dépasse 120 s. On veut borner ce coût : ne scanner que la fenêtre utile, et ne
pas appeler `gh` quand `github: false`.

**Si tu arrives frais.** `sprint:report` a deux chemins : « non daté » (rapide, lot seulement) et
« daté » (durée + jetons + KPI). Le chemin daté lit les PR mergées (`gh`) et les transcripts pour
attribuer les jetons sur la fenêtre du sprint.

## Contexte / Problème

Vécu au run v0.12 (2026-10-13). La fiche 20261002230039863 (trace de supervision) a été livrée : le
chemin **non daté** est désormais rapide (0,3 s). Mais le chemin **daté** reste lourd — observé > 120 s
sur vectorz. Deux causes : `listMergedPrs` fait `gh pr list --limit 200` sans borne de fenêtre (et
sans regarder la config `github: false`), et `listUsageEvents` parse tous les transcripts avant de
filtrer sur la fenêtre.

## Proposition

Deux gestes, approche arrêtée (le guichet existe déjà) : (1) lire les PR mergées **uniquement** via le
guichet `ezk forge changes --merged`, qui respecte `github: false` (aucun `gh` en projet coupé) et
borne la fenêtre ; (2) filtrer les transcripts sur la fenêtre du sprint **avant** de les parser, pas
après. Cible : le chemin daté tient sous ~10 s sur vectorz (49 runs).

## Critères d'acceptation

- [ ] En `github: false`, `sprint:report` (chemin daté) ne lance aucun `gh`.
- [ ] Le chemin daté ne scanne pas tout l'historique : coût borné à la fenêtre du sprint.
- [ ] Repère mesuré : le chemin daté tient sous ~10 s sur vectorz (49 runs).

## Comment vérifier

```bash
# Sur vectorz, un sprint daté : time pnpm --dir products/mega-city sprint:report <slug> --out /tmp/x
# En github:false : vérifier qu'aucun gh n'est appelé (gh factice qui journalise).
```

## Notes / décisions

- Origine : rétro du run v0.12 ([capture](../../docs/captures/2026-10-13-retro-run-v012.md)), piste P5.
- Suite de 20261002230039863 (qui a réglé le cas « non daté rapide » ; ici on borne le cas daté).
- Peut réutiliser le guichet `ezk forge changes --merged` (fiche 20261013074251752) pour les PR mergées.
- **Groomée `ready` (2026-10-24), prémisse vérifiée.** Le guichet `ezk forge changes --merged` existe
  (`bin/forge-changes.ts`, ADR-0061) et respecte `github: false` : l'approche est **arrêtée**, ce n'est
  plus un spike. DoR socle vert. Refactor de perf borné, critères mesurables (< ~10 s).

- **AC « github:false → aucun gh » LIVRÉE et testée (2026-10-24).** `GitGhRepoSource.listMergedPrs`
  consulte `githubCapabilities(repoRoot)` (lecteur de config testé) et **court-circuite avant tout appel
  `gh`** quand `pr` est coupé. Un lanceur `gh` injectable (`GhRunner`) rend la garde **prouvable** :
  `repoSource.test.ts` vérifie que `gh` n'est jamais appelé en `github:false` (et qu'il l'est, et parse,
  config allumée). Vectorz étant `github:false`, son propre `sprint:report` ne lance plus `gh`.
- **RESTE (fiche pas close) :** AC « scan borné à la fenêtre » (passer la fenêtre à `listMergedPrs` +
  filtrer les transcripts en amont) et AC « < 10 s sur vectorz » — cette dernière **non mesurable** sans
  un run daté portant un gate de supervision. La fiche reste `ready`, partiellement entamée.

- **AC « scan borné à la fenêtre » LIVRÉE et testée (2026-10-24).** `listMergedPrs(root, sinceIso?)`
  ajoute `--search "merged:>=<jour>"` à la requête `gh` (borne basse = début de la fenêtre du sprint,
  `window.startTs`) au lieu de lister tout l'historique ; le filtre précis par timestamp reste en aval,
  donc **résultats inchangés, requête bornée**. Testé (args `gh` portent la borne). **Il ne reste que
  l'AC « < 10 s sur vectorz »** — une **mesure**, pas un build : elle exige un run daté portant un gate de
  supervision (le `sprint:report` daté), qu'on ne peut pas fabriquer ici. 2 des 3 AC construites et testées ;
  la fiche reste `ready` jusqu'à cette mesure.

- **AC « < 10 s » ATTEINTE — mais le vrai coût n'était PAS celui que la fiche croyait (2026-10-24).**
  En mesurant sur un vrai slug daté (`v07-socle-story1`, 28 s), j'ai profilé chaque composant du chemin
  daté : checkpoints 0,0 s, transcripts 0,3 s, `gh` 0,0 s (vectorz est `github:false`). **Le coût réel —
  26 s — était `listShippedFiches` : un `git log` par fiche livrée, ×313.** La Proposition accusait `gh`
  et les transcripts ; c'était un **mauvais diagnostic**. Vrai fix : **un seul `git log --diff-filter=A
  --name-only -- features/done/`** (parseur pur `parseShipDates`, testé) au lieu de 313 spawns. Mesuré :
  **28 s → 0,7 s**, et rapport **identique** vérifié (shippedFeatures / prRetouches / window / tokens).
  Les 3 AC sont remplies : `github:false` → aucun `gh` ; requête `gh` + transcripts bornés à la fenêtre ;
  chemin daté **< 10 s** (0,7 s). Les optimisations `gh`/transcripts restent (correctes, bornées) même si
  le gros gain venait de `listShippedFiches`. **Fiche prête à shipper.**

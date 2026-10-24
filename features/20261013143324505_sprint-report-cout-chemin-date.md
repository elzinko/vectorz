---
id: "20261013143324505"
title: "Borner le coût du chemin daté de sprint:report (scan transcripts + gh pr list)"
type: refactor
priority: P3
product: mega-city
milestone: qualite
version:
labels: [performance, supervision, github-optionnel]
status: ready
pr:
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

- Origine : rétro du run v0.12 ([capture](../docs/captures/2026-10-13-retro-run-v012.md)), piste P5.
- Suite de 20261002230039863 (qui a réglé le cas « non daté rapide » ; ici on borne le cas daté).
- Peut réutiliser le guichet `ezk forge changes --merged` (fiche 20261013074251752) pour les PR mergées.
- **Groomée `ready` (2026-10-24), prémisse vérifiée.** Le guichet `ezk forge changes --merged` existe
  (`bin/forge-changes.ts`, ADR-0061) et respecte `github: false` : l'approche est **arrêtée**, ce n'est
  plus un spike. DoR socle vert. Refactor de perf borné, critères mesurables (< ~10 s).

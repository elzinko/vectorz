---
id: "20260910231201744"
title: ezk-backlog aggregate — appliquer les fusions/splits (statuts merged/split) + moteur llm
type: feature
priority: P2
product: mega-city
epic:
version:
status: idea
ready:
pr:
created: 2026-09-10
---

# 20260910231201744 — aggregate : appliquer les regroupements + moteur llm

**En clair.** Le cœur « propose » d'`ezk-backlog aggregate` est livré (#223) : il détecte les
fiches qui se recoupent et propose des fusions/splits, mais **il ne les applique pas**. Cette
fiche est le reste : appliquer effectivement une fusion (poser les statuts `merged`/`split` avec
provenance) et ajouter le **moteur `llm`** (jugement par intention, au-delà du clustering mécanique).

**Si tu arrives frais.** `aggregate` = la sous-commande de « grand ménage » du backlog (ADR-0051).
Son moteur `script` (livré) regroupe mécaniquement ; le moteur `llm` (ici) affine par le sens ;
l'« apply » (ici) transforme une proposition acceptée en réalité (statuts + index).

## Contexte / Problème

Le cœur « propose » (moteur `script` + bin lecture seule) est livré via #223 (fiche parente
`20260812104022240`, passée `shipped`). Restent deux morceaux volontairement différés :

1. **Appliquer** une fusion/split acceptée : poser les statuts terminaux `merged`/`split` sur les
   fiches sources + back-références bidirectionnelles, sans perdre l'historique.
2. **Moteur `llm`** : réconcilier les faux positifs/négatifs du `script`, proposer fusions / splits /
   épics par **intention** (ce que les tags ratent).

**Gate dure.** L'apply dépend des statuts `merged`/`split`, portés par la fiche
`20260823121712652` (modèle de statut kanban validé par schéma). Tant qu'ils n'existent pas dans
l'enum `STATUTS`, l'apply ne peut pas être construit → **non tirable avant `20260823121712652`**.
(Le statut terminal `superseded` a ouvert la voie via #221 ; `merged`/`split` complètent la famille.)

## Proposition

- `aggregate` gagne un geste d'**application** (invoqué après arbitrage PO) : sur une fusion acceptée,
  crée/désigne la résultante, passe les sources en `merged` avec back-références, régénère l'index.
  Symétrique pour le split. Le LLM propose, le PO tranche, un script applique (ADR-0001).
- Moteur `llm` : passe sur les clusters du `script`, propose fusions/splits/épics par intention.
- `--mode llm` / `both` deviennent pleinement fonctionnels (aujourd'hui : moteur script seul).

## Critères d'acceptation

- [ ] Appliquer une fusion acceptée pose `merged` sur les sources + back-réf bidirectionnelles ; index régénéré.
- [ ] Symétrique pour le split.
- [ ] Moteur `llm` : propose fusions/splits/épics par intention sur un stock donné.
- [ ] `--mode llm` et `both` produisent un rapport (fin du « non implémenté par ce cœur »).
- [ ] Gate `20260823121712652` satisfaite (statuts `merged`/`split` dans l'enum) avant le build de l'apply.

## Comment vérifier

```bash
pnpm --dir products/mega-city backlog:aggregate --mode both   # script + jugement llm
# après apply d'une fusion : les sources sont `merged`, la résultante les cite (et inversement)
```

## Notes / décisions

- Fiche de suivi ouverte le 2026-09-10 au ship du cœur « propose » (#223 ; option (a) du PO).
- Design de référence : parent `20260812104022240` (§ « Direction PO 2026-08-25 ») + `docs/adr/0051`.
- Gated sur `20260823121712652` pour l'apply ; le moteur `llm` seul n'en dépend pas (buildable une
  fois priorisé). Priorité **P2 provisoire** — à réviser quand `20260823121712652` avance.

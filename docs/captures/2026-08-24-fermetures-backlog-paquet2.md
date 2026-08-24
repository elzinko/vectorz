# Fermetures & regroupements backlog — paquet 2 (2026-08-24)

**En clair.** Deuxième passe du nettoyage (lot 4a) : les **9 grappes de doublons** de
l'inventaire du 2026-08-23, arbitrées « ok tout » par le PO le 2026-08-24. Sept
fermetures (suppression avec trace, précédent paquet 1), un épic créé, des
rattachements — chaque intention survivante est absorbée dans une fiche vivante.

| Fiche fermée | Motif | Absorbée par |
|---|---|---|
| `0133-adr-carte-roles-skills` | la carte des rôles demandée est LIVRÉE : graphe compilé + carte (sa propre note actait déjà method-map) | note dans l'épic carte `…487` |
| `0138-modele-type-interaction-autorite` | le « modèle typé » demandé existe : graph.ts + taxonomie/cérémonies compilées | idem |
| `0172-convention-sot-backlog-md` | sa doctrine (markdown maître, GitHub = export, sync local→externe only) est ACTÉE par ADR-0039 | note dans `0171` |
| `20260812104022234-ezk-marketing-analyst` | les 4 capacités (copy FR/EN, juger le rendu, benchmark, stratégies dev) deviennent des critères de l'orchestrateur | section dans `0156` |
| `0139-garde-fous-integrite-agents` | les invariants 3-couches (contrat de sortie par finding, evidence-gate, juge des rejets) = critères d'éprouvage des skills | section dans `0066` |
| `0179-incubation-skills-retro-opt-in` | le pattern « proposer→éprouver un sprint→mesurer » = le mode d'entrée du banc d'essai | section dans `0066` |
| `20260813171020902-cycle-revue-local` | le cycle de revue local est couvert : règle LOI `adversarial-review-before-merge` + agent ezk-reviewer ; le volet métriques part au rapport qualité | note dans `0058` |

**Créé** : épic `20260824060737115` « Marketing & site » — filles : `0156` (tête),
`0157`, `20260821172716540`.

**Rattachements** : grappe DoR (0100, …231, …243 → épic `20260815080413884`) —
**déjà câblée** avant le paquet (constat, rien à faire) ; `…971` déjà sous l'épic
`…959`. Chaîne env-de-test : `0178` porte désormais `depends: ["0102"]`
(0102 et 0017 restent bloquées — on ne fusionne pas des bloquées).

**Soldées aux paquets précédents** : grappe 3 (articles Skema — 0187 fermée) et
grappe 9 (décomposition — 0092 fermée).

Références : inventaire 2026-08-23 (exploration) · paquet 1 :
`2026-08-23-fermetures-backlog-paquet1.md` · plan « trois étages » · PR #162.

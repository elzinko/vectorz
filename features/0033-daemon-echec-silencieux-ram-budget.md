---
id: 0033
title: Échec silencieux du daemon quand ram_budget_* dépasse la RAM physique
type: bug
priority: P2
status: todo
pr:
created: 2026-07-15
---

# 0033 — Échec silencieux du daemon sur validation `ram_budget_*`

## Contexte / Problème

Découvert au replay de la checklist démo (étape 0 de la fiche 0030, PR #3) :
`resources.ram_budget_night_gb` (défaut 48) et `ram_budget_day_gb` (défaut 20) sont
validés contre la RAM physique de la machine au chargement de la config. Sur une machine
avec moins de RAM que ces défauts, le process daemon (spawn détaché) meurt sans qu'aucun
message n'atteigne le CLI : `cop1 start` attend `waitForHealth` puis timeout après ~30 s,
sans cause. Diagnostic très coûteux pour un nouvel utilisateur — et les DÉFAUTS eux-mêmes
suffisent à déclencher le cas (48 GB > la plupart des postes). Contournement documenté
dans `docs/demo-desktop-checklist.md` §4 (fixer 4/4).

## Proposition

Deux volets, cumulables :
1. **Fail-fast visible** : valider la config (dont le budget RAM) AVANT le spawn détaché,
   ou remonter la cause d'échec du child au CLI — `cop1 start` doit échouer immédiatement
   avec un message explicite (« ram_budget_night_gb=48 > RAM physique 16 GB — ajuster
   cop1.config.yaml »), jamais un timeout muet de 30 s.
2. **Défauts raisonnables** : clamper les défauts à la RAM détectée (ou les abaisser) pour
   que la config vierge démarre sur un poste standard.

## Critères d'acceptation

- [ ] `ram_budget_* > RAM physique` ⇒ `cop1 start` échoue en < 2 s avec un message qui
      nomme le champ fautif, la valeur et la RAM détectée.
- [ ] Une config vierge (défauts) démarre sur une machine de 16 GB.
- [ ] Plus aucun chemin de démarrage ne se termine en timeout sans cause affichée.
- [ ] L'encadré « piège » correspondant de `docs/demo-desktop-checklist.md` est allégé en
      conséquence.

## Notes / décisions

- Origine : replay d'intégration étape 0 (2026-07-15), sprint fiche 0030. Priorité P2
  fixée par le PO au checkpoint du 2026-07-15 (« à traiter avant la prochaine démo »).

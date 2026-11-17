---
id: "20261117165112300"
title: "Le test du portier simule une bibliothèque absente sans déplacer le vrai fichier"
type: bug
priority: P1
product: mega-city
milestone:
version:
labels: [tests, portier]
status: idea
blocked:
pr:
evidence: none # un script de test, aucun écran modifié
created: 2026-11-17
---

# 20261117165112300 — Le test du portier simule une bibliothèque absente sans déplacer le vrai fichier

**En clair.** Le 17 novembre, une gate complète a eu deux suites rouges sans raison dans le code. Un test du
portier d'ezk-sprint venait de déplacer une bibliothèque partagée pour simuler son absence, pendant que la
gate tournait dans le même dossier. Rejouées seules, les deux suites étaient vertes. Le test simule
désormais l'absence sans toucher au vrai fichier : deux exécutions en même temps ne se cassent plus.

**Si tu arrives frais.** Le portier est `skills/ezk-sprint/scripts/check.sh` ; son test,
`skills/ezk-sprint/scripts/test-check-gate.sh`, cas S6, renomme `skills/ezk-archive/scripts/lib-worktree-safety.sh`
le temps d'un appel. Les tests d'ezk-archive lisent la même bibliothèque.

## Proposition

Le portier lit le chemin de sa bibliothèque dans une variable d'environnement, par défaut le chemin actuel. Le
cas S6 pointe cette variable vers un chemin absent, au lieu de renommer le fichier.

## Critères d'acceptation

- [ ] Le cas S6 prouve toujours le repli « lib absente », sans renommer ni déplacer aucun fichier du dépôt.
- [ ] Deux exécutions simultanées de `test:scripts` dans le même worktree ne produisent aucun « lib introuvable ».

## Comment vérifier

```bash
pnpm --dir products/mega-city test:scripts & pnpm --dir products/mega-city test:scripts; wait   # aucune suite rouge
```

## Notes / décisions

- Origine : [rétro légère du sprint 5 du 17 novembre](../docs/captures/2026-11-17-retro-sprint-5-corrections-des-retros.md), proposition P1, et la note de rétro du même jour.
- Priorité P1 tranchée par ezk-pm le 17 novembre, par délégation du PO : le défaut fait passer une gate au rouge sans raison.

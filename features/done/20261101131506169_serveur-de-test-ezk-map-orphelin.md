---
id: "20261101131506169"
title: "Aucun test ne laisse un serveur ezk-map orphelin après la gate"
type: bug
priority: P2
product: mega-city
milestone: qualite
version:
labels: [tests, gate, serveur]
status: superseded
pr: "superseded — le serveur ezk-map est retiré (fiche 20261102123552185)"
evidence: none # outillage et documents, sans écran
created: 2026-11-01
---

## En clair

Après une gate, un serveur de test `ezk-map` peut rester allumé tout seul, dans un dossier
temporaire. Il garde un port, et un autre test qui tire ce port au hasard échoue. Cette fiche trouve
le test qui le laisse fuir et l'arrête proprement.

## Contexte / Problème

Constaté le 2026-11-01 : un process `ezk-map` (parent : launchd ; dossier courant :
`$TMPDIR/ezk-ailleurs-*`, le dossier « ailleurs » de `src/__tests__/project-root-bins.test.ts`)
tenait le port 30072 depuis 1 h 30. Le test du lanceur (`tools/launcher/test-dev-branch.sh`) a tiré
ce port et a échoué une fois (« port attendu 30072, reçu 30073 »). Le process n'a pas été arrêté,
faute de preuve qu'il venait de ce run.

## Valeur

Pour le dev : une gate dont l'échec dépend des restes de la précédente coûte des relances et du
doute. Pour le poste : pas de serveur qui tourne sans propriétaire.

## Proposition

À préciser au grooming.

- Trouver le test qui lance `ezk-map` sans le garantir à l'arrêt, y compris quand un test dépasse son
  délai ou échoue avant la fin.
- L'arrêter dans `afterAll` (ou un `finally`), et tuer son groupe de process.

## Critères d'acceptation

- [ ] Après une gate complète, aucun process `ezk-map` ne tourne dans un dossier temporaire de test.
- [ ] Un test qui échoue en plein milieu ne laisse pas non plus de serveur derrière lui.

## Comment vérifier

```bash
cd products/mega-city && pnpm test; ps -eo pid,command | grep "bin/ezk-map.ts" | grep -v grep
```

## Notes

- Née de la rétro légère du 2026-11-01 (P6 de la rétro), acceptée par le PO le même jour :
  [rétro du run des contrats JSON](../../docs/captures/2026-11-01-retro-run-contrats-json-light.md).
- Priorité P2 par défaut, comme les fiches de la rétro précédente : à ajuster au grooming.
- 2026-11-02 : le serveur `ezk-map` disparaîtra avec [le retrait de la page web de la méthode](../20261102123552185_retirer-la-page-web-de-la-methode.md).
  D'ici là, cette fiche reste utile : la fuite fait encore échouer des tests.

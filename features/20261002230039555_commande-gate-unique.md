---
id: "20261002230039555"
title: Une seule commande « gate » rejoue toute la validation locale
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [sprint]
status: idea
pr:
evidence: none # outillage de validation, pas d'écran
created: 2026-10-03
---

# 20261002230039555 — Une seule commande « gate » rejoue toute la validation locale

**En clair.** La validation locale de mega-city, ce sont deux commandes séparées : les tests
TypeScript et les tests des scripts bash. Après un correctif, on n'en relance souvent qu'une, et
la CI rougit sur l'autre. On veut **une seule commande** qui rejoue les deux et s'arrête au premier
rouge, lancée par `ezk-sprint` et `ezk-codex` avant chaque push.

**Si tu arrives frais.** La *gate locale* est l'ensemble des tests à faire passer sur le poste
avant de pousser. Ici : `pnpm --dir products/mega-city test` (vitest) et
`pnpm --dir products/mega-city test:scripts` (suites bash).

## Contexte / Problème

**Le symptôme, daté.** 2026-10-02, PR #333. Le correctif `efe181f0` lisait le statut d'une fiche
par `awk` dans un script bash. Seul `test:scripts` a été relancé en local. La CI a rougi sur le
test vitest `fiche-read-via-loader-contract`, qui garde une règle du dépôt. Corrigé en `04eefcb2`,
pour une passe CI et une passe Codex de plus.

Aucun script ne rejoue les deux suites, et aucune règle ne cite `test:scripts`. Une consigne
« pense aux deux » n'a pas suffi : c'est structurel.

## Proposition

- Un script pnpm `gate` qui enchaîne `test` puis `test:scripts` et s'arrête au premier rouge.
  La règle `development/use-project-scripts` encourage justement un script de projet.
- `ezk-ci` le porte ; `ezk-sprint` (gate locale, étape 5) et `ezk-codex fix` (avant chaque push
  de correctif) le citent, et lui seul.

## Critères d'acceptation

- [ ] `pnpm --dir products/mega-city gate` lance vitest puis les suites bash, et sort en erreur
      au premier rouge.
- [ ] `ezk-sprint`, `ezk-codex` et `ezk-ci` citent cette commande unique pour la gate locale.

**Mesure de suivi** — sur les 10 prochaines PR, 0 CI rouge sur une suite que la gate couvre.

## Comment vérifier

```bash
pnpm --dir products/mega-city gate
```

- Saboter un test vitest : la commande échoue sans lancer les suites bash.

## Notes / décisions

- Retenue à la rétro du 2026-10-03, unanime :
  [capture](../docs/captures/2026-10-03-retro-session-2026-10-02.md), proposition 1.
- Priorité **P1 proposée** par l'agent, sur délégation du PO : c'est la cause directe d'une CI
  rouge et d'une passe Codex de plus.

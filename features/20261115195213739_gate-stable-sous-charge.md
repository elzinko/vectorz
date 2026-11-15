---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261115195213739"
title: La gate reste verte quand la machine est chargée
type: bug
priority: P2
product: mega-city
milestone:
version:
labels: [gate, tests]
status: idea
pr:
evidence: none # pas d'écran : outillage de tests
created: 2026-11-15
---

# 20261115195213739 — La gate reste verte quand la machine est chargée

**En clair.** La gate de la méthode échoue parfois alors que le code est bon. Quand la machine est
chargée, quelques tests lents dépassent le délai de 5 secondes et tombent. Une gate rouge à tort
fait perdre du temps et pousse à ne plus la croire.

**Si tu arrives frais.** La gate est la validation locale complète de la méthode : `pnpm gate`
depuis `products/mega-city`. Elle enchaîne le contrôle des types, les tests et les tests de scripts.

## Contexte / Problème

Symptôme vu le 2026-11-15, en rejouant la gate sur main pendant que d'autres sessions tournaient.

Les tests qui dépassent le délai touchent la supervision, les captures et les règles de projet. Par
exemple : `capture-apply.test.ts`, `project-rules.test.ts`, `project-rules-io.test.ts`.

Le contournement actuel est manuel : `pnpm exec vitest run --testTimeout=60000`. La note de
passation du 15 nov. le recommande. Personne ne le fait par défaut.

## Proposition

1. Mesurer d'abord : lister les tests qui dépassent 2 secondes sur une machine au repos.
2. Pour chacun, choisir : l'accélérer, l'isoler dans une passe à part, ou lui donner un délai propre.
3. Ne pas monter le délai global : il cacherait un vrai blocage.

## Critères d'acceptation

- [ ] La gate passe 3 fois de suite pendant qu'une autre suite de tests tourne en parallèle.
- [ ] Chaque test au délai élargi le dit dans son fichier, avec la raison.
- [ ] Le délai global de vitest reste à sa valeur par défaut.

## Comment vérifier

```bash
cd products/mega-city && pnpm exec vitest run --reporter=verbose 2>&1 | grep -E "[0-9]{4,}ms"
```

Puis rejouer `pnpm gate` pendant qu'une autre suite tourne.

## Notes / décisions

- Source : note de passation de la session pilote du 2026-11-15.
- Priorité P2 donnée par le PO le 2026-11-15.

---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261115195213739"
title: La gate reste verte quand la machine est chargée
type: bug
priority: P2
product: mega-city
milestone:
version: v0.23.0
labels: [gate, tests]
status: shipped
pr: "local (1f1456d7)"
evidence: none # pas d'écran : outillage de tests
created: 2026-11-15
---

# 20261115195213739 — La gate reste verte quand la machine est chargée

**En clair.** La gate de la méthode échouait parfois alors que le code était bon. Quand la machine est
chargée, quelques tests lents dépassaient le délai de 5 secondes et tombaient. Le délai par défaut
passe à 30 secondes : un test lent mais sain passe, un vrai blocage échoue toujours.

**Si tu arrives frais.** La gate est la validation locale complète de la méthode : `pnpm gate`
depuis `products/mega-city`. Elle enchaîne le contrôle des types, les tests et les tests de scripts.
vitest est l'outil qui lance les tests.

## Contexte / Problème

Symptôme vu le 2026-11-15, en rejouant la gate sur main pendant que d'autres sessions tournaient.

Les tests qui dépassaient le délai touchent la supervision, les captures et les règles de projet. Par
exemple : `capture-apply.test.ts`, `project-rules.test.ts`, `project-rules-io.test.ts`.

Le contournement était manuel : `pnpm exec vitest run --testTimeout=60000`. Personne ne le faisait par
défaut.

## Proposition

Décision du PO, le 2026-11-15 : monter le délai par défaut, plutôt que traiter chaque test.

1. Le délai par défaut de vitest passe de 5 à 30 secondes, dans les deux configs :
   - `products/mega-city/vitest.config.ts`, pour la méthode ;
   - `vitest.config.ts` à la racine, pour cop1 et `tools/`.
2. 30 secondes plutôt que 60 : la marge reste six fois le délai d'origine, et un test bloqué ne fait
   pas attendre une minute.

Écarté pour l'instant : accélérer ou isoler les tests lents un par un. On y revient si la gate
redevient lente.

## Critères d'acceptation

- [x] Les deux configs de vitest fixent `testTimeout` à 30 secondes, avec la raison en commentaire. — prouvé : `grep -n testTimeout vitest.config.ts products/mega-city/vitest.config.ts` (1f1456d7)
- [x] `pnpm gate` passe sur main avec ce réglage. — prouvé : 2403 tests + 48 suites verts le 2026-11-15 et le 2026-11-17

**Mesure de suivi** — sur les 5 prochaines gates jouées sous charge, 0 échec dû au délai.

## Comment vérifier

```bash
grep -n testTimeout vitest.config.ts products/mega-city/vitest.config.ts
cd products/mega-city && pnpm gate
```

## Notes / décisions

- Source : note de passation de la session pilote du 2026-11-15.
- Priorité P2 donnée par le PO le 2026-11-15.
- Délai global plutôt que test par test : décision du PO du 2026-11-15.

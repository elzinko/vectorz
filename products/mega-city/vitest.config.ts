import { defineConfig } from 'vitest/config';

// Config propre au produit mega-city (umbrella Vectorz) : sans elle, `vitest run`
// remonterait jusqu'à la config racine (globs cop1) et ne trouverait aucun test.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // 30 s au lieu des 5 s de vitest : sous charge (plusieurs sessions en parallèle), des tests
    // lents mais sains dépassaient 5 s et rendaient la gate rouge à tort. Un vrai blocage
    // échoue toujours, au bout de 30 s (fiche 20261115195213739).
    testTimeout: 30_000,
  },
});

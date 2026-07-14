import { defineConfig } from 'vitest/config';

// Config propre au produit mega-city (umbrella Vectorz) : sans elle, `vitest run`
// remonterait jusqu'à la config racine (globs cop1) et ne trouverait aucun test.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});

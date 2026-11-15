import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // 30 s au lieu des 5 s de vitest : sous charge, des tests lents mais sains dépassaient
    // le délai (fiche 20261115195213739). Un vrai blocage échoue toujours, au bout de 30 s.
    testTimeout: 30_000,
    include: ['products/cop1/packages/*/src/**/*.test.ts', 'tools/**/*.test.ts'],
    exclude: ['products/cop1/packages/web/**', 'node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['products/cop1/packages/*/src/**/*.ts'],
      exclude: [
        'products/cop1/packages/*/src/**/*.test.ts',
        'products/cop1/packages/*/src/index.ts',
        'products/cop1/packages/web/**',
      ],
    },
  },
});

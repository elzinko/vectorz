import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
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

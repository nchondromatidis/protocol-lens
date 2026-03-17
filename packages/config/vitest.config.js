import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,spec,t}.ts'],
    watch: false,
    // coverage: {
    //   provider: 'v8',
    //   include: ['src/**/*.ts'],
    //   exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    // },
  },
});

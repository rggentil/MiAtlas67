import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            include: ['src/**/*.test.ts'],
            environment: 'node',
          },
        },
        {
          extends: true,
          test: {
            name: 'component',
            include: ['src/**/*.test.tsx'],
            environment: 'jsdom',
            setupFiles: ['./src/test/setup.ts'],
          },
        },
      ],
      coverage: {
        provider: 'v8',
        include: ['src/domain/**/*.ts'],
        exclude: ['src/**/*.test.ts'],
        reporter: ['text', 'html'],
        thresholds: {
          'src/domain/**': { lines: 90, functions: 90, branches: 90, statements: 90 },
        },
      },
    },
  }),
);

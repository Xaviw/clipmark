import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  target: 'node18',
  splitting: false,
  shims: true,
});

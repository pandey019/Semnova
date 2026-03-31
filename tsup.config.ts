import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/stores/memory.ts', 'src/stores/pgvector.ts', 'src/stores/sqlite.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['@huggingface/transformers', 'pg', 'better-sqlite3'],
});

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'agents/index': 'src/agents/index.ts',
    'tools/index': 'src/tools/index.ts',
    'lib/index': 'src/lib/index.ts',
    'constants/index': 'src/constants/index.ts',
    'config/index': 'src/config/index.ts',
  },
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  bundle: true,
  splitting: true,
  dts: false,
  sourcemap: true,
  target: 'es2022',
  external: [
    '@mastra/ai-sdk',
    '@mastra/core',
    '@mastra/duckdb',
    '@mastra/libsql',
    '@mastra/loggers',
    '@mastra/memory',
    '@mastra/observability',
    '@mastra/qdrant',
    '@mastra/rag',
    'hono',
    'zod',
  ],
});

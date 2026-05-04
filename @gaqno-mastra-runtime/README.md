# @gaqno-development/mastra-runtime

Shared Mastra runtime for gaqno: agents, tools, ingestion helpers, request-context middleware, and the `createMastraInstance(opts)` async factory consumed by:

- `gaqno-mastra` (operator-only Studio at `mastra.gaqno.com.br`).
- NestJS service hosts via `@mastra/nestjs` (starting with `gaqno-ai-service` under `/v1/mastra`).

## Why this package exists

Before this package, agents and tools lived inside `gaqno-mastra/src/mastra/*` and a top-level `await new Mastra({...})` initialized the instance. That worked for the standalone Studio runtime but blocked NestJS embedding (no top-level await in the host's `tsc` build) and forced every other service to copy code.

The runtime now lives here, exposes a single async factory, and lets each host pick storage / observability / Studio chat exposure independently.

## Usage

```ts
import { createMastraInstance } from '@gaqno-development/mastra-runtime';

const mastra = await createMastraInstance({
  studio: false,
  observability: 'libsql-only',
});
```

`gaqno-mastra` calls it with `{ studio: true, observability: 'duckdb' }` so the Studio retains the DuckDB observability + chat route. NestJS hosts call it with `{ studio: false }` (default) and mount their own routes through `MastraModule`.

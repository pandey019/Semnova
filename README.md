<p align="center">
  <h1 align="center">Semnova</h1>
  <p align="center">
    Zero API keys. Zero cloud costs. Local AI-powered semantic search for Node.js.
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/semnova"><img src="https://img.shields.io/npm/v/semnova.svg?style=flat-square" alt="NPM Version" /></a>
    <a href="https://github.com/pandey019/Semnova/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/Language-TypeScript-blue.svg?style=flat-square" alt="TypeScript" /></a>
    <a href="https://github.com/pandey019/Semnova/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" /></a>
    <a href="https://github.com/pandey019/Semnova/actions"><img src="https://img.shields.io/github/actions/workflow/status/pandey019/Semnova/test.yml?branch=main&style=flat-square" alt="Build Status" /></a>
  </p>
  <p align="center">
    <a href="#installation">Installation</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#api-reference">API</a> •
    <a href="#storage-adapters">Storage</a> •
    <a href="#examples">Examples</a> •
    <a href="#contributing">Contributing</a>
  </p>
</p>

---

## What Is This?

Semnova lets you add **meaning-based search** to any Node.js app in 3 lines of code. Instead of matching exact keywords, it understands what the user *means*.

```text
"I want to edit videos"  →  finds "AI Video Editor", "Clip Maker Pro", "Descript"
"need help writing emails" →  finds "Grammarly", "Copy.ai", "Jasper"
```

Everything runs **locally on your machine**. No OpenAI. No Anthropic. No API keys. No cloud bills.

---

## Why Use This?

| Problem | Semnova Solution |
|---|---|
| User searches "laptop" but product is listed as "notebook computer" | Understands synonyms — finds it anyway |
| API key costs $20–200/month for embeddings | Free forever — runs a 22MB local model |
| User data sent to third-party AI providers | 100% local — zero data leaves your server |
| Complex vector DB setup (Pinecone, Weaviate) | Works with zero config in-memory, or plug in your existing PostgreSQL/SQLite |
| Python-only ML ecosystem | Pure JavaScript/TypeScript — works anywhere Node.js runs |

---

## Installation

```bash
npm install semnova
```

That's it. The 22MB AI model downloads automatically on first use and caches locally.

### Requirements

- **Node.js 18+** (uses ONNX Runtime)
- **~256MB RAM** available (model loaded in memory)
- **No GPU needed** — runs on CPU
- **No Python needed** — pure JavaScript

---

## Quick Start

```typescript
import { createIndex } from "semnova";

// 1. Create an index
const index = await createIndex();

// 2. Add your data
await index.add([
  { id: "1", text: "AI-powered video editing tool" },
  { id: "2", text: "Email automation platform" },
  { id: "3", text: "Code debugging assistant" },
]);

// 3. Search by meaning
const results = await index.search("I want to edit my videos");
// → [{ id: "1", score: 0.87, item: { id: "1", text: "AI-powered video editing tool" } }]
```

**3 lines. No API key. No config. It just works.**

---

## API Reference

### createIndex(options?)

Creates and returns a new SearchIndex instance.

```typescript
const index = await createIndex({
  model: "Xenova/all-MiniLM-L6-v2",  // HuggingFace model ID
  dimensions: 384,                     // Must match model output
  store: "memory",                     // "memory" | "pgvector" | "sqlite"
  storeOptions: {},                    // Store-specific config
  defaultThreshold: 0.25,             // Min similarity 0–1
  defaultLimit: 10,                    // Max results
  textField: "text",                   // Field to embed
  textExtractor: undefined,            // Custom: (item) => string
  preprocess: undefined,               // Custom: (text) => string
  modelCachePath: undefined,           // Model cache directory
  verbose: false,                      // Debug logging
});
```

### index.add(items, options?)

Add one or more items to the index.

```typescript
// Single item
await index.add({ id: "1", text: "Video editing tool" });

// Batch with progress
await index.add(items, {
  batchSize: 50,
  onProgress: ({ current, total, percent }) => {
    console.log(`${percent}% complete`);
  },
});
```

### index.search(query, options?)

Search by meaning. Returns results sorted by relevance.

```typescript
const results = await index.search("edit my videos", {
  limit: 5,
  threshold: 0.3,
  filter: (item) => item.category === "video",
  includeEmbedding: false,
});

// Result: [{ id: "1", score: 0.87, item: {...} }, ...]
```

### index.remove(ids)

```typescript
await index.remove("1");
await index.remove(["1", "2", "3"]);
```

### index.update(items)

Re-embeds and replaces existing items.

```typescript
await index.update({ id: "1", text: "Updated description here" });
await index.update([item1, item2]);
```

### index.stats()

```typescript
const stats = await index.stats();
// { count: 1304, model: "Xenova/all-MiniLM-L6-v2", dimensions: 384, store: "memory" }
```

### embed(text)

Standalone embedding function.

```typescript
import { embed } from "semnova";

const vector = await embed("Hello world");
// [0.12, -0.45, 0.89, ...] (384 numbers)
```

---

## Storage Adapters

### Memory (Default)

```typescript
const index = await createIndex(); // Memory is the default
```

- **Persistence:** None — data lost on restart
- **Max items:** ~50,000 (search stays under 100ms)
- **Dependencies:** None
- **Best for:** Prototyping, small datasets, serverless functions

### pgvector (PostgreSQL)

```typescript
// Important: Requires `pg` to be installed (npm install pg)
const index = await createIndex({
  store: "pgvector",
  storeOptions: {
    connectionString: "postgresql://user:pass@localhost:5432/mydb",
    tableName: "embeddings",       // default: "semantic_search_embeddings"
    createTable: true,              // auto-create table + extension
    indexType: "hnsw",              // "hnsw" | "ivfflat" | "none"
  },
});
```

### SQLite

```typescript
// Important: Requires `better-sqlite3` to be installed (npm install better-sqlite3)
const index = await createIndex({
  store: "sqlite",
  storeOptions: {
    dbPath: "./search.db",
    tableName: "embeddings",
  },
});
```

---

## Performance

| Operation | Time |
|---|---|
| Model cold start | 2–5 seconds (first call only) |
| Single embedding | 5–50ms (depends on text length) |
| Batch 1,000 items | 10–30 seconds |
| Search (memory, 10K items) | ~5ms |
| Search (pgvector HNSW, 100K items) | <5ms |
| Search (SQLite, 50K items) | ~15ms |

---

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for full instructions on how to contribute.

## License

MIT — Use it however you want. Free forever.

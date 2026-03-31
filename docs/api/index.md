# API Reference

## `createIndex(options?)`

Creates and returns a new `SearchIndex` instance. You can configure the model, dimension counts, preprocessors, and storage adapters.

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

---

## `index.add(items, options?)`

Add one or more items to the index. It will batch process them automatically, embed them, and store them securely.

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

---

## `index.search(query, options?)`

Search by meaning. Returns results sorted natively by cosine similarity.

```typescript
const results = await index.search("edit my videos", {
  limit: 5,
  threshold: 0.3, // Filters out weak matches
  filter: (item) => item.category === "video", // Additional logic filters
  includeEmbedding: false,
});

// Result: [{ id: "1", score: 0.87, item: {...} }, ...]
```

---

## `index.remove(ids)`

Remove embeddings and metadata by their exact ID strings.

```typescript
await index.remove("1");
await index.remove(["1", "2", "3"]);
```

---

## `index.update(items)`

Re-embeds and replaces existing items atomically.

```typescript
await index.update({ id: "1", text: "Updated description here" });
await index.update([item1, item2]);
```

---

## `index.stats()`

Retrieve insights about your current data index.

```typescript
const stats = await index.stats();
// { count: 1304, model: "Xenova/all-MiniLM-L6-v2", dimensions: 384, store: "memory" }
```

---

## `embed(text)`

Standalone embedding function. Useful if you're sending the vector numbers to an entirely different service, or processing embeddings natively.

```typescript
import { embed } from "semnova";

const vector = await embed("Hello world");
// [0.12, -0.45, 0.89, ...] (384 numbers)
```

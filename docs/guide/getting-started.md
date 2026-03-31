# Getting Started

Adding semantic search to your project is incredibly simple.

## Requirements

- **Node.js 18+** (uses the native ONNX Runtime).
- **~256MB RAM** available (the 22MB model gets loaded into memory).
- **No GPU needed** — everything is optimized to run lightning fast on the CPU.
- **No Python needed** — this is pure JavaScript/TypeScript.

## Installation

```bash
npm install semnova
```

That's it. The AI model automatically downloads directly from HuggingFace on its first use and caches itself locally in your file system.

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

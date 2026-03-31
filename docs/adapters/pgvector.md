# PostgreSQL (pgvector) Store

The `pgvector` store connects directly to your SQL database leveraging its native `<=>` cosine distance operations.

### Characteristics

- **Persistence:** Full native relational data.
- **Max items:** Millions with `HNSW` or `IVFFlat` indexes.
- **Dependencies:** Requires `pg` to be installed, and `CREATE EXTENSION vector;` installed on Postgres.
- **Search Speed:** <5ms at 100K+ items natively!
- **Best for:** Production enterprise APIs, long-term deployments, scaling out.

### Usage

```typescript
import { createIndex } from "semnova";

// Important: Requires `pg` to be installed (npm install pg)
const index = await createIndex({
  store: "pgvector",
  storeOptions: {
    connectionString: "postgresql://user:pass@localhost:5432/mydb",
    tableName: "semnova_embeddings",
    createTable: true,              // auto-create table + extension
    indexType: "hnsw",              // "hnsw" | "ivfflat" | "none"
  },
});
```

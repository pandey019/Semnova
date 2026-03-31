# SQLite Store

The `sqlite` store connects directly natively utilizing `better-sqlite3`.

### Characteristics

- **Persistence:** Single physical `.db` file 
- **Max items:** ~500,000 using standard JS brute-force decoding.
- **Dependencies:** Requires `better-sqlite3` to be installed.
- **Best for:** CLI tools, edge deployments, single-machine Electron/Tauri desktop applications.

### Usage

```typescript
import { createIndex } from "semnova";

// Important: Requires `better-sqlite3` to be installed (npm install better-sqlite3)
const index = await createIndex({
  store: "sqlite",
  storeOptions: {
    dbPath: "./search.db",
    tableName: "semnova_embeddings",
  },
});
```

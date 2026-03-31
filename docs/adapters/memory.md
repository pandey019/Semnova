# Memory Store (Default)

The `memory` adapter is the default behavior if no storage adapter is explicitly provided.

### Characteristics

- **Persistence:** None — data lost on restart
- **Max items:** ~50,000 (search stays under 100ms)
- **Dependencies:** None
- **Best for:** Prototyping, small datasets, serverless functions

### Usage

```typescript
import { createIndex } from "semnova";

const index = await createIndex({
    store: "memory" // Automatically defaulted!
}); 
```

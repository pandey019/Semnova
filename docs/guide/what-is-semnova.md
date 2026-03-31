# What is Semnova?

Semnova lets you add **meaning-based search** to any Node.js app in 3 lines of code. 

Instead of matching exact keywords, it understands what the user *means*.

```text
"I want to edit videos"  →  finds "AI Video Editor", "Clip Maker Pro", "Descript"
"need help writing emails" →  finds "Grammarly", "Copy.ai", "Jasper"
```

Everything runs **locally on your machine**. No OpenAI. No Anthropic. No API keys. No cloud bills.

### The Problem

If your user searches for "laptop", but your product is named "notebook computer," standard SQL `LIKE` or basic search engines will return `0 results`. To fix this, developers typically pay for OpenAI's Embedding API and send all their user data out to the cloud, just to store those vectors in an expensive managed Vector database like Pinecone.

### The Solution

Semnova downloads a tiny (22MB) ML model locally on the first run, runs completely offline on your CPU via pure Node.js/JavaScript, embeds the data to high-dimensional meaning-vectors, and scans them inside the memory or native databases like PostgreSQL (`pgvector`) or SQLite (`sqlite-vss`).

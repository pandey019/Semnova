# Examples

Here are some real-world use cases using `semnova`.

### Product Search

```typescript
import { createIndex } from "semnova";

const products = [
  { id: "p1", name: "Wireless Earbuds", desc: "Bluetooth noise-cancelling earbuds" },
  { id: "p2", name: "USB-C Hub", desc: "7-in-1 dock with HDMI and ethernet" },
  { id: "p3", name: "Mechanical Keyboard", desc: "Cherry MX, RGB backlit, full size" },
];

const index = await createIndex({
  textExtractor: (p) => `${p.name}. ${p.desc}`,
});

await index.add(products);

const results = await index.search("I need headphones for airplane travel");
// → p1 (Wireless Earbuds) — score: 0.78
```

### FAQ Bot

```typescript
const faqs = [
  { id: "1", question: "How do I reset my password?", answer: "Go to Settings > Security > Reset Password" },
  { id: "2", question: "What payment methods do you accept?", answer: "Visa, Mastercard, PayPal, and Apple Pay" },
  { id: "3", question: "How do I cancel my subscription?", answer: "Navigate to Billing > Cancel Plan" },
];

const index = await createIndex({
  textExtractor: (faq) => faq.question,
});

await index.add(faqs);

const results = await index.search("forgot my login credentials");
console.log(results[0].item.answer);
// → "Go to Settings > Security > Reset Password"
```

### Next.js API Route

```typescript
// app/api/search/route.ts
import { createIndex } from "semnova";

let index: any = null;

async function getIndex() {
  if (index) return index;
  index = await createIndex({
    store: "pgvector",
    storeOptions: { connectionString: process.env.DATABASE_URL, createTable: true },
  });
  // Load data on first boot
  const products = await db.query("SELECT * FROM products");
  await index.add(products, { batchSize: 100 });
  return index;
}

export async function POST(req: Request) {
  const { query } = await req.json();
  const idx = await getIndex();
  const results = await idx.search(query, { limit: 8 });
  return Response.json({ results });
}
```

import { createIndex } from 'semnova';
import { SqliteStore } from 'semnova/sqlite';
import { PgvectorStore } from 'semnova/pgvector';
import * as dotenv from 'dotenv';

dotenv.config();

const data = [
  { id: '1', text: 'Apple iPhone 15 Pro, titanium design, 256GB' },
  { id: '2', text: 'Samsung Galaxy S24 Ultra, AI features, 512GB storage' },
  { id: '3', text: 'MacBook Pro 14-inch, M3 Max chip, 32GB RAM' },
  { id: '4', text: 'Dell XPS 15, OLED display, Intel Core i9 processor' },
  { id: '5', text: 'Sony PlayStation 5 console with DualSense wireless controller' },
  { id: '6', text: 'Nintendo Switch OLED Model with White Joy-Con' },
  { id: '7', text: 'Ergonomic Office Chair with Lumbar Support' },
  { id: '8', text: 'Standing Desk Converter, adjustable height' }
];

async function testMemory() {
  console.log('\n========================================');
  console.log('--- Testing Memory Store (Default) ---');
  console.log('========================================');
  
  const index = await createIndex();
  await index.add(data);
  
  const query = 'I need a new laptop for programming and coding';
  console.log(`Query: "${query}"`);
  
  const results = await index.search(query, { limit: 2 });
  console.log('\nTop Results:');
  results.forEach(r => {
    console.log(`  - [Score: ${r.score.toFixed(3)}] ${r.item.text}`);
  });
  
  const stats = await index.stats();
  console.log(`\nStats: Memory items: ${stats.count}`);
}

async function testSqlite() {
  console.log('\n========================================');
  console.log('--- Testing SQLite Store ---');
  console.log('========================================');
  
  const index = await createIndex({
    store: 'sqlite',
    storeOptions: { dbPath: './test_example.db', tableName: 'items_table' }
  });
  
  console.log('Adding data to SQLite...');
  await index.add(data);
  
  const query = 'smartphone with artificial intelligence and good storage';
  console.log(`Query: "${query}"`);
  
  const results = await index.search(query, { limit: 2 });
  console.log('\nTop Results:');
  results.forEach(r => {
    console.log(`  - [Score: ${r.score.toFixed(3)}] ${r.item.text}`);
  });
  
  const stats = await index.stats();
  console.log(`\nStats: SQLite rows: ${stats.count}, DB: ${stats.dbPath}`);
}

async function testPgvector() {
  console.log('\n========================================');
  console.log('--- Testing PostgreSQL (pgvector) Store ---');
  console.log('========================================');
  
  const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres';
  
  try {
    const index = await createIndex({
      store: 'pgvector',
      storeOptions: { 
        connectionString: dbUrl,
        tableName: 'example_semantic_items',
        createTable: true,
        indexType: 'hnsw' // Creating index automatically
      }
    });
    
    console.log(`Connecting to Postgres and seeding data...`);
    await index.add(data);
    
    const query = 'video game console with controllers';
    console.log(`Query: "${query}"`);
    
    const results = await index.search(query, { limit: 2 });
    console.log('\nTop Results:');
    results.forEach(r => {
      console.log(`  - [Score: ${r.score.toFixed(3)}] ${r.item.text}`);
    });
    
    const stats = await index.stats();
    console.log(`\nStats: pgvector rows: ${stats.count}, Table Size: ${stats.tableSize}`);
    
    // Cleanup table so next run is clean
    await index.clear();
    await index.dispose();
  } catch (e: any) {
    console.warn(`\n[!] Skipping pgvector test: ${e.message}`);
    console.log('    (Ensure PostgreSQL is running locally with the pgvector extension installed)');
  }
}

async function runAll() {
  try {
    await testMemory();
    await testSqlite();
    await testPgvector();
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('\nError running tests:', error);
  }
}

runAll();

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PgvectorStore } from '../../src/stores/pgvector';
import { Pool } from 'pg';

vi.mock('pg', () => {
  const mClient = {
    query: vi.fn(),
    release: vi.fn(),
  };
  const mPool = {
    connect: vi.fn(() => Promise.resolve(mClient)),
    query: vi.fn(),
    end: vi.fn(),
  };
  return { 
    Pool: class { 
      constructor() { return mPool; }
    }
  };
});

describe('PgvectorStore', () => {
  let store: PgvectorStore;
  let pool: any;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new PgvectorStore({
      tableName: 'embeddings_test',
      schema: 'public',
      createTable: true,
      indexType: 'hnsw'
    });
    pool = new Pool(); // Get the mock instance
  });

  it('initializes table and extension', async () => {
    await store.init(384);
    const mClient = await pool.connect();
    expect(mClient.query).toHaveBeenCalledWith(expect.stringContaining('CREATE EXTENSION IF NOT EXISTS vector'));
    expect(mClient.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS "public"."embeddings_test"'));
    expect(mClient.query).toHaveBeenCalledWith(expect.stringContaining('USING hnsw'));
  });

  it('adds an entry executing INSERT OR UPDATE query', async () => {
    await store.add({ id: '1', embedding: [1, 0], item: { name: 'A' } });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "public"."embeddings_test"'),
      ['1', '[1,0]', '{"name":"A"}']
    );
  });

  it('searches with cosine distance', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: '1', score: 0.9, metadata: { name: 'A' }, embedding: '[1,0]' }
      ]
    });

    const results = await store.search([1, 0], 5, 0.5);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY embedding <=> $1'),
      ['[1,0]', 0.5, 5]
    );
    expect(results).toHaveLength(1);
    expect(results[0].item.name).toBe('A');
    expect(results[0].embedding).toEqual([1, 0]);
  });
});

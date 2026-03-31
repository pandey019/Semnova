import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SqliteStore } from '../../src/stores/sqlite';
import * as fs from 'fs';

describe('SqliteStore', () => {
  let store: SqliteStore;
  const dbPath = './test-sqlite.db';

  beforeEach(async () => {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    store = new SqliteStore({ dbPath, tableName: 'test_embeddings' });
    await store.init(2);
  });

  afterEach(async () => {
    await store.dispose();
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch (e) {
        // ignore
      }
    }
  });

  it('adds and searches by dot product similarity', async () => {
    await store.add({ id: '1', embedding: [1, 0], item: { name: 'A' } });
    await store.add({ id: '2', embedding: [0, 1], item: { name: 'B' } });
    await store.add({ id: '3', embedding: [0.707, 0.707], item: { name: 'C' } });

    const results = await store.search([1, 0], 2, 0.5);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('1');
    expect(results[1].id).toBe('3');
  });

  it('removes an item', async () => {
    await store.add({ id: '1', embedding: [1, 0], item: { name: 'A' } });
    expect(await store.count()).toBe(1);
    await store.remove('1');
    expect(await store.count()).toBe(0);
  });
  
  it('adds batch and clears', async () => {
    await store.addBatch([
      { id: '1', embedding: [1, 0], item: { name: 'A' } },
      { id: '2', embedding: [0, 1], item: { name: 'B' } }
    ]);
    expect(await store.has('1')).toBe(true);
    await store.clear();
    expect(await store.count()).toBe(0);
  });
});

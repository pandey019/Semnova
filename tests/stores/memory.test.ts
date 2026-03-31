import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from '../../src/stores/memory';
import { StoreEntry } from '../../src/stores/base';

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(async () => {
    store = new MemoryStore();
    await store.init(2);
  });

  it('adds and searches', async () => {
    await store.add({ id: '1', embedding: [1, 0], item: { name: 'A' } });
    await store.add({ id: '2', embedding: [0, 1], item: { name: 'B' } });
    await store.add({ id: '3', embedding: [0.707, 0.707], item: { name: 'C' } });

    const results = await store.search([1, 0], 2, 0.5);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('1');
    expect(results[1].id).toBe('3');
  });

  it('handles batch add and batch update', async () => {
    await store.addBatch([
      { id: '1', embedding: [1, 0], item: { name: 'A' } },
      { id: '2', embedding: [0, 1], item: { name: 'B' } }
    ]);
    expect(await store.count()).toBe(2);

    await store.updateBatch([
      { id: '1', embedding: [0, 1], item: { name: 'A2' } }
    ]);
    const results = await store.search([0, 1], 1, 0.9);
    expect(results[0].id).toBe('1'); // Because 1 was updated to [0,1] which matches query [0,1]
    expect(results[0].item.name).toBe('A2');
  });
});

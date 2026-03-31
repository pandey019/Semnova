import { VectorStore, StoreEntry } from './base';
import { dotProduct } from '../similarity';
import { DimensionMismatchError, ItemNotFoundError } from '../errors';

export class MemoryStore<T = any> implements VectorStore<T> {
  private map: Map<string, StoreEntry<T>> = new Map();
  private dimensions: number = 0;

  async init(dimensions: number): Promise<void> {
    this.dimensions = dimensions;
  }

  async add(entry: StoreEntry<T>): Promise<void> {
    if (this.dimensions && entry.embedding.length !== this.dimensions) {
      throw new DimensionMismatchError(`Vector dimension mismatch: expected ${this.dimensions}, got ${entry.embedding.length}`);
    }
    this.map.set(entry.id, entry);
  }

  async addBatch(entries: StoreEntry<T>[]): Promise<void> {
    for (const entry of entries) {
      if (this.dimensions && entry.embedding.length !== this.dimensions) {
        throw new DimensionMismatchError(`Vector dimension mismatch: expected ${this.dimensions}, got ${entry.embedding.length}`);
      }
      this.map.set(entry.id, entry);
    }
  }

  async search(queryEmbedding: number[], limit: number, threshold: number): Promise<{ id: string; score: number; item: T; embedding?: number[] }[]> {
    if (this.dimensions && queryEmbedding.length !== this.dimensions) {
      throw new DimensionMismatchError(`Query dimension mismatch: expected ${this.dimensions}, got ${queryEmbedding.length}`);
    }
    
    const results: { id: string; score: number; item: T; embedding: number[] }[] = [];
    
    for (const entry of this.map.values()) {
      // Vectors are L2 normalized, so dotProduct is equal to cosineSimilarity and faster
      const score = dotProduct(queryEmbedding, entry.embedding);
      if (score >= threshold) {
        results.push({
          id: entry.id,
          score,
          item: entry.item,
          embedding: entry.embedding
        });
      }
    }
    
    // Sort descending by score
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit);
  }

  async remove(id: string | string[]): Promise<void> {
    const ids = Array.isArray(id) ? id : [id];
    for (const i of ids) {
      this.map.delete(i);
    }
  }

  async update(entry: StoreEntry<T>): Promise<void> {
    if (!this.map.has(entry.id)) {
      throw new ItemNotFoundError(`Item with ID ${entry.id} not found.`);
    }
    await this.add(entry);
  }

  async updateBatch(entries: StoreEntry<T>[]): Promise<void> {
    for (const entry of entries) {
      if (!this.map.has(entry.id)) {
        throw new ItemNotFoundError(`Item with ID ${entry.id} not found.`);
      }
    }
    await this.addBatch(entries);
  }

  async has(id: string): Promise<boolean> {
    return this.map.has(id);
  }

  async count(): Promise<number> {
    return this.map.size;
  }

  async clear(): Promise<void> {
    this.map.clear();
  }

  async stats(): Promise<Record<string, any>> {
    // Estimate memory usage roughly (vectors * 8 bytes + overhead)
    const memoryBytes = this.map.size * this.dimensions * 8;
    return {
      memoryUsageBytesApprox: memoryBytes,
    };
  }

  async dispose(): Promise<void> {
    this.map.clear();
  }

  async export(): Promise<any> {
    const entries = Array.from(this.map.values());
    return {
      dimensions: this.dimensions,
      entries
    };
  }

  async import(data: any): Promise<void> {
    if (data.dimensions) this.dimensions = data.dimensions;
    if (data.entries && Array.isArray(data.entries)) {
      this.map.clear();
      for (const entry of data.entries) {
        this.map.set(entry.id, entry);
      }
    }
  }
}

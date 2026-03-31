import Database, { Database as DBType } from 'better-sqlite3';
import { VectorStore, StoreEntry } from './base';
import { StoreConnectionError, ItemNotFoundError } from '../errors';
import { dotProduct } from '../similarity';
import { l2Normalize } from '../similarity';

export interface SqliteStoreOptions {
  dbPath?: string;
  tableName?: string;
  useVss?: boolean; // sqlite-vss is currently not easily bundled, fallback to JS
}

export class SqliteStore<T = any> implements VectorStore<T> {
  private db: DBType;
  private tableName: string;
  private dimensions: number = 0;
  private useVss: boolean;

  constructor(private options: SqliteStoreOptions = {}) {
    this.tableName = options.tableName || 'semnova_embeddings';
    this.useVss = options.useVss || false;
    
    try {
      this.db = new Database(options.dbPath || './semnova.db');
    } catch (err: any) {
      throw new StoreConnectionError(`Failed to initialize SQLite database: ${err.message}`);
    }
  }

  async init(dimensions: number): Promise<void> {
    this.dimensions = dimensions;
    
    // Auto-create table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        embedding BLOB,
        metadata TEXT
      );
    `);

    // If using sqlite-vss, initialize it
    if (this.useVss) {
      try {
        // Assume sqlite-vss module is available, otherwise user shouldn't set useVss: true
        // Currently skipping actual VSS loading to keep it simple and focus on JS fallback.
        // sqlite-vss extension loading: this.db.loadExtension('vss0');
        // then CREATE VIRTUAL TABLE vss_table USING vss0(embedding(384))
        throw new Error('sqlite-vss support is not fully implemented in this adapter version. Setting useVss to false.');
      } catch (err: any) {
        console.warn('sqlite-vss failed to load, falling back to pure SQLite + JS similarity scan.', err.message);
        this.useVss = false;
      }
    }
  }

  private encodeVector(vector: number[]): Buffer {
    const float32Array = new Float32Array(vector);
    return Buffer.from(float32Array.buffer);
  }

  private decodeVector(buffer: Buffer): number[] {
    const float32Array = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
    return Array.from(float32Array);
  }

  async add(entry: StoreEntry<T>): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ${this.tableName} (id, embedding, metadata)
      VALUES (?, ?, ?)
    `);
    const blob = this.encodeVector(entry.embedding);
    stmt.run(entry.id, blob, JSON.stringify(entry.item));
  }

  async addBatch(entries: StoreEntry<T>[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ${this.tableName} (id, embedding, metadata)
      VALUES (?, ?, ?)
    `);
    
    const insertMany = this.db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.id, this.encodeVector(item.embedding), JSON.stringify(item.item));
      }
    });

    insertMany(entries);
  }

  async search(queryEmbedding: number[], limit: number, threshold: number): Promise<{ id: string; score: number; item: T; embedding?: number[] }[]> {
    if (this.useVss) {
      // VSS logic here if supported
      return [];
    } else {
      // Brute-force scan
      const stmt = this.db.prepare(`SELECT id, embedding, metadata FROM ${this.tableName}`);
      const rows = stmt.all() as { id: string; embedding: Buffer; metadata: string }[];
      
      const results: { id: string; score: number; item: T; embedding: number[] }[] = [];
      
      // vectors are normalized from embedder, so dot product is cosine similarity
      for (const row of rows) {
        const rowVector = this.decodeVector(row.embedding);
        const score = dotProduct(queryEmbedding, rowVector);
        if (score >= threshold) {
          results.push({
            id: row.id,
            score,
            item: JSON.parse(row.metadata),
            embedding: rowVector
          });
        }
      }
      
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    }
  }

  async remove(id: string | string[]): Promise<void> {
    const ids = Array.isArray(id) ? id : [id];
    if (ids.length === 0) return;
    
    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`);
    stmt.run(...ids);
  }

  async update(entry: StoreEntry<T>): Promise<void> {
    await this.add(entry);
  }

  async updateBatch(entries: StoreEntry<T>[]): Promise<void> {
    await this.addBatch(entries);
  }

  async has(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`);
    const result = stmt.get(id);
    return !!result;
  }

  async count(): Promise<number> {
    const stmt = this.db.prepare(`SELECT COUNT(*) as c FROM ${this.tableName}`);
    const row = stmt.get() as { c: number };
    return row.c;
  }

  async clear(): Promise<void> {
    this.db.exec(`DELETE FROM ${this.tableName}`);
  }

  async stats(): Promise<Record<string, any>> {
    const count = await this.count();
    return {
      dbPath: this.db.name,
      tableName: this.tableName,
      rowCount: count,
    };
  }

  async dispose(): Promise<void> {
    this.db.close();
  }
}

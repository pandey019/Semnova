import { Pool, PoolConfig } from 'pg';
import { VectorStore, StoreEntry } from './base';
import { StoreConnectionError } from '../errors';

export interface PgvectorStoreOptions {
  connectionString?: string;
  tableName?: string;
  createTable?: boolean;
  indexType?: 'hnsw' | 'ivfflat' | 'none';
  schema?: string;
  poolConfig?: PoolConfig;
}

export class PgvectorStore<T = any> implements VectorStore<T> {
  private pool: Pool;
  private tableName: string;
  private schema: string;
  private dimensions: number = 0;
  private indexType: string;

  constructor(private options: PgvectorStoreOptions = {}) {
    this.tableName = options.tableName || 'semantic_search_embeddings';
    this.schema = options.schema || 'public';
    this.indexType = options.indexType || 'none';

    const poolConfig: PoolConfig = options.poolConfig || {};
    if (options.connectionString) {
      poolConfig.connectionString = options.connectionString;
    }

    try {
      this.pool = new Pool(poolConfig);
    } catch (err: any) {
      throw new StoreConnectionError(`Failed to initialize PostgreSQL pool: ${err.message}`);
    }
  }

  private get fullTableName(): string {
    return `"${this.schema}"."${this.tableName}"`;
  }

  async init(dimensions: number): Promise<void> {
    this.dimensions = dimensions;
    if (this.options.createTable) {
      const client = await this.pool.connect();
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
        if (this.schema !== 'public') {
          await client.query(`CREATE SCHEMA IF NOT EXISTS "${this.schema}";`);
        }
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${this.fullTableName} (
            id TEXT PRIMARY KEY,
            embedding vector(${dimensions}),
            metadata JSONB
          );
        `);

        if (this.indexType === 'hnsw') {
          await client.query(`
            CREATE INDEX IF NOT EXISTS ${this.tableName}_embedding_hnsw_idx 
            ON ${this.fullTableName} 
            USING hnsw (embedding vector_cosine_ops);
          `);
        } else if (this.indexType === 'ivfflat') {
          await client.query(`
            CREATE INDEX IF NOT EXISTS ${this.tableName}_embedding_ivfflat_idx 
            ON ${this.fullTableName} 
            USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
          `);
        }
      } catch (err: any) {
        throw new StoreConnectionError(`Failed to create table/index: ${err.message}`);
      } finally {
        client.release();
      }
    }
  }

  async add(entry: StoreEntry<T>): Promise<void> {
    const query = `
      INSERT INTO ${this.fullTableName} (id, embedding, metadata)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET 
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata;
    `;
    const vectorString = `[${entry.embedding.join(',')}]`;
    await this.pool.query(query, [entry.id, vectorString, JSON.stringify(entry.item)]);
  }

  async addBatch(entries: StoreEntry<T>[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const query = `
        INSERT INTO ${this.fullTableName} (id, embedding, metadata)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET 
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata;
      `;
      for (const entry of entries) {
        const vectorString = `[${entry.embedding.join(',')}]`;
        await client.query(query, [entry.id, vectorString, JSON.stringify(entry.item)]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async search(queryEmbedding: number[], limit: number, threshold: number): Promise<{ id: string; score: number; item: T; embedding?: number[] }[]> {
    const vectorString = `[${queryEmbedding.join(',')}]`;
    
    // In pgvector, the `<=>` operator computes cosine distance. 
    // Cosine similarity = 1 - cosine distance.
    const query = `
      SELECT id, metadata, 1 - (embedding <=> $1) AS score, embedding::text
      FROM ${this.fullTableName}
      WHERE 1 - (embedding <=> $1) >= $2
      ORDER BY embedding <=> $1
      LIMIT $3;
    `;
    const result = await this.pool.query(query, [vectorString, threshold, limit]);
    
    return result.rows.map(row => {
      // Parse vector back to number array
      const rawVector = row.embedding.replace('[', '').replace(']', '').split(',').map(Number);
      return {
        id: row.id,
        score: row.score,
        item: row.metadata as T,
        embedding: rawVector
      };
    });
  }

  async remove(id: string | string[]): Promise<void> {
    const ids = Array.isArray(id) ? id : [id];
    if (ids.length === 0) return;
    
    // Create parameterized queries dynamically for the array
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const query = `DELETE FROM ${this.fullTableName} WHERE id IN (${placeholders});`;
    await this.pool.query(query, ids);
  }

  async update(entry: StoreEntry<T>): Promise<void> {
    await this.add(entry);
  }

  async updateBatch(entries: StoreEntry<T>[]): Promise<void> {
    await this.addBatch(entries);
  }

  async has(id: string): Promise<boolean> {
    const query = `SELECT 1 FROM ${this.fullTableName} WHERE id = $1 LIMIT 1;`;
    const res = await this.pool.query(query, [id]);
    return res.rowCount !== null && res.rowCount > 0;
  }

  async count(): Promise<number> {
    const query = `SELECT COUNT(*) FROM ${this.fullTableName};`;
    const res = await this.pool.query(query);
    return parseInt(res.rows[0].count, 10);
  }

  async clear(): Promise<void> {
    await this.pool.query(`TRUNCATE TABLE ${this.fullTableName};`);
  }

  async stats(): Promise<Record<string, any>> {
    let tableSize = '0';
    try {
      const res = await this.pool.query(`SELECT pg_total_relation_size($1) AS size;`, [this.fullTableName]);
      tableSize = res.rows[0].size;
    } catch {
      // Ignored if table doesn't exist
    }
    return {
      tableSize,
      indexType: this.indexType,
      tableName: this.tableName,
    };
  }

  async dispose(): Promise<void> {
    await this.pool.end();
  }
}

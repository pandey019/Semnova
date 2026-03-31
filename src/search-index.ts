import { IndexConfig, SearchOptions, VectorStore, Progress, IndexStats, StoreEntry, SearchResult, AddOptions } from './types';
import { MemoryStore } from './stores/memory';
import { embed, initEmbedder } from './embedder';
import { defaultPreprocess } from './preprocessor';

export class SearchIndex<T = any> {
  private config: IndexConfig<T>;
  private store: VectorStore<T>;
  private initialized: boolean = false;

  constructor(config: IndexConfig<T> = {}) {
    this.config = {
      model: 'Xenova/all-MiniLM-L6-v2',
      dimensions: 384,
      store: 'memory',
      defaultThreshold: 0.25,
      defaultLimit: 10,
      textField: 'text',
      verbose: false,
      ...config,
    };

    if (typeof this.config.store === 'string') {
      if (this.config.store === 'memory') {
        this.store = new MemoryStore<T>();
      } else if (this.config.store === 'pgvector') {
        const { PgvectorStore } = require('./stores/pgvector');
        this.store = new PgvectorStore(this.config.storeOptions || {});
      } else if (this.config.store === 'sqlite') {
        const { SqliteStore } = require('./stores/sqlite');
        this.store = new SqliteStore(this.config.storeOptions || {});
      } else {
        throw new Error(`Unknown store type: ${this.config.store}`);
      }
    } else if (this.config.store) {
      this.store = this.config.store;
    } else {
      this.store = new MemoryStore<T>();
    }
  }

  private async ensureInitialized() {
    if (this.initialized) return;
    
    // Warm up model
    await initEmbedder({
      model: this.config.model,
      cachePath: this.config.modelCachePath,
      verbose: this.config.verbose,
    });

    if (this.store.init) {
      await this.store.init(this.config.dimensions!);
    }
    
    this.initialized = true;
  }

  private extractText(item: T): string {
    if (this.config.textExtractor) {
      return this.config.textExtractor(item);
    }
    
    const field = this.config.textField || 'text';
    const parts = field.split('.');
    let val: any = item;
    for (const part of parts) {
      if (val === undefined || val === null) break;
      val = val[part];
    }
    
    return typeof val === 'string' ? val : '';
  }

  private preprocessText(text: string): string {
    if (this.config.preprocess) {
      return this.config.preprocess(text);
    }
    return defaultPreprocess(text);
  }

  async add(itemOrItems: any, options: AddOptions = {}): Promise<void> {
    await this.ensureInitialized();
    
    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    if (items.length === 0) return;

    const batchSize = options.batchSize || 32;
    const total = items.length;
    let current = 0;
    const startTime = Date.now();

    for (let i = 0; i < total; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const entries: StoreEntry<T>[] = [];

      // We use Promise.all to embed a batch concurrently. 
      // The HuggingFace pipeline handles concurrency reasonably well.
      await Promise.all(batch.map(async (item) => {
        try {
          const rawText = this.extractText(item);
          const cleanText = this.preprocessText(rawText);
          const vector = await embed(cleanText, {
            model: this.config.model,
            cachePath: this.config.modelCachePath,
            verbose: false, // keep quiet for batches
          });
          
          let id = item.id;
          if (id === undefined) {
            id = require('crypto').randomUUID();
            item.id = id;
          }

          entries.push({
            id: String(id),
            embedding: vector,
            item: item,
          });
        } catch (err: any) {
          if (!options.skipErrors) {
            throw err;
          } else if (this.config.verbose) {
            console.warn(`Skipped item due to error: ${err.message}`);
          }
        }
      }));

      if (entries.length > 0) {
        await this.store.addBatch(entries);
      }

      current += batch.length;
      
      if (options.onProgress) {
        const elapsed = Date.now() - startTime;
        const avgTimePerItem = elapsed / current;
        const estimatedRemaining = (total - current) * avgTimePerItem;
        
        options.onProgress({
          current,
          total,
          percent: Math.round((current / total) * 100),
          elapsed,
          estimatedRemaining,
        });
      }
    }
  }

  async search(query: string, options: SearchOptions<T> = {}): Promise<SearchResult<T>[]> {
    await this.ensureInitialized();
    
    const limit = options.limit || this.config.defaultLimit || 10;
    const threshold = options.threshold ?? this.config.defaultThreshold ?? 0.25;
    
    const cleanQuery = this.preprocessText(query);
    const queryEmbedding = await embed(cleanQuery, {
      model: this.config.model,
      cachePath: this.config.modelCachePath,
      verbose: false,
    });
    
    let rawResults = await this.store.search(queryEmbedding, options.filter ? limit * 3 : limit, threshold);
    
    if (options.filter) {
      rawResults = rawResults.filter(r => options.filter!(r.item));
    }
    
    rawResults = rawResults.slice(0, limit);
    
    if (!options.includeEmbedding) {
      for (const r of rawResults) {
        delete r.embedding;
      }
    }
    
    return rawResults;
  }

  async remove(id: string | string[]): Promise<void> {
    await this.ensureInitialized();
    await this.store.remove(id);
  }

  async update(itemOrItems: any): Promise<void> {
    await this.ensureInitialized();
    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    
    const entries: StoreEntry<T>[] = [];
    for (const item of items) {
      if (item.id === undefined) throw new Error("Item to update must have an id");
      const rawText = this.extractText(item);
      const cleanText = this.preprocessText(rawText);
      const vector = await embed(cleanText, {
        model: this.config.model,
        cachePath: this.config.modelCachePath,
        verbose: false,
      });
      entries.push({ id: String(item.id), embedding: vector, item });
    }
    
    if (entries.length > 0) {
      await this.store.updateBatch(entries);
    }
  }

  async has(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.store.has(id);
  }

  async count(): Promise<number> {
    await this.ensureInitialized();
    return this.store.count();
  }

  async clear(): Promise<void> {
    await this.ensureInitialized();
    await this.store.clear();
  }

  async stats(): Promise<IndexStats> {
    await this.ensureInitialized();
    const count = await this.store.count();
    const storeStats = await this.store.stats();
    return {
      count,
      model: this.config.model || 'Unknown',
      dimensions: this.config.dimensions || 0,
      store: typeof this.config.store === 'string' ? this.config.store : 'custom',
      ...storeStats,
    };
  }

  async dispose(): Promise<void> {
    if (this.store.dispose) {
      await this.store.dispose();
    }
  }

  async export(): Promise<any> {
    if (this.store.export) {
      return this.store.export();
    }
    throw new Error('Export is not supported by the current store implementation.');
  }

  async import(data: any): Promise<void> {
    await this.ensureInitialized();
    if (this.store.import) {
      return this.store.import(data);
    }
    throw new Error('Import is not supported by the current store implementation.');
  }
}

export async function createIndex<T = any>(config?: IndexConfig<T>): Promise<SearchIndex<T>> {
  const index = new SearchIndex<T>(config);
  // Optional: We can proactively initialize it.
  // await index['ensureInitialized'](); // We do lazy init for faster instantiation
  return index;
}

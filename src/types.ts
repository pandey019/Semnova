export interface SearchResult<T> {
  id: string;
  score: number;
  item: T;
  embedding?: number[];
}

export interface StoreEntry<T> {
  id: string;
  embedding: number[];
  item: T;
}

export interface VectorStore<T = any> {
  init?(dimensions: number): Promise<void>;
  add(entry: StoreEntry<T>): Promise<void>;
  addBatch(entries: StoreEntry<T>[]): Promise<void>;
  search(queryEmbedding: number[], limit: number, threshold: number): Promise<{ id: string; score: number; item: T; embedding?: number[] }[]>;
  remove(id: string | string[]): Promise<void>;
  update(entry: StoreEntry<T>): Promise<void>;
  updateBatch(entries: StoreEntry<T>[]): Promise<void>;
  has(id: string): Promise<boolean>;
  count(): Promise<number>;
  clear(): Promise<void>;
  stats(): Promise<Record<string, any>>;
  dispose(): Promise<void>;
  export?(): Promise<any>;
  import?(data: any): Promise<void>;
}

export interface Progress {
  current: number;
  total: number;
  percent: number;
  elapsed: number;
  estimatedRemaining: number;
}

export interface IndexStats {
  count: number;
  model: string;
  dimensions: number;
  store: string;
  [key: string]: any;
}

/**
 * Configuration options for the SearchIndex.
 */
export interface IndexConfig<T = any> {
  /** HuggingFace model ID. Default: 'Xenova/all-MiniLM-L6-v2' */
  model?: string;
  /** Vector dimensions matching the model's output. Default: 384 */
  dimensions?: number;
  /** Storage backend type. Default: 'memory' */
  store?: 'memory' | 'pgvector' | 'sqlite' | VectorStore<T>;
  /** Options passed to the underlying store adapter */
  storeOptions?: any;
  /** Default minimum similarity threshold (0-1). Default: 0.25 */
  defaultThreshold?: number;
  /** Default maximum number of results. Default: 10 */
  defaultLimit?: number;
  /** Field to extract text from (supports dot notation). Default: 'text' */
  textField?: string;
  /** Custom function to extract text from an item */
  textExtractor?: (item: T) => string;
  /** Custom text preprocessing function */
  preprocess?: (text: string) => string;
  /** Path to cache downloaded models */
  modelCachePath?: string;
  /** Enable debug logging. Default: false */
  verbose?: boolean;
}

export interface SearchOptions<T = any> {
  limit?: number;
  threshold?: number;
  filter?: (item: T) => boolean;
  includeEmbedding?: boolean;
}

export interface AddOptions {
  batchSize?: number;
  onProgress?: (progress: Progress) => void;
  skipErrors?: boolean;
}

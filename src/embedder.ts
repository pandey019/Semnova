import { pipeline, env } from '@huggingface/transformers';
import { ModelLoadError, EmptyTextError } from './errors';
import { l2Normalize } from './similarity';

export interface EmbedderOptions {
  model?: string;
  cachePath?: string;
  verbose?: boolean;
}

// HuggingFace Transformers pipeline instance
let instance: any = null;
let initPromise: Promise<any> | null = null;

export async function initEmbedder(options: EmbedderOptions = {}): Promise<any> {
  const modelName = options.model || 'Xenova/all-MiniLM-L6-v2';
  
  if (options.cachePath) {
    env.localModelPath = options.cachePath;
    env.cacheDir = options.cachePath;
  }
  
  if (instance) return instance;
  if (initPromise) return initPromise;
  
  if (options.verbose) {
    console.log(`Downloading/loading model ${modelName}...`);
  }
  
  initPromise = (async () => {
    try {
      const p = await pipeline('feature-extraction', modelName);
      instance = p;
      if (options.verbose) {
        console.log(`Model ${modelName} loaded successfully.`);
      }
      return p;
    } catch (error: any) {
      initPromise = null;
      throw new ModelLoadError(`Failed to load model ${modelName}: ${error.message}`);
    }
  })();
  
  return initPromise;
}

export async function embed(text: string, options: EmbedderOptions = {}): Promise<number[]> {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new EmptyTextError();
  }
  
  const embedder = await initEmbedder(options);
  
  // Warn if text exceeds 256 tokens roughly (assuming 1 token ~ 4 chars for English)
  if (text.length > 256 * 4) {
    if (options.verbose) {
      console.warn('Warning: Input text may exceed token limit and be truncated.');
    }
  }
  
  // Try embedding
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  const tensor = output.data;
  const embedding = Array.from(tensor) as number[];
  
  // The @huggingface/transformers normalize: true does L2 normalization.
  // We'll still ensure it's L2 normalized.
  return l2Normalize(embedding);
}


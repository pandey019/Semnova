import { DimensionMismatchError } from './errors';

export function validateDimensions(a: number[], b: number[]): void {
  if (a.length !== b.length) {
    throw new DimensionMismatchError(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
}

export function dotProduct(a: number[], b: number[]): number {
  validateDimensions(a, b);
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function magnitude(vector: number[]): number {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    sum += vector[i] * vector[i];
  }
  return Math.sqrt(sum);
}

export function euclideanDistance(a: number[], b: number[]): number {
  validateDimensions(a, b);
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  validateDimensions(a, b);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Function to normalize a vector to unit length (L2 normalization)
export function l2Normalize(vector: number[]): number[] {
  const mag = magnitude(vector);
  if (mag === 0) return vector;
  return vector.map(val => val / mag);
}

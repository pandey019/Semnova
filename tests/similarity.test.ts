import { describe, it, expect } from 'vitest';
import { dotProduct, euclideanDistance, cosineSimilarity, l2Normalize } from '../src/similarity';

describe('Similarity Math', () => {
  const v1 = [1, 0, 0];
  const v2 = [0, 1, 0];
  const v3 = [1, 1, 0];

  it('computes dot product', () => {
    expect(dotProduct(v1, v2)).toBe(0);
    expect(dotProduct(v1, v3)).toBe(1);
    expect(dotProduct([2, 2], [3, 3])).toBe(12);
  });

  it('computes Euclidean distance', () => {
    expect(euclideanDistance(v1, v2)).toBeCloseTo(1.414);
    expect(euclideanDistance(v1, v1)).toBe(0);
  });

  it('computes cosine similarity', () => {
    expect(cosineSimilarity(v1, v2)).toBe(0);
    expect(cosineSimilarity(v1, v1)).toBe(1);
    expect(cosineSimilarity(v1, v3)).toBeCloseTo(0.707);
  });

  it('normalizes vector to unit length', () => {
    const v = [3, 4, 0];
    const n = l2Normalize(v);
    expect(n[0]).toBeCloseTo(0.6);
    expect(n[1]).toBeCloseTo(0.8);
    expect(n[2]).toBe(0);
    expect(dotProduct(n, n)).toBeCloseTo(1);
  });
});

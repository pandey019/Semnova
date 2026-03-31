import { describe, it, expect, beforeAll } from 'vitest';
import { createIndex } from '../src/search-index';

describe('SearchIndex E2E', () => {
  let index: any;

  beforeAll(async () => {
    // We use memory store by default
    index = await createIndex();
  });

  it('adds items and searches by meaning', async () => {
    await index.add([
      { id: '1', text: 'AI-powered video editing tool' },
      { id: '2', text: 'Email automation platform' },
      { id: '3', text: 'Code debugging assistant' },
    ]);

    const results = await index.search('I want to edit my videos');
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('1');
    expect(results[0].item.text).toBe('AI-powered video editing tool');
    
    const emailResults = await index.search('need help writing emails');
    expect(emailResults[0].id).toBe('2');

    const codeResults = await index.search('how to fix a bug in python');
    expect(codeResults[0].id).toBe('3');
  }, 60000); // Allow time for model download

  it('handles item update and remove', async () => {
    await index.add({ id: '4', text: 'a simple text file' });
    let count = await index.count();
    expect(count).toBe(4);

    await index.update({ id: '4', text: 'a very complex document' });
    const results = await index.search('complex document', { limit: 1 });
    expect(results[0].id).toBe('4');

    await index.remove('4');
    count = await index.count();
    expect(count).toBe(3);
  }, 30000);

  it('extracts custom text fields', async () => {
    const customIndex = await createIndex({
      textExtractor: (item: any) => `${item.title}. ${item.description}`,
    });

    await customIndex.add([
      { id: '1', title: 'Laptop', description: 'A portable notebook computer' },
      { id: '2', title: 'Smartphone', description: 'A mobile phone with touch screen' },
    ]);

    const res = await customIndex.search('I need a new computer for travel');
    expect(res[0].id).toBe('1');
  }, 30000);
});

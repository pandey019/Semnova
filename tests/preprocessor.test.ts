import { describe, it, expect } from 'vitest';
import { normalizeWhitespace, stripHtml, defaultPreprocess } from '../src/preprocessor';
import { EmptyTextError } from '../src/errors';

describe('Preprocessor', () => {
  it('normalizes whitespace', () => {
    expect(normalizeWhitespace('  hello \n \t world  ')).toBe('hello world');
  });

  it('strips HTML', () => {
    expect(stripHtml('<p>hello <b>world</b></p>')).toBe('hello world');
  });

  it('defaultPreprocess throws on empty text', () => {
    expect(() => defaultPreprocess('')).toThrow(EmptyTextError);
    expect(() => defaultPreprocess('   ')).toThrow(EmptyTextError);
    expect(defaultPreprocess('  hello world  ')).toBe('hello world');
  });
});

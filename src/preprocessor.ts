import { EmptyTextError } from './errors';

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>?/gm, '');
}

export function defaultPreprocess(text: string): string {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new EmptyTextError();
  }
  return normalizeWhitespace(text);
}

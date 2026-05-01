import { describe, it, expect } from 'vitest';
import { isExactMatch } from '@/lib/scoring/exactMatch';

describe('isExactMatch', () => {
  it('matches identical strings', () => {
    expect(isExactMatch('Buffalo Trace', 'Buffalo Trace')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isExactMatch('buffalo trace', 'Buffalo Trace')).toBe(true);
    expect(isExactMatch('BUFFALO TRACE', 'buffalo trace')).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    expect(isExactMatch('  Buffalo Trace  ', 'Buffalo Trace')).toBe(true);
  });

  it('returns false for different strings', () => {
    expect(isExactMatch('Makers Mark', 'Buffalo Trace')).toBe(false);
  });

  it('returns false for empty vs non-empty', () => {
    expect(isExactMatch('', 'Buffalo Trace')).toBe(false);
  });

  it('matches empty vs empty', () => {
    expect(isExactMatch('', '')).toBe(true);
  });
});

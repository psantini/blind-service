import { describe, it, expect } from 'vitest';
import { isFuzzyMatch } from '@/lib/scoring/fuzzy';

describe('isFuzzyMatch', () => {
  it('returns false for exact match (handled by isExactMatch)', () => {
    expect(isFuzzyMatch('Buffalo Trace', 'Buffalo Trace')).toBe(false);
  });

  it('matches strings within 3 edits', () => {
    // 1 substitution
    expect(isFuzzyMatch('Buffelo Trace', 'Buffalo Trace')).toBe(true);
    // 1 deletion
    expect(isFuzzyMatch('Bufalo Trace', 'Buffalo Trace')).toBe(true);
    // 1 insertion
    expect(isFuzzyMatch('Buffaloo Trace', 'Buffalo Trace')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isFuzzyMatch('buffelo trace', 'Buffalo Trace')).toBe(true);
  });

  it('returns false for strings more than 3 edits apart', () => {
    expect(isFuzzyMatch('Makers Mark', 'Buffalo Trace')).toBe(false);
  });

  it('returns false for empty vs non-empty (edit distance > 3)', () => {
    expect(isFuzzyMatch('', 'Buffalo Trace')).toBe(false);
  });
});

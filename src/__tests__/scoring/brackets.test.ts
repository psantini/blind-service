import { describe, it, expect } from 'vitest';
import {
  scoreBracket,
  DEFAULT_AGE_BRACKETS,
  DEFAULT_PROOF_BRACKETS,
} from '@/lib/scoring/brackets';

describe('scoreBracket', () => {
  it('returns max points for exact match', () => {
    expect(scoreBracket(10, 10, DEFAULT_AGE_BRACKETS)).toBe(5);
  });

  it('returns 0 when delta exceeds all brackets', () => {
    expect(scoreBracket(0, 100, DEFAULT_AGE_BRACKETS)).toBe(0);
  });

  it('returns correct points for each age bracket boundary', () => {
    expect(scoreBracket(10, 11, DEFAULT_AGE_BRACKETS)).toBe(4); // delta 1
    expect(scoreBracket(10, 12, DEFAULT_AGE_BRACKETS)).toBe(3); // delta 2
    expect(scoreBracket(10, 15, DEFAULT_AGE_BRACKETS)).toBe(2); // delta 5
    expect(scoreBracket(10, 20, DEFAULT_AGE_BRACKETS)).toBe(1); // delta 10
    expect(scoreBracket(10, 21, DEFAULT_AGE_BRACKETS)).toBe(0); // delta 11
  });

  it('returns correct points for each proof bracket boundary', () => {
    expect(scoreBracket(90, 90, DEFAULT_PROOF_BRACKETS)).toBe(5);  // delta 0
    expect(scoreBracket(90, 92, DEFAULT_PROOF_BRACKETS)).toBe(4);  // delta 2
    expect(scoreBracket(90, 95, DEFAULT_PROOF_BRACKETS)).toBe(3);  // delta 5
    expect(scoreBracket(90, 100, DEFAULT_PROOF_BRACKETS)).toBe(2); // delta 10
    expect(scoreBracket(90, 110, DEFAULT_PROOF_BRACKETS)).toBe(1); // delta 20
    expect(scoreBracket(90, 111, DEFAULT_PROOF_BRACKETS)).toBe(0); // delta 21
  });

  it('uses absolute delta (works in both directions)', () => {
    expect(scoreBracket(12, 10, DEFAULT_AGE_BRACKETS)).toBe(3); // delta 2, same as (10,12)
  });

  it('returns 0 with empty brackets', () => {
    expect(scoreBracket(10, 10, [])).toBe(0);
  });
});

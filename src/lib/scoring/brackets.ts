export type Bracket = { max_delta: number; points: number };

export function scoreBracket(
  guess: number,
  actual: number,
  brackets: Bracket[]
): number {
  const delta = Math.abs(guess - actual);
  const match = brackets.find((b) => delta <= b.max_delta);
  return match?.points ?? 0;
}

export const DEFAULT_AGE_BRACKETS: Bracket[] = [
  { max_delta: 0,  points: 5 },
  { max_delta: 1,  points: 4 },
  { max_delta: 2,  points: 3 },
  { max_delta: 5,  points: 2 },
  { max_delta: 10, points: 1 },
];

export const DEFAULT_PROOF_BRACKETS: Bracket[] = [
  { max_delta: 0,  points: 5 },
  { max_delta: 2,  points: 4 },
  { max_delta: 5,  points: 3 },
  { max_delta: 10, points: 2 },
  { max_delta: 20, points: 1 },
];

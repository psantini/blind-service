export function isExactMatch(guess: string, actual: string): boolean {
  return guess.trim().toLowerCase() === actual.trim().toLowerCase();
}

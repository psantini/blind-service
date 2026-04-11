export const WHISKEY_TYPES = [
  'Bourbon',
  'Rye',
  'Scotch Single Malt',
  'Scotch Blended',
  'Scotch Single Grain',
  'Irish',
  'Japanese',
  'Canadian',
  'American Single Malt',
  'Tennessee',
  'Other',
] as const;

export type WhiskeyType = typeof WHISKEY_TYPES[number];

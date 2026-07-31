export const WHISKEY_TYPES = [
  'Bourbon',
  'Rye',
  'Wheat Whiskey',
  'Corn Whiskey',
  'Blended Whiskey',
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

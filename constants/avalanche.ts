/**
 * Avalanche-related constants
 */

export const DANGER_LEVELS = {
  '-1': 'No Rating',
  '1': 'Low',
  '2': 'Moderate',
  '3': 'Considerable',
  '4': 'High',
  '5': 'Extreme',
} as const;

export const DANGER_LEVEL_COLORS = {
  '-1': 'text-gray-400',
  '1': 'text-green-400',
  '2': 'text-yellow-400',
  '3': 'text-orange-400',
  '4': 'text-red-400',
  '5': 'text-red-600',
} as const;

export const PROBLEM_TYPES = [
  'Wind Slab',
  'Persistent Slab',
  'Deep Persistent Slab',
  'Wet Loose',
  'Wet Slab',
  'Dry Loose',
  'Cornice',
  'Glide',
] as const;

export const LIKELIHOOD_LEVELS = [
  'Unlikely',
  'Possible',
  'Likely',
  'Very Likely',
  'Almost Certain',
] as const;

export const SIZE_CATEGORIES = [
  'Small',
  'Medium',
  'Large',
  'Very Large',
  'Historic',
] as const;

export const ELEVATION_BANDS = {
  HIGH: 'Above Treeline',
  MIDDLE: 'Near Treeline',
  LOW: 'Below Treeline',
} as const;

export const ASPECTS = [
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
] as const;

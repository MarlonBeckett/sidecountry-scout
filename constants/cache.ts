/**
 * Cache duration constants
 * All durations in seconds for Next.js revalidate
 */

// Time in seconds
export const CACHE_DURATION = {
  FORECASTS: 3600,          // 1 hour
  WEATHER: 21600,           // 6 hours
  BRIEFINGS: 86400,         // 24 hours (1 day)
  USER_PREFERENCES: 0,      // No cache (always fresh)
} as const;

// Time in milliseconds for client-side checks
export const CACHE_DURATION_MS = {
  FORECASTS: 3600000,       // 1 hour
  WEATHER: 21600000,        // 6 hours
  BRIEFINGS: 86400000,      // 24 hours
  STALENESS_WARNING: 86400000, // 24 hours
} as const;

// Database cache check intervals (for SQL queries)
export const CACHE_INTERVALS = {
  FORECASTS: '1 hour',
  WEATHER: '6 hours',
  BRIEFINGS: '1 day',
} as const;

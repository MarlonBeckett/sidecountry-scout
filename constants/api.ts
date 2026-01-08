/**
 * External API endpoints and configuration
 */

export const AVALANCHE_ORG_API = {
  BASE_URL: 'https://api.avalanche.org/v2/public',
  ENDPOINTS: {
    MAP_LAYER: '/products/map-layer',
    PRODUCT: '/product',
  },
} as const;

export const WEATHER_API = {
  BASE_URL: 'https://api.open-meteo.com/v1',
  ENDPOINTS: {
    FORECAST: '/forecast',
  },
  PARAMS: {
    TEMPERATURE_UNIT: 'fahrenheit',
    WIND_SPEED_UNIT: 'mph',
    PRECIPITATION_UNIT: 'inch',
    FORECAST_DAYS: 7,
  },
} as const;

export const GEMINI_API = {
  MODELS: {
    BRIEFING: 'gemini-2.0-flash-exp',
    CHAT: 'gemini-2.0-flash-exp',
  },
  GENERATION_CONFIG: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  },
} as const;

// Internal API routes
export const INTERNAL_API = {
  FORECASTS: '/api/forecasts',
  WEATHER: '/api/weather',
  BRIEFINGS: {
    GET: '/api/briefings',
    GENERATE: '/api/briefings/generate',
    REGENERATE: '/api/briefings/regenerate',
  },
  CHAT: '/api/chat',
  CHAT_HISTORY: '/api/chat-history',
  PREFERENCES: '/api/preferences',
} as const;

/**
 * Avalanche Forecast Types
 * Types for avalanche.org API responses and database storage
 */

// ============= GeoJSON Types =============

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

// ============= External API Types (avalanche.org) =============

export interface ForecastProperties {
  name: string;
  center: string;
  state: string;
  timezone: string;
  start_date: string;
  end_date: string;
  danger_level: number;
  danger_elevation_high: number;
  danger_elevation_middle: number;
  danger_elevation_low: number;
  travel_advice: string;
  url: string;
  warning?: {
    product: string;
    published_time: string;
  };
}

export interface ForecastFeature {
  type: 'Feature';
  id: string;
  geometry: GeoJSONPolygon;
  properties: ForecastProperties;
}

export interface MapLayerApiResponse {
  type: 'FeatureCollection';
  features: ForecastFeature[];
}

export interface ProductApiAvalancheProblem {
  name?: string;
  likelihood?: string;
  min_size?: string;
  max_size?: string;
  discussion?: string;
  location?: string[];
  aspect_elevation?: Record<string, unknown>;
}

export interface ProductApiDangerRose {
  valid_day?: string;
  elevation?: string;
  aspect?: string[];
  danger?: number;
}

export interface ProductApiMedia {
  id?: string;
  url?: {
    large?: string;
    medium?: string;
    thumbnail?: string;
    original?: string;
  };
  caption?: string;
  type?: string;
}

export interface ProductApiResponse {
  id?: string;
  published_time?: string;
  expires_time?: string;
  bottom_line?: string;
  hazard_discussion?: string;
  weather_discussion?: string;
  announcement?: string;
  forecast_avalanche_problems?: ProductApiAvalancheProblem[];
  danger?: ProductApiDangerRose[];
  media?: ProductApiMedia[];
  avalanche_center?: {
    id?: string;
    name?: string;
    url?: string;
  };
}

// ============= Application Types =============

export interface AvalancheDanger {
  overall: number;
  high: number;
  middle: number;
  low: number;
}

export interface ForecastDates {
  start: string;
  end: string;
}

export interface AvalancheProblem {
  name: string;
  likelihood: string;
  minSize: string;
  maxSize: string;
  discussion: string;
  location: string[];
  aspectElevation?: Record<string, unknown>;
}

export interface ForecastMedia {
  id: string;
  url: {
    large?: string;
    medium?: string;
    thumbnail?: string;
    original?: string;
  };
  caption: string;
  type?: string;
}

export interface AvalancheForecast {
  id: string;
  zone: string;
  center: string;
  state: string;
  timezone: string;
  dates: ForecastDates;
  danger: AvalancheDanger;
  travelAdvice: string;
  url: string;
  warning?: {
    product: string;
    published_time: string;
  } | null;
  geometry: GeoJSONPolygon;
  bottomLine?: string;
  hazardDiscussion?: string;
  weatherDiscussion?: string;
  media?: ForecastMedia[];
  avalancheProblems?: AvalancheProblem[];
  dangerRose?: ProductApiDangerRose[];
  hasFullForecast: boolean;
}

export interface ForecastsResponse {
  success: boolean;
  count: number;
  forecasts: AvalancheForecast[];
  cached: boolean;
}


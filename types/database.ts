/**
 * Supabase Database Types
 * Types for database tables and queries
 */

import { AvalancheProblemBriefing } from './briefing';
import {
  ProductApiAvalancheProblem,
  ProductApiMedia,
  ProductApiDangerRose,
  GeoJSONPolygon
} from './forecast';

// ============= User & Auth =============

export interface UserPreferences {
  id: string;
  user_id: string;
  selected_center: string | null;
  selected_zone: string | null;
  created_at: string;
  updated_at: string;
}

// ============= Forecasts =============

export interface DbAvalancheForecast {
  forecast_id: string;
  center: string;
  zone: string;
  state: string;
  timezone: string;
  forecast_date: string;
  start_date: string;
  end_date: string;
  danger_overall: number;
  danger_high: number;
  danger_middle: number;
  danger_low: number;
  travel_advice: string;
  forecast_url: string;
  warning_product?: string | null;
  warning_published_time?: string | null;
  geometry: GeoJSONPolygon;
  bottom_line?: string | null;
  hazard_discussion?: string | null;
  weather_discussion?: string | null;
  forecast_avalanche_problems?: ProductApiAvalancheProblem[] | null;
  media?: ProductApiMedia[] | null;
  danger_array?: ProductApiDangerRose[] | null;
  has_product_data: boolean;
  created_at: string;
}

// ============= Briefings =============

export interface DbAvalancheBriefing {
  id: string;
  center: string;
  zone: string;
  forecast_date: string;
  danger_level: number;
  briefing_text: string;
  problems: AvalancheProblemBriefing[];
  created_at: string;
  updated_at?: string | null;
}

// ============= Weather =============

export interface DbWeatherData {
  id: string;
  center: string;
  zone: string;
  forecast_date: string;
  latitude: number;
  longitude: number;
  weather_data: Record<string, unknown>;
  created_at: string;
}

// ============= Chat History =============

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DbChatHistory {
  id: string;
  user_id: string;
  title: string;
  center: string | null;
  zone: string | null;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

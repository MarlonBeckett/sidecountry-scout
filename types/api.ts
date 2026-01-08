/**
 * API Response Types
 * Standardized response types for all API endpoints
 */

import { AvalancheForecast } from './forecast';
import { AvalancheBriefing } from './briefing';
import { WeatherData } from './weather';
import { UserPreferences, ChatMessage } from './database';

// ============= Base Response Types =============

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  cached?: boolean;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============= Forecast API Responses =============

export interface ForecastsApiResponse {
  success: boolean;
  count: number;
  forecasts: AvalancheForecast[];
  cached: boolean;
}

// ============= Briefing API Responses =============

export interface BriefingApiResponse {
  success: boolean;
  briefing: AvalancheBriefing | null;
  cached?: boolean;
  staleData?: boolean;
  dataAge?: number;
  stalenessWarning?: string | null;
}

export interface GenerateBriefingApiResponse extends BriefingApiResponse {
  generated?: boolean;
}

// ============= Weather API Responses =============

export interface WeatherApiResponse {
  success: boolean;
  weather: WeatherData | null;
  cached?: boolean;
  error?: string;
}

// ============= User Preferences API Responses =============

export interface PreferencesApiResponse {
  success: boolean;
  preferences: UserPreferences | null;
}

export interface UpdatePreferencesRequest {
  userId: string;
  selectedCenter?: string | null;
  selectedZone?: string | null;
}

// ============= Chat API Responses =============

export interface ChatRequest {
  messages: ChatMessage[];
  center?: string;
  zone?: string;
}

export interface ChatHistoryApiResponse {
  success: boolean;
  chats: Array<{
    id: string;
    title: string;
    center: string | null;
    zone: string | null;
    messages: ChatMessage[];
    created_at: string;
    updated_at: string;
  }>;
}

export interface CreateChatRequest {
  title: string;
  center?: string | null;
  zone?: string | null;
  messages: ChatMessage[];
}

export interface UpdateChatRequest {
  chatId: string;
  messages: ChatMessage[];
}

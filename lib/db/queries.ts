/**
 * Shared Database Queries
 * Reusable query functions for common database operations
 */

import { getServiceClient, supabase } from './client';
import { CACHE_INTERVALS } from '@/constants';
import type {
  DbAvalancheForecast,
  DbAvalancheBriefing,
  DbWeatherData,
  UserPreferences,
  DbChatHistory,
} from '@/types';

// ============= Forecast Queries =============

export async function getCachedForecasts(center?: string, useServiceRole = true) {
  const client = useServiceRole ? getServiceClient() : supabase;
  const today = new Date().toISOString().split('T')[0];

  let query = client
    .from('avalanche_forecasts')
    .select('*')
    .eq('forecast_date', today)
    .gte('created_at', `now() - interval '${CACHE_INTERVALS.FORECASTS}'`);

  if (center) {
    query = query.eq('center', center);
  }

  return query;
}

export async function upsertForecast(forecast: Partial<DbAvalancheForecast>) {
  const client = getServiceClient();

  return client
    .from('avalanche_forecasts')
    .upsert(forecast, {
      onConflict: 'forecast_id',
    });
}

// ============= Briefing Queries =============

export async function getCachedBriefing(center: string, zone: string) {
  const client = getServiceClient();
  const today = new Date().toISOString().split('T')[0];

  return client
    .from('avalanche_briefings')
    .select('*')
    .eq('center', center)
    .eq('zone', zone)
    .eq('forecast_date', today)
    .single();
}

export async function upsertBriefing(briefing: Partial<DbAvalancheBriefing>) {
  const client = getServiceClient();

  return client
    .from('avalanche_briefings')
    .upsert(briefing, {
      onConflict: 'center,zone,forecast_date',
    });
}

export async function deleteBriefing(center: string, zone: string, forecastDate: string) {
  const client = getServiceClient();

  return client
    .from('avalanche_briefings')
    .delete()
    .eq('center', center)
    .eq('zone', zone)
    .eq('forecast_date', forecastDate);
}

// ============= Weather Queries =============

export async function getCachedWeather(center: string, zone: string) {
  const client = getServiceClient();
  const today = new Date().toISOString().split('T')[0];

  return client
    .from('weather_data')
    .select('*')
    .eq('center', center)
    .eq('zone', zone)
    .eq('forecast_date', today)
    .gte('created_at', `now() - interval '${CACHE_INTERVALS.WEATHER}'`)
    .single();
}

export async function upsertWeather(weather: Partial<DbWeatherData>) {
  const client = getServiceClient();

  return client
    .from('weather_data')
    .upsert(weather, {
      onConflict: 'center,zone,forecast_date',
    });
}

// ============= User Preferences Queries =============

export async function getUserPreferences(userId: string) {
  return supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
}

export async function upsertUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
  return supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );
}

// ============= Chat History Queries =============

export async function getUserChatHistory(userId: string) {
  return supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
}

export async function getChatById(chatId: string, userId: string) {
  return supabase
    .from('chat_history')
    .select('*')
    .eq('id', chatId)
    .eq('user_id', userId)
    .single();
}

export async function createChatHistory(chat: Partial<DbChatHistory>) {
  return supabase
    .from('chat_history')
    .insert(chat)
    .select()
    .single();
}

export async function updateChatHistory(chatId: string, userId: string, updates: Partial<DbChatHistory>) {
  return supabase
    .from('chat_history')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chatId)
    .eq('user_id', userId)
    .select()
    .single();
}

export async function deleteChatHistory(chatId: string, userId: string) {
  return supabase
    .from('chat_history')
    .delete()
    .eq('id', chatId)
    .eq('user_id', userId);
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nycbrohrtvteopadoyct.supabase.co',
  process.env.NEXT_SECRET_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Types for the Avalanche.org API response
interface ForecastProperties {
  name: string;
  center: string;
  state: string;
  timezone: string;
  start_date: string;
  end_date: string;
  danger_level: number; // -1 = no rating, 1-5 = danger scale
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

interface ForecastFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: ForecastProperties;
}

interface AvalancheApiResponse {
  type: 'FeatureCollection';
  features: ForecastFeature[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const centerId = searchParams.get('center');
    const today = new Date().toISOString().split('T')[0];

    // First, try to fetch from Supabase cache
    let query = supabase
      .from('avalanche_forecasts')
      .select('*')
      .eq('forecast_date', today);

    if (centerId) {
      query = query.eq('center', centerId);
    }

    const { data: cachedForecasts, error: cacheError } = await query;

    // If we have cached forecasts from today, return them
    if (!cacheError && cachedForecasts && cachedForecasts.length > 0) {
      const forecasts = cachedForecasts.map(f => ({
        id: f.forecast_id,
        zone: f.zone,
        center: f.center,
        state: f.state,
        timezone: f.timezone,
        dates: {
          start: f.start_date,
          end: f.end_date,
        },
        danger: {
          overall: f.danger_overall,
          high: f.danger_high,
          middle: f.danger_middle,
          low: f.danger_low,
        },
        travelAdvice: f.travel_advice,
        url: f.forecast_url,
        warning: f.warning_product ? {
          product: f.warning_product,
          published_time: f.warning_published_time,
        } : null,
        geometry: f.geometry,
      }));

      return NextResponse.json({
        success: true,
        count: forecasts.length,
        forecasts,
        cached: true,
      });
    }

    // If no cache, fetch from Avalanche.org API
    const baseUrl = 'https://api.avalanche.org/v2/public/products/map-layer';
    const apiUrl = centerId ? `${baseUrl}/${centerId}` : baseUrl;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'SideCountry Scout (contact@sidecountryscout.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`Avalanche API returned ${response.status}`);
    }

    const data: AvalancheApiResponse = await response.json();

    // Transform and prepare for both response and storage
    const forecasts = data.features.map(feature => ({
      id: feature.id,
      zone: feature.properties.name,
      center: feature.properties.center,
      state: feature.properties.state,
      timezone: feature.properties.timezone,
      dates: {
        start: feature.properties.start_date,
        end: feature.properties.end_date,
      },
      danger: {
        overall: feature.properties.danger_level,
        high: feature.properties.danger_elevation_high,
        middle: feature.properties.danger_elevation_middle,
        low: feature.properties.danger_elevation_low,
      },
      travelAdvice: feature.properties.travel_advice,
      url: feature.properties.url,
      warning: feature.properties.warning || null,
      geometry: feature.geometry,
    }));

    // Store in Supabase for future requests (async, don't wait)
    const forecastsToStore = forecasts.map(f => ({
      forecast_id: f.id,
      zone: f.zone,
      center: f.center,
      state: f.state,
      timezone: f.timezone,
      forecast_date: today,
      start_date: f.dates.start,
      end_date: f.dates.end,
      danger_overall: f.danger.overall,
      danger_high: f.danger.high,
      danger_middle: f.danger.middle,
      danger_low: f.danger.low,
      travel_advice: f.travelAdvice,
      forecast_url: f.url,
      warning_product: f.warning?.product || null,
      warning_published_time: f.warning?.published_time || null,
      geometry: f.geometry,
    }));

    // Store forecasts asynchronously (fire and forget)
    supabase
      .from('avalanche_forecasts')
      .upsert(forecastsToStore, {
        onConflict: 'forecast_id,forecast_date',
        ignoreDuplicates: false
      })
      .then(({ error }) => {
        if (error) {
          console.error('Error storing forecasts in Supabase:', error);
        }
      });

    return NextResponse.json({
      success: true,
      count: forecasts.length,
      forecasts,
      cached: false,
    });

  } catch (error) {
    console.error('Error fetching avalanche forecasts:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch forecasts',
      },
      { status: 500 }
    );
  }
}

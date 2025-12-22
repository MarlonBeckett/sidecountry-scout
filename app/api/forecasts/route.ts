import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCenterId } from '@/lib/avalancheCenterMapping';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nycbrohrtvteopadoyct.supabase.co',
  process.env.NEXT_SECRET_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Types for the Map-Layer API response (zone discovery)
interface ForecastProperties {
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

interface ForecastFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: ForecastProperties;
}

interface MapLayerApiResponse {
  type: 'FeatureCollection';
  features: ForecastFeature[];
}

// Types for the Product API response (full forecast details)
interface ProductApiAvalancheProblem {
  name?: string;
  likelihood?: string;
  min_size?: string;
  max_size?: string;
  discussion?: string;
  location?: string[];
  aspect_elevation?: any;
}

interface ProductApiDangerRose {
  valid_day?: string;
  elevation?: string;
  aspect?: string[];
  danger?: number;
}

interface ProductApiMedia {
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

interface ProductApiResponse {
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

// Cache configuration: revalidate every hour
export const revalidate = 3600;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const centerParam = searchParams.get('center');
    const today = new Date().toISOString().split('T')[0];

    // First, try to fetch from Supabase cache
    if (centerParam) {
      const { data: cachedForecasts, error: cacheError } = await supabase
        .from('avalanche_forecasts')
        .select('*')
        .eq('forecast_date', today)
        .eq('center', centerParam)
        .eq('has_product_data', true); // Only return if we have full Product API data

      // If we have cached forecasts with full data from today, return them
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
          // Full forecast data from Product API
          bottomLine: f.bottom_line,
          hazardDiscussion: f.hazard_discussion,
          weatherDiscussion: f.weather_discussion,
          media: f.media || [],
          avalancheProblems: f.forecast_avalanche_problems || [],
          dangerRose: f.danger_array || [],
          hasFullForecast: f.has_product_data,
        }));

        console.log(`✅ Returning ${forecasts.length} cached forecasts for ${centerParam}`);

        return NextResponse.json({
          success: true,
          count: forecasts.length,
          forecasts,
          cached: true,
        });
      }
    }

    // If no cache, fetch from Map-Layer API to discover zones
    console.log('📡 Fetching from Map-Layer API...');
    const baseUrl = 'https://api.avalanche.org/v2/public/products/map-layer';
    const apiUrl = baseUrl; // Always fetch all zones first

    const mapLayerResponse = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'SideCountry Scout (contact@sidecountryscout.com)',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!mapLayerResponse.ok) {
      throw new Error(`Map-Layer API returned ${mapLayerResponse.status}`);
    }

    const mapLayerData: MapLayerApiResponse = await mapLayerResponse.json();

    // Filter zones by center if specified
    let zones = mapLayerData.features;
    if (centerParam) {
      zones = zones.filter(zone => zone.properties.center === centerParam);
      console.log(`🔍 Filtered to ${zones.length} zones for ${centerParam}`);
    }

    // For each zone, fetch full forecast data from Product API
    console.log(`🚀 Fetching Product API data for ${zones.length} zones in parallel...`);

    const enrichedForecastsPromises = zones.map(async (zone) => {
      const zoneId = zone.id;
      const centerName = zone.properties.center;
      const centerId = getCenterId(centerName);

      // Start with basic map-layer data
      const baseForecast = {
        forecast_id: zoneId,
        zone: zone.properties.name,
        center: centerName,
        state: zone.properties.state,
        timezone: zone.properties.timezone,
        forecast_date: today,
        start_date: zone.properties.start_date,
        end_date: zone.properties.end_date,
        danger_overall: zone.properties.danger_level,
        danger_high: zone.properties.danger_elevation_high,
        danger_middle: zone.properties.danger_elevation_middle,
        danger_low: zone.properties.danger_elevation_low,
        travel_advice: zone.properties.travel_advice,
        forecast_url: zone.properties.url,
        warning_product: zone.properties.warning?.product || null,
        warning_published_time: zone.properties.warning?.published_time || null,
        geometry: zone.geometry,
        center_id: centerId,
        bottom_line: null,
        hazard_discussion: null,
        weather_discussion: null,
        media: [],
        published_time: null,
        expires_time: null,
        danger_array: [],
        forecast_avalanche_problems: [],
        has_product_data: false,
      };

      // If no center_id mapping exists, skip Product API and return basic data
      if (!centerId) {
        console.warn(`⚠️  No center_id mapping for "${centerName}". Returning basic data only.`);
        return baseForecast;
      }

      // Fetch full forecast from Product API
      const productUrl = `https://api.avalanche.org/v2/public/product?type=forecast&center_id=${centerId}&zone_id=${zoneId}`;

      try {
        const productResponse = await fetch(productUrl, {
          headers: {
            'User-Agent': 'SideCountry Scout (contact@sidecountryscout.com)',
          },
          next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!productResponse.ok) {
          // 404 is common if forecast not yet published - fall back to basic data
          if (productResponse.status === 404) {
            console.log(`ℹ️  No Product API forecast for ${zone.properties.name} (404)`);
            return baseForecast;
          }
          throw new Error(`Product API returned ${productResponse.status}`);
        }

        const productData: ProductApiResponse = await productResponse.json();

        // Transform media array
        const media = (productData.media || []).map(m => ({
          id: m.id || '',
          url: m.url?.original || '',
          caption: m.caption || '',
          sizes: {
            large: m.url?.large || '',
            medium: m.url?.medium || '',
            thumbnail: m.url?.thumbnail || '',
            original: m.url?.original || '',
          },
        }));

        // Transform avalanche problems
        const avalancheProblems = (productData.forecast_avalanche_problems || []).map(p => ({
          name: p.name || '',
          likelihood: p.likelihood || '',
          minSize: p.min_size || '',
          maxSize: p.max_size || '',
          discussion: p.discussion || '',
          location: p.location || [],
          aspectElevation: p.aspect_elevation || null,
        }));

        // Merge Product API data with base forecast
        console.log(`✅ Enriched ${zone.properties.name} with Product API data`);

        return {
          ...baseForecast,
          bottom_line: productData.bottom_line || null,
          hazard_discussion: productData.hazard_discussion || null,
          weather_discussion: productData.weather_discussion || null,
          media: media,
          published_time: productData.published_time || null,
          expires_time: productData.expires_time || null,
          danger_array: productData.danger || [],
          forecast_avalanche_problems: avalancheProblems,
          has_product_data: true,
        };
      } catch (error) {
        // On any error, fall back to basic map-layer data
        console.error(`❌ Error fetching Product API for ${zone.properties.name}:`, error);
        return baseForecast;
      }
    });

    // Wait for all Product API calls to complete
    const enrichedForecasts = await Promise.all(enrichedForecastsPromises);

    console.log(`📦 Enriched ${enrichedForecasts.filter(f => f.has_product_data).length}/${enrichedForecasts.length} forecasts with Product API data`);

    // Transform for response
    const forecasts = enrichedForecasts.map(f => ({
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
      // Full forecast data
      bottomLine: f.bottom_line,
      hazardDiscussion: f.hazard_discussion,
      weatherDiscussion: f.weather_discussion,
      media: f.media,
      avalancheProblems: f.forecast_avalanche_problems,
      dangerRose: f.danger_array,
      hasFullForecast: f.has_product_data,
    }));

    // Store in Supabase for future requests (async, don't wait)
    supabase
      .from('avalanche_forecasts')
      .upsert(enrichedForecasts, {
        onConflict: 'forecast_id,forecast_date',
        ignoreDuplicates: false
      })
      .then(({ error }) => {
        if (error) {
          console.error('❌ Error storing forecasts in Supabase:', error);
        } else {
          console.log(`💾 Stored ${enrichedForecasts.length} forecasts in cache`);
        }
      });

    return NextResponse.json({
      success: true,
      count: forecasts.length,
      forecasts,
      cached: false,
    });

  } catch (error) {
    console.error('❌ Error fetching avalanche forecasts:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch forecasts',
      },
      { status: 500 }
    );
  }
}

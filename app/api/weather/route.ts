import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 21600; // 6 hours - weather changes more frequently than forecasts

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    snowfall: number[];
    cloud_cover: number[];
    visibility: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
    uv_index: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    snowfall_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    uv_index_max: number[];
  };
}

export interface WeatherData {
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  current: {
    time: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    precipitation: number;
    weatherCode: number;
    weatherDescription: string;
    cloudCover: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    windDirectionCardinal: string;
    windGusts: number;
  };
  hourly: {
    time: string[];
    temperature: number[];
    precipitationProbability: number[];
    precipitation: number[];
    snowfall: number[];
    cloudCover: number[];
    visibility: number[];
    windSpeed: number[];
    windDirection: number[];
    windGusts: number[];
    uvIndex: number[];
  };
  daily: {
    time: string[];
    temperatureMax: number[];
    temperatureMin: number[];
    precipitationSum: number[];
    snowfallSum: number[];
    precipitationProbabilityMax: number[];
    windSpeedMax: number[];
    windGustsMax: number[];
    uvIndexMax: number[];
  };
  lastUpdated: string;
}

// WMO Weather interpretation codes
const weatherCodeDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

function getWeatherDescription(code: number): string {
  return weatherCodeDescriptions[code] || 'Unknown';
}

function getCardinalDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const center = searchParams.get('center');
    const zone = searchParams.get('zone');

    if (!lat || !lon) {
      return NextResponse.json(
        { success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { success: false, error: 'Invalid latitude or longitude' },
        { status: 400 }
      );
    }

    // Check cache first if center and zone provided
    if (center && zone) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const today = new Date().toISOString().split('T')[0];
      const { data: cached } = await supabase
        .from('weather_data')
        .select('*')
        .eq('center', center)
        .eq('zone', zone)
        .eq('forecast_date', today)
        .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // 6 hours
        .single();

      if (cached && cached.weather_data) {
        return NextResponse.json({
          success: true,
          weather: cached.weather_data,
          cached: true,
        });
      }
    }

    // Fetch from Open-Meteo API
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation',
        'weather_code',
        'cloud_cover',
        'pressure_msl',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
      ].join(','),
      hourly: [
        'temperature_2m',
        'precipitation_probability',
        'precipitation',
        'snowfall',
        'cloud_cover',
        'visibility',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'uv_index',
      ].join(','),
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'snowfall_sum',
        'precipitation_probability_max',
        'wind_speed_10m_max',
        'wind_gusts_10m_max',
        'uv_index_max',
      ].join(','),
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      precipitation_unit: 'inch',
      timezone: 'auto',
      forecast_days: '7',
      past_days: '14',
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.statusText}`);
    }

    const data: OpenMeteoResponse = await response.json();

    // Transform to our schema
    const weatherData: WeatherData = {
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        elevation: data.elevation,
      },
      current: {
        time: data.current.time,
        temperature: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        precipitation: data.current.precipitation,
        weatherCode: data.current.weather_code,
        weatherDescription: getWeatherDescription(data.current.weather_code),
        cloudCover: data.current.cloud_cover,
        pressure: data.current.pressure_msl,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m,
        windDirectionCardinal: getCardinalDirection(data.current.wind_direction_10m),
        windGusts: data.current.wind_gusts_10m,
      },
      hourly: {
        time: data.hourly.time,
        temperature: data.hourly.temperature_2m,
        precipitationProbability: data.hourly.precipitation_probability,
        precipitation: data.hourly.precipitation,
        snowfall: data.hourly.snowfall,
        cloudCover: data.hourly.cloud_cover,
        visibility: data.hourly.visibility,
        windSpeed: data.hourly.wind_speed_10m,
        windDirection: data.hourly.wind_direction_10m,
        windGusts: data.hourly.wind_gusts_10m,
        uvIndex: data.hourly.uv_index,
      },
      daily: {
        time: data.daily.time,
        temperatureMax: data.daily.temperature_2m_max,
        temperatureMin: data.daily.temperature_2m_min,
        precipitationSum: data.daily.precipitation_sum,
        snowfallSum: data.daily.snowfall_sum,
        precipitationProbabilityMax: data.daily.precipitation_probability_max,
        windSpeedMax: data.daily.wind_speed_10m_max,
        windGustsMax: data.daily.wind_gusts_10m_max,
        uvIndexMax: data.daily.uv_index_max,
      },
      lastUpdated: new Date().toISOString(),
    };

    // Cache the result if center and zone provided
    if (center && zone) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const today = new Date().toISOString().split('T')[0];
      await supabase.from('weather_data').upsert({
        center,
        zone,
        forecast_date: today,
        latitude,
        longitude,
        weather_data: weatherData,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'center,zone,forecast_date',
      });
    }

    return NextResponse.json({
      success: true,
      weather: weatherData,
      cached: false,
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch weather data'
      },
      { status: 500 }
    );
  }
}

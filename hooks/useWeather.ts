import { useState, useEffect } from 'react';
import { WeatherData, WeatherApiResponse } from '@/types/weather';

interface UseWeatherOptions {
  latitude?: number;
  longitude?: number;
  center?: string;
  zone?: string;
  enabled?: boolean;
}

export function useWeather({ latitude, longitude, center, zone, enabled = true }: UseWeatherOptions) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !latitude || !longitude) {
      return;
    }

    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          lat: latitude.toString(),
          lon: longitude.toString(),
        });

        if (center) params.append('center', center);
        if (zone) params.append('zone', zone);

        const response = await fetch(`/api/weather?${params}`);
        const data: WeatherApiResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch weather data');
        }

        setWeather(data.weather || null);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [latitude, longitude, center, zone, enabled]);

  return { weather, loading, error };
}

// Helper to extract coordinates from forecast geometry
export function getCenterCoordinates(geometry: { type: string; coordinates: number[][][] }): {
  latitude: number;
  longitude: number;
} | null {
  if (!geometry || geometry.type !== 'Polygon' || !geometry.coordinates?.[0]?.[0]) {
    return null;
  }

  // Calculate the centroid of the polygon
  const coords = geometry.coordinates[0];
  let totalLon = 0;
  let totalLat = 0;
  let count = 0;

  for (const [lon, lat] of coords) {
    totalLon += lon;
    totalLat += lat;
    count++;
  }

  return {
    latitude: totalLat / count,
    longitude: totalLon / count,
  };
}

// Helper to format temperature
export function formatTemperature(temp: number): string {
  return `${Math.round(temp)}°F`;
}

// Helper to format wind speed
export function formatWindSpeed(speed: number, gusts?: number): string {
  const speedStr = `${Math.round(speed)} mph`;
  if (gusts && gusts > speed + 5) {
    return `${speedStr} (gusts ${Math.round(gusts)} mph)`;
  }
  return speedStr;
}

// Helper to format precipitation
export function formatPrecipitation(precip: number): string {
  if (precip < 0.01) return 'None';
  return `${precip.toFixed(2)}"`;
}

// Helper to get snow condition assessment
export function getSnowConditionSummary(weather: WeatherData): string {
  const current = weather.current;
  const daily = weather.daily;

  const conditions: string[] = [];

  // Temperature analysis
  if (current.temperature < 32) {
    conditions.push('Below freezing conditions');
  } else if (current.temperature > 40) {
    conditions.push('Warming temperatures - increased wet snow avalanche risk');
  }

  // Recent snow
  const recentSnow = daily.snowfallSum[0];
  if (recentSnow > 6) {
    conditions.push(`Heavy recent snowfall (${recentSnow.toFixed(1)}") - elevated avalanche danger`);
  } else if (recentSnow > 2) {
    conditions.push(`Moderate recent snowfall (${recentSnow.toFixed(1)}")`);
  }

  // Wind analysis
  if (current.windSpeed > 20) {
    conditions.push(`Strong winds (${formatWindSpeed(current.windSpeed, current.windGusts)}) - wind slab formation likely`);
  } else if (current.windSpeed > 10) {
    conditions.push(`Moderate winds - possible wind loading`);
  }

  // Precipitation
  if (current.precipitation > 0.1) {
    conditions.push('Active precipitation - changing conditions');
  }

  if (conditions.length === 0) {
    return 'Stable weather conditions';
  }

  return conditions.join('. ') + '.';
}

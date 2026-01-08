/**
 * Open-Meteo API Client
 * Handles weather data fetching
 */

import { WEATHER_API } from '@/constants';

export interface OpenMeteoParams {
  latitude: number;
  longitude: number;
  timezone?: string;
}

export class OpenMeteoClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = WEATHER_API.BASE_URL;
  }

  /**
   * Fetch weather forecast for given coordinates
   */
  async fetchWeather(params: OpenMeteoParams) {
    const url = new URL(`${this.baseUrl}${WEATHER_API.ENDPOINTS.FORECAST}`);

    // Add coordinates
    url.searchParams.set('latitude', params.latitude.toString());
    url.searchParams.set('longitude', params.longitude.toString());

    // Add current weather parameters
    url.searchParams.set('current', [
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
    ].join(','));

    // Add hourly parameters
    url.searchParams.set('hourly', [
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
    ].join(','));

    // Add daily parameters
    url.searchParams.set('daily', [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'snowfall_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'uv_index_max',
    ].join(','));

    // Add configuration
    url.searchParams.set('temperature_unit', WEATHER_API.PARAMS.TEMPERATURE_UNIT);
    url.searchParams.set('wind_speed_unit', WEATHER_API.PARAMS.WIND_SPEED_UNIT);
    url.searchParams.set('precipitation_unit', WEATHER_API.PARAMS.PRECIPITATION_UNIT);
    url.searchParams.set('timezone', params.timezone || 'auto');
    url.searchParams.set('forecast_days', WEATHER_API.PARAMS.FORECAST_DAYS.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Open-Meteo API failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const openMeteoClient = new OpenMeteoClient();

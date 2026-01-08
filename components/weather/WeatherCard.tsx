'use client';

import { WeatherData } from '@/types/weather';
import {
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  Gauge,
  Sun,
  CloudSnow,
} from 'lucide-react';

interface WeatherCardProps {
  weather: WeatherData;
  compact?: boolean;
}

export function WeatherCard({ weather, compact = false }: WeatherCardProps) {
  const current = weather.current;
  const today = weather.daily;

  const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1) return <Sun className="w-6 h-6 text-yellow-400" />;
    if (code === 2 || code === 3) return <Cloud className="w-6 h-6 text-gray-400" />;
    if (code >= 71 && code <= 77) return <Snowflake className="w-6 h-6 text-blue-300" />;
    if (code >= 85 && code <= 86) return <CloudSnow className="w-6 h-6 text-blue-300" />;
    if (code >= 61 && code <= 67) return <CloudRain className="w-6 h-6 text-blue-400" />;
    return <Cloud className="w-6 h-6 text-gray-400" />;
  };

  const getWindWarning = (speed: number, gusts: number) => {
    if (gusts > 35 || speed > 25) return 'text-red-400';
    if (gusts > 25 || speed > 15) return 'text-orange-400';
    return 'text-green-400';
  };

  const getSnowIndicator = (snowfall: number) => {
    if (snowfall > 6) return 'text-purple-400';
    if (snowfall > 2) return 'text-blue-400';
    if (snowfall > 0) return 'text-cyan-400';
    return 'text-gray-400';
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(current.weatherCode)}
            <div>
              <div className="text-2xl font-bold">{Math.round(current.temperature)}°F</div>
              <div className="text-sm text-slate-400">{current.weatherDescription}</div>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 justify-end">
              <Wind className={`w-4 h-4 ${getWindWarning(current.windSpeed, current.windGusts)}`} />
              <span className="text-sm font-medium">{Math.round(current.windSpeed)} mph {current.windDirectionCardinal}</span>
            </div>
            {today.snowfallSum[0] > 0 && (
              <div className="flex items-center gap-2 justify-end">
                <Snowflake className={`w-4 h-4 ${getSnowIndicator(today.snowfallSum[0])}`} />
                <span className="text-sm font-medium">{today.snowfallSum[0].toFixed(1)}" snow today</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Current Conditions</h3>
          <p className="text-sm text-slate-400">
            Last updated: {new Date(current.time).toLocaleTimeString()}
          </p>
        </div>
        {getWeatherIcon(current.weatherCode)}
      </div>

      {/* Main Weather Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Thermometer className="w-4 h-4" />
            <span>Temperature</span>
          </div>
          <div className="text-3xl font-bold">{Math.round(current.temperature)}°F</div>
          <div className="text-sm text-slate-400">Feels like {Math.round(current.feelsLike)}°F</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Wind className="w-4 h-4" />
            <span>Wind</span>
          </div>
          <div className={`text-2xl font-bold ${getWindWarning(current.windSpeed, current.windGusts)}`}>
            {Math.round(current.windSpeed)} mph
          </div>
          <div className="text-sm text-slate-400">
            {current.windDirectionCardinal} • Gusts {Math.round(current.windGusts)} mph
          </div>
        </div>
      </div>

      {/* Weather Description */}
      <div className="bg-slate-800/50 rounded-lg p-4">
        <div className="text-center">
          <div className="text-lg font-medium text-white">{current.weatherDescription}</div>
        </div>
      </div>

      {/* Additional Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/30 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Droplets className="w-3 h-3" />
            <span>Humidity</span>
          </div>
          <div className="text-lg font-semibold">{current.humidity}%</div>
        </div>

        <div className="bg-slate-800/30 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Cloud className="w-3 h-3" />
            <span>Cloud Cover</span>
          </div>
          <div className="text-lg font-semibold">{current.cloudCover}%</div>
        </div>

        <div className="bg-slate-800/30 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Gauge className="w-3 h-3" />
            <span>Pressure</span>
          </div>
          <div className="text-lg font-semibold">{Math.round(current.pressure)} mb</div>
        </div>

        {current.precipitation > 0 && (
          <div className="bg-slate-800/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <CloudRain className="w-3 h-3" />
              <span>Precipitation</span>
            </div>
            <div className="text-lg font-semibold">{current.precipitation.toFixed(2)}"</div>
          </div>
        )}

        {today.uvIndexMax[0] > 0 && (
          <div className="bg-slate-800/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Sun className="w-3 h-3" />
              <span>UV Index</span>
            </div>
            <div className="text-lg font-semibold">{today.uvIndexMax[0].toFixed(1)}</div>
          </div>
        )}

        <div className="bg-slate-800/30 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Thermometer className="w-3 h-3" />
            <span>Today's Range</span>
          </div>
          <div className="text-sm font-semibold">
            {Math.round(today.temperatureMin[0])}° - {Math.round(today.temperatureMax[0])}°F
          </div>
        </div>
      </div>

      {/* Snow Forecast */}
      {today.snowfallSum[0] > 0 && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-700/30">
          <div className="flex items-center gap-3">
            <Snowflake className={`w-6 h-6 ${getSnowIndicator(today.snowfallSum[0])}`} />
            <div className="flex-1">
              <div className="text-sm text-slate-400">Expected Snowfall Today</div>
              <div className={`text-2xl font-bold ${getSnowIndicator(today.snowfallSum[0])}`}>
                {today.snowfallSum[0].toFixed(1)}"
              </div>
            </div>
            {today.precipitationProbabilityMax[0] > 0 && (
              <div className="text-right">
                <div className="text-sm text-slate-400">Probability</div>
                <div className="text-lg font-semibold">{today.precipitationProbabilityMax[0]}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wind Warning */}
      {(current.windSpeed > 15 || current.windGusts > 25) && (
        <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Wind className="w-5 h-5 text-orange-400 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="font-semibold text-orange-300">
                {current.windGusts > 35 ? 'Strong Wind Warning' : 'Moderate Winds'}
              </div>
              <div className="text-sm text-slate-300">
                {current.windGusts > 35
                  ? 'Very strong winds can cause significant wind loading and wind slab formation. Avoid lee slopes and cornices.'
                  : 'Moderate winds may cause wind loading on lee slopes. Monitor for wind slabs.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Forecast Summary */}
      <div className="border-t border-slate-700/50 pt-4">
        <h4 className="text-sm font-semibold text-slate-400 mb-3">7-Day Outlook</h4>
        <div className="grid grid-cols-7 gap-2">
          {today.time.slice(0, 7).map((date, index) => {
            const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            const isToday = index === 0;

            return (
              <div
                key={date}
                className={`text-center p-2 rounded-lg ${
                  isToday ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-slate-800/30'
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">{isToday ? 'Today' : dayName}</div>
                <div className="text-sm font-semibold">
                  {Math.round(today.temperatureMax[index])}°
                </div>
                <div className="text-xs text-slate-500">
                  {Math.round(today.temperatureMin[index])}°
                </div>
                {today.snowfallSum[index] > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Snowflake className="w-3 h-3 text-blue-300" />
                    <span className="text-xs text-blue-300">{today.snowfallSum[index].toFixed(0)}"</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

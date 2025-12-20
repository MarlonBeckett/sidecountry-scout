import { useState, useEffect } from 'react';

export interface ForecastData {
  id: string;
  zone: string;
  center: string;
  state: string;
  timezone: string;
  dates: {
    start: string;
    end: string;
  };
  danger: {
    overall: number;
    high: number;
    middle: number;
    low: number;
  };
  travelAdvice: string;
  url: string;
  warning: {
    product: string;
    published_time: string;
  } | null;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export interface ForecastsResponse {
  success: boolean;
  count: number;
  forecasts: ForecastData[];
}

export function useAvalancheForecasts(centerId?: string) {
  const [data, setData] = useState<ForecastsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = centerId
          ? `/api/forecasts?center=${centerId}`
          : '/api/forecasts';

        const response = await fetch(url);
        const json = await response.json();

        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch forecasts');
        }

        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchForecasts();
  }, [centerId]);

  return { data, loading, error };
}

// Helper function to get unique centers
export function getUniqueCenters(forecasts: ForecastData[]) {
  const centersMap = new Map<string, { name: string; state: string; zones: string[] }>();

  forecasts.forEach(forecast => {
    if (!centersMap.has(forecast.center)) {
      centersMap.set(forecast.center, {
        name: forecast.center,
        state: forecast.state,
        zones: [forecast.zone],
      });
    } else {
      centersMap.get(forecast.center)!.zones.push(forecast.zone);
    }
  });

  return Array.from(centersMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

// Helper to get danger level info
export function getDangerLevelInfo(level: number) {
  const levels = {
    '-1': { label: 'No Rating', color: 'slate', bgClass: 'bg-slate-500/20', borderClass: 'border-slate-500/30', textClass: 'text-slate-400' },
    '1': { label: 'Low', color: 'green', bgClass: 'bg-green-500/20', borderClass: 'border-green-500/30', textClass: 'text-green-400' },
    '2': { label: 'Moderate', color: 'yellow', bgClass: 'bg-yellow-500/20', borderClass: 'border-yellow-500/30', textClass: 'text-yellow-400' },
    '3': { label: 'Considerable', color: 'orange', bgClass: 'bg-orange-500/20', borderClass: 'border-orange-500/30', textClass: 'text-orange-400' },
    '4': { label: 'High', color: 'red', bgClass: 'bg-red-500/20', borderClass: 'border-red-500/30', textClass: 'text-red-400' },
    '5': { label: 'Extreme', color: 'purple', bgClass: 'bg-purple-500/20', borderClass: 'border-purple-500/30', textClass: 'text-purple-400' },
  };

  return levels[level.toString() as keyof typeof levels] || levels['-1'];
}

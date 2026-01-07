'use client';

import LocationSelectorSheet from '@/components/LocationSelectorSheet';
import { Lightbulb, ChevronDown, Sparkles, MapPin } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAvalancheForecasts, getUniqueCenters, getDangerLevelInfo } from '@/hooks/useAvalancheForecasts';
import { useBriefing } from '@/hooks/useBriefing';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useWeather, getCenterCoordinates } from '@/hooks/useWeather';
import { WeatherCard } from '@/components/WeatherCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function BriefingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedCenter, setSelectedCenter] = useState<{ id: string; name: string; state: string; zoneCount: number; zones?: string[] } | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const { data, loading, error } = useAvalancheForecasts();

  const centers = useMemo(() => {
    if (!data?.forecasts) return [];
    const unique = getUniqueCenters(data.forecasts);
    return unique.map(c => ({
      id: c.name,
      name: c.name,
      state: c.state,
      zoneCount: c.zones.length,
      zones: c.zones
    }));
  }, [data]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || centers.length === 0) return;

    const loadPreferences = async () => {
      try {
        const response = await fetch(`/api/preferences?userId=${user.id}`);
        const data = await response.json();

        if (data.success && data.preferences) {
          const { selected_center, selected_zone } = data.preferences;

          if (selected_center) {
            const matchingCenter = centers.find(c => c.id === selected_center);
            if (matchingCenter) {
              setSelectedCenter(matchingCenter);
            }
          }

          if (selected_zone) {
            setSelectedZone(selected_zone);
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setPreferencesLoaded(true);
      }
    };

    loadPreferences();
  }, [user, centers]);

  useEffect(() => {
    if (!preferencesLoaded || !user) return;

    const savePreferences = async () => {
      try {
        await fetch('/api/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            selectedCenter: selectedCenter?.id || null,
            selectedZone: selectedZone || null,
          }),
        });
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    };

    savePreferences();
  }, [selectedCenter, selectedZone, preferencesLoaded, user]);

  const centerForecasts = useMemo(() => {
    if (!data?.forecasts || !selectedCenter) return [];
    let forecasts = data.forecasts.filter(f => f.center === selectedCenter.id);

    if (selectedZone) {
      forecasts = forecasts.filter(f => f.zone === selectedZone);
    }

    return forecasts;
  }, [data, selectedCenter, selectedZone]);

  const maxDangerLevel = useMemo(() => {
    if (centerForecasts.length === 0) return -1;
    return Math.max(...centerForecasts.map(f => f.danger.overall));
  }, [centerForecasts]);

  const dangerInfo = getDangerLevelInfo(maxDangerLevel);
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const { briefing, loading: briefingLoading, generating, error: briefingError } = useBriefing(
    selectedCenter?.id || null,
    selectedZone
  );

  const forecastCoordinates = useMemo(() => {
    if (centerForecasts.length === 0) return null;
    return getCenterCoordinates(centerForecasts[0].geometry);
  }, [centerForecasts]);

  const { weather, loading: weatherLoading, error: weatherError } = useWeather({
    latitude: forecastCoordinates?.latitude,
    longitude: forecastCoordinates?.longitude,
    center: selectedCenter?.id,
    zone: selectedZone || undefined,
    enabled: !!forecastCoordinates && !!selectedCenter && !!selectedZone,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading forecasts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="size-16 rounded-full bg-destructive/20 border border-destructive/30 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold">Failed to Load</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Today&apos;s Breakdown
            </h1>
            <p className="text-muted-foreground">{currentDate}</p>
          </div>
          {maxDangerLevel > -1 && (
            <Badge variant="outline">
              {dangerInfo.label}
            </Badge>
          )}
        </div>

        {/* Location Selector */}
        <LocationSelectorSheet
          options={centers}
          selected={selectedCenter}
          selectedZone={selectedZone}
          onSelect={(center, zone) => {
            setSelectedCenter(center);
            setSelectedZone(zone || null);
          }}
          size="large"
          currentDate={currentDate}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - AI Briefing */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-5 h-5" />
                  <div>
                    <CardTitle>Scout Briefing</CardTitle>
                    <CardDescription>
                      AI Analysis • {currentDate}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  {briefingError ? (
                    <p className="text-sm text-destructive">Error: {briefingError}</p>
                  ) : briefingLoading || generating ? (
                    <div className="flex items-center gap-3 py-8">
                      <div className="size-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-sm text-muted-foreground">
                        {generating ? 'Generating briefing with AI...' : 'Loading briefing...'}
                      </p>
                    </div>
                  ) : briefing ? (
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {briefing.briefing_text}
                    </p>
                  ) : !selectedCenter || !selectedZone ? (
                    <div className="py-12 text-center">
                      <div className="mb-4">
                        <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-4">
                          <MapPin size={28} />
                        </div>
                      </div>
                      <p className="text-base mb-2">
                        Welcome to Sidecountry Scout
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Select your avalanche center and zone above to get started.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Loading briefing data...
                    </p>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} />
                    <span>Powered by Gemini AI</span>
                  </div>
                  {briefing && (
                    <Badge variant="outline" className="text-xs">
                      Live
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Avalanche Problems */}
            {briefing?.problems && Array.isArray(briefing.problems) && briefing.problems.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Details</h2>

                <div className="space-y-3">
                  {briefing.problems.map((problem: any, index: number) => (
                    <details key={index} className="group" open={index === 0}>
                      <summary className="cursor-pointer list-none">
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  {problem.name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  Problem #{index + 1} • {problem.likelihood} • {problem.size}
                                </CardDescription>
                              </div>
                              <ChevronDown size={20} className="transition-transform group-open:rotate-180" />
                            </div>
                          </CardHeader>
                        </Card>
                      </summary>
                      <Card className="mt-2">
                        <CardContent className="pt-6">
                          <p className="text-sm leading-relaxed whitespace-pre-line">
                            {problem.description}
                          </p>
                        </CardContent>
                      </Card>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Weather */}
          <div className="lg:col-span-1">
            {weather && selectedCenter && selectedZone && (
              <div className="sticky top-8">
                <WeatherCard weather={weather} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

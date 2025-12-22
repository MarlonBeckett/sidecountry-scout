'use client';

import BottomNav from '@/components/BottomNav';
import LocationSelectorSheet from '@/components/LocationSelectorSheet';
import { Lightbulb, Quote, ChevronDown, Sparkles, MapPin } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useAvalancheForecasts, getUniqueCenters, getDangerLevelInfo } from '@/hooks/useAvalancheForecasts';
import { useBriefing } from '@/hooks/useBriefing';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useWeather, getCenterCoordinates } from '@/hooks/useWeather';
import { WeatherCard } from '@/components/WeatherCard';

export default function BriefingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCenter, setSelectedCenter] = useState<{ id: string; name: string; state: string; zoneCount: number; zones?: string[] } | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Fetch all forecasts
  const { data, loading, error } = useAvalancheForecasts();

  // Get unique centers (no auto-selection)
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

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Load saved preferences from database
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

  // Current selected center (null if nothing selected)
  const currentSelectedCenter = selectedCenter;

  // Save preferences to database when they change
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
            selectedCenter: currentSelectedCenter?.id || null,
            selectedZone: selectedZone || null,
          }),
        });
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    };

    savePreferences();
  }, [currentSelectedCenter, selectedZone, preferencesLoaded, user]);

  // Get forecasts for selected center (and zone if selected)
  const centerForecasts = useMemo(() => {
    if (!data?.forecasts || !currentSelectedCenter) return [];
    let forecasts = data.forecasts.filter(f => f.center === currentSelectedCenter.id);

    // If a zone is selected, filter to just that zone
    if (selectedZone) {
      forecasts = forecasts.filter(f => f.zone === selectedZone);
    }

    return forecasts;
  }, [data, currentSelectedCenter, selectedZone]);

  // Get highest danger level from all zones in selected center
  const maxDangerLevel = useMemo(() => {
    if (centerForecasts.length === 0) return -1;
    return Math.max(...centerForecasts.map(f => f.danger.overall));
  }, [centerForecasts]);

  const dangerInfo = getDangerLevelInfo(maxDangerLevel);

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Fetch AI briefing (automatically fetches forecast data from Supabase/API)
  const { briefing, loading: briefingLoading, generating, error: briefingError } = useBriefing(
    currentSelectedCenter?.id || null,
    selectedZone
  );

  // Get coordinates from the first forecast in the selected zone
  const forecastCoordinates = useMemo(() => {
    if (centerForecasts.length === 0) return null;
    return getCenterCoordinates(centerForecasts[0].geometry);
  }, [centerForecasts]);

  // Fetch weather data
  const { weather, loading: weatherLoading, error: weatherError } = useWeather({
    latitude: forecastCoordinates?.latitude,
    longitude: forecastCoordinates?.longitude,
    center: currentSelectedCenter?.id,
    zone: selectedZone || undefined,
    enabled: !!forecastCoordinates && !!currentSelectedCenter && !!selectedZone,
  });

  // Debug logging
  useEffect(() => {
    console.log('Briefing state:', {
      center: currentSelectedCenter?.id,
      zone: selectedZone,
      briefing,
      loading: briefingLoading,
      generating,
      error: briefingError
    });
  }, [currentSelectedCenter, selectedZone, briefing, briefingLoading, generating, briefingError]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;

        // Detect scroll direction
        if (scrollTop > lastScrollY.current && scrollTop > 10) {
          setScrollDirection('down');
        } else if (scrollTop < lastScrollY.current) {
          setScrollDirection('up');
        }

        lastScrollY.current = scrollTop;
        setScrollY(scrollTop);
        console.log('Scroll Y:', scrollTop); // Debug log
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="relative flex flex-col h-screen w-full max-w-md mx-auto bg-background-dark items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-display uppercase tracking-wider">Loading forecasts...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="relative flex flex-col h-screen w-full max-w-md mx-auto bg-background-dark items-center justify-center px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="size-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">Failed to Load</h2>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen w-full max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-slate-200 dark:border-primary/10">
      {/* Scrollable Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">

        {/* Large Header - scrolls away naturally */}
        <header className="pt-6 pb-6 px-5">
          <div>
            <h1 className="text-[1.75rem] font-display font-bold leading-[0.9] tracking-tight text-white mb-3">
              TODAY&apos;S<br/>BREAKDOWN
            </h1>
            <div className="h-[2px] w-12 bg-gradient-to-r from-primary to-transparent rounded-full mb-4"></div>

            {/* Location Selector Card */}
            <LocationSelectorSheet
              options={centers}
              selected={currentSelectedCenter}
              selectedZone={selectedZone}
              onSelect={(center, zone) => {
                setSelectedCenter(center);
                setSelectedZone(zone || null);
              }}
              size="large"
              currentDate={currentDate}
            />
          </div>
        </header>

        <main className="px-5 pt-2 pb-32 space-y-7">
        {/* AI Briefing - Hero Card */}
        <section className="relative opacity-0 animate-fade-in-up delay-200">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-dark via-surface-lighter to-surface-dark border border-primary/20 shadow-elevation">
            {/* Diagonal Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent blur-2xl"></div>

            {/* Quote Icon Background */}
            <div className="absolute bottom-0 right-4 opacity-[0.04]">
              <Quote size={120} className="text-primary" />
            </div>

            <div className="relative z-10 p-6 flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-11 rounded-xl bg-primary/15 text-primary border border-primary/30 backdrop-blur-sm">
                  <Lightbulb size={20} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-display font-bold text-white tracking-wide mb-0.5">SCOUT BRIEFING</h2>
                  <p className="text-[10px] font-display font-medium text-slate-500 uppercase tracking-[0.15em]">
                    AI Analysis • {currentDate}
                  </p>
                </div>
              </div>

              {/* Briefing Content */}
              <div className="relative pl-5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-primary before:to-glacier before:rounded-full">
                {briefingError ? (
                  <div className="py-4">
                    <p className="text-sm text-red-400">
                      Error: {briefingError}
                    </p>
                  </div>
                ) : briefingLoading || generating ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="size-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-400">
                      {generating ? 'Generating briefing with AI...' : 'Loading briefing...'}
                    </p>
                  </div>
                ) : briefing ? (
                  <p className="text-[15px] leading-relaxed text-slate-200 whitespace-pre-line">
                    {briefing.briefing_text}
                  </p>
                ) : !currentSelectedCenter || !selectedZone ? (
                  <div className="py-6 text-center">
                    <div className="mb-4">
                      <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 border-2 border-primary/30 mb-3">
                        <MapPin size={28} className="text-primary" />
                      </div>
                    </div>
                    <p className="text-[15px] leading-relaxed text-slate-300 mb-2">
                      Welcome to SideCountry Scout!
                    </p>
                    <p className="text-sm leading-relaxed text-slate-400">
                      Select your avalanche center and zone above to get started with your personalized AI briefing.
                    </p>
                  </div>
                ) : (
                  <p className="text-[15px] leading-relaxed text-slate-400 italic">
                    Loading briefing data...
                  </p>
                )}
              </div>

              {/* Verification Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" />
                  <span className="text-[10px] text-primary font-display font-medium uppercase tracking-wide">
                    Powered by Gemini AI
                  </span>
                </div>
                {briefing && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/30">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-[9px] font-display font-bold text-primary uppercase tracking-wider">Live</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Weather Section */}
        {weather && currentSelectedCenter && selectedZone && (
          <section className="opacity-0 animate-fade-in-up delay-250">
            <WeatherCard weather={weather} />
          </section>
        )}

        {/* The Details Section */}
        <section className="opacity-0 animate-fade-in-up delay-300">
          <div className="flex items-end justify-between mb-5 px-1">
            <div>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight mb-1">THE DETAILS</h2>
              <div className="h-0.5 w-12 bg-gradient-to-r from-sunset to-transparent rounded-full"></div>
            </div>
            {maxDangerLevel > -1 && (
              <div className={`px-3 py-1.5 rounded-lg ${dangerInfo.bgClass} border ${dangerInfo.borderClass} backdrop-blur-sm`}>
                <span className={`${dangerInfo.textClass} text-[10px] font-display font-bold uppercase tracking-[0.15em] flex items-center gap-1.5`}>
                  <span className={`size-1.5 rounded-full bg-${dangerInfo.color}-500 animate-pulse`}></span>
                  {dangerInfo.label}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3.5">
            {briefing?.problems && Array.isArray(briefing.problems) && briefing.problems.length > 0 ? (
              briefing.problems.map((problem: any, index: number) => {
                const colors = [
                  { border: 'border-orange-500/30', hover: 'hover:border-orange-500/50', text: 'text-orange-400', dot: 'bg-orange-500' },
                  { border: 'border-yellow-500/20', hover: 'hover:border-yellow-500/40', text: 'text-yellow-400', dot: 'bg-yellow-400' },
                  { border: 'border-glacier/20', hover: 'hover:border-glacier/40', text: 'text-glacier', dot: 'bg-glacier' }
                ];
                const color = colors[index % 3];

                return (
                  <details key={index} className={`group rounded-xl bg-surface-dark border ${color.border} overflow-hidden ${color.hover} transition-all shadow-lg`} open={index === 0}>
                    <summary className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-white/[0.03] transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative">
                          <div className={`size-2.5 rounded-full ${color.dot} ${index === 0 ? 'animate-pulse-glow' : ''}`}></div>
                          {index === 0 && <div className={`absolute inset-0 size-2.5 rounded-full ${color.dot} blur-sm`}></div>}
                        </div>
                        <div className="flex-1">
                          <span className="font-display font-bold text-sm text-white tracking-wide block uppercase">
                            {problem.name}
                          </span>
                          <span className={`text-[9px] font-display ${color.text} uppercase tracking-wider`}>
                            Problem #{index + 1} • {problem.likelihood} • {problem.size}
                          </span>
                        </div>
                      </div>
                      <ChevronDown size={20} className="text-slate-500 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-4 pb-4 pt-2">
                      <div className={`pt-3 border-t ${color.border}`}>
                        <p className="text-[15px] leading-relaxed text-slate-300 whitespace-pre-line">
                          {problem.description}
                        </p>
                      </div>
                    </div>
                  </details>
                );
              })
            ) : briefing && !briefing.problems ? (
              <div className="py-8 text-center space-y-4">
                <p className="text-slate-400 text-sm">
                  This briefing was generated before problem details were added.
                </p>
                <button
                  onClick={async () => {
                    if (!currentSelectedCenter || !selectedZone) return;

                    // Delete the old briefing to trigger regeneration
                    try {
                      await fetch('/api/briefings/regenerate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          center: currentSelectedCenter.id,
                          zone: selectedZone
                        })
                      });
                      // Refresh the page to load the new briefing
                      window.location.reload();
                    } catch (err) {
                      console.error('Failed to regenerate:', err);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-background-dark font-display font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all"
                >
                  Regenerate with Problems
                </button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-slate-400 text-sm">
                  {briefingLoading || generating ? 'Loading avalanche problems...' : 'Select a zone to see avalanche problem details'}
                </p>
              </div>
            )}
          </div>
        </section>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

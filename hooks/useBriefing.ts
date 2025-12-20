import { useState, useEffect } from 'react';

interface AvalancheProblem {
  name: string;
  description: string;
  likelihood: string;
  size: string;
}

interface Briefing {
  id: string;
  center: string;
  zone: string;
  forecast_date: string;
  danger_level: number;
  briefing_text: string;
  problems?: AvalancheProblem[];
  created_at: string;
  updated_at: string;
}

interface UseBriefingResult {
  briefing: Briefing | null;
  loading: boolean;
  error: string | null;
  generating: boolean;
}

export function useBriefing(
  center: string | null,
  zone: string | null
): UseBriefingResult {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!center || !zone) {
      setBriefing(null);
      return;
    }

    const fetchBriefing = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, try to fetch existing briefing
        const response = await fetch(
          `/api/briefings?center=${encodeURIComponent(center)}&zone=${encodeURIComponent(zone)}`
        );
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch briefing');
        }

        if (data.briefing) {
          // Briefing exists, use it
          setBriefing(data.briefing);
        } else {
          // No briefing exists, generate one
          // The API will automatically fetch the forecast and generate the briefing
          setGenerating(true);
          const generateResponse = await fetch('/api/briefings/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              center,
              zone,
            }),
          });

          const generateData = await generateResponse.json();

          if (!generateData.success) {
            throw new Error(generateData.error || 'Failed to generate briefing');
          }

          setBriefing(generateData.briefing);
          setGenerating(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setGenerating(false);
      } finally {
        setLoading(false);
      }
    };

    fetchBriefing();
  }, [center, zone]);

  return { briefing, loading, error, generating };
}

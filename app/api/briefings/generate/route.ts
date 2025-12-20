import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.google_gemini_api || '');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nycbrohrtvteopadoyct.supabase.co',
  process.env.NEXT_SECRET_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface GenerateBriefingRequest {
  center: string;
  zone: string;
}

const DANGER_LEVELS = {
  '-1': 'No Rating',
  '1': 'Low',
  '2': 'Moderate',
  '3': 'Considerable',
  '4': 'High',
  '5': 'Extreme'
};

export async function POST(request: Request) {
  try {
    const body: GenerateBriefingRequest = await request.json();
    const { center, zone } = body;

    if (!center || !zone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: center and zone' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if briefing already exists for today
    const { data: existingBriefing } = await supabase
      .from('avalanche_briefings')
      .select('*')
      .eq('center', center)
      .eq('zone', zone)
      .eq('forecast_date', today)
      .single();

    if (existingBriefing) {
      return NextResponse.json({
        success: true,
        briefing: existingBriefing,
        cached: true
      });
    }

    // Step 1: Fetch the latest forecast for this zone from Supabase
    const { data: forecast, error: forecastError } = await supabase
      .from('avalanche_forecasts')
      .select('*')
      .eq('center', center)
      .eq('zone', zone)
      .eq('forecast_date', today)
      .single();

    if (forecastError || !forecast) {
      // If no forecast in Supabase, fetch from Avalanche.org API
      console.log('No forecast in cache, fetching from API...');

      try {
        // Use the correct base URL for internal API calls
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const apiResponse = await fetch(`${baseUrl}/api/forecasts`);
        const apiData = await apiResponse.json();

        if (!apiData.success) {
          throw new Error('Failed to fetch forecasts from API');
        }

        // Find the specific zone forecast
        const zoneForecast = apiData.forecasts.find((f: any) =>
          f.center === center && f.zone === zone
        );

        if (!zoneForecast) {
          return NextResponse.json(
            { success: false, error: 'Forecast not found for this zone' },
            { status: 404 }
          );
        }

        // Use the fetched forecast data
        const forecastData = {
          danger_overall: zoneForecast.danger.overall,
          danger_high: zoneForecast.danger.high,
          danger_middle: zoneForecast.danger.middle,
          danger_low: zoneForecast.danger.low,
          travel_advice: zoneForecast.travelAdvice,
          forecast_url: zoneForecast.url
        };

        return await generateAndStoreBriefing(center, zone, today, forecastData);
      } catch (apiError) {
        console.error('Error fetching from API:', apiError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch forecast data' },
          { status: 500 }
        );
      }
    }

    // Use the cached forecast data
    const forecastData = {
      danger_overall: forecast.danger_overall,
      danger_high: forecast.danger_high,
      danger_middle: forecast.danger_middle,
      danger_low: forecast.danger_low,
      travel_advice: forecast.travel_advice,
      forecast_url: forecast.forecast_url
    };

    return await generateAndStoreBriefing(center, zone, today, forecastData);

  } catch (error) {
    console.error('Error generating briefing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate briefing'
      },
      { status: 500 }
    );
  }
}

async function generateAndStoreBriefing(
  center: string,
  zone: string,
  today: string,
  forecastData: {
    danger_overall: number;
    danger_high: number | null;
    danger_middle: number | null;
    danger_low: number | null;
    travel_advice: string;
    forecast_url: string;
  }
) {
  // Generate briefing with Gemini
  // Use gemini-2.5-flash - latest stable flash model with good rate limits
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash'
  });

  // Helper function to get danger level text, handling null values
  const getDangerText = (level: number | null): string => {
    if (level === null || level === undefined) return 'No Data';
    return `${DANGER_LEVELS[level.toString() as keyof typeof DANGER_LEVELS]} (${level}/5)`;
  };

  const prompt = `You are a backcountry avalanche safety expert who teaches recreational skiers and snowboarders about avalanche conditions in a clear, educational way.

Create a briefing for the following avalanche forecast:

**Location:** ${zone}, ${center}
**Overall Danger Level:** ${getDangerText(forecastData.danger_overall)}
**Danger by Elevation:**
- Above Treeline: ${getDangerText(forecastData.danger_high)}
- Near Treeline: ${getDangerText(forecastData.danger_middle)}
- Below Treeline: ${getDangerText(forecastData.danger_low)}
**Official Travel Advice:** ${forecastData.travel_advice || 'No specific advice provided'}

Your response must be valid JSON in this exact format:
{
  "briefing": "2-3 paragraph briefing text here",
  "problems": [
    {
      "name": "Problem name (e.g., Wind Slabs, Persistent Slab, Wet Snow)",
      "description": "1-2 paragraph educational explanation of this problem. Explain what it is, why it's happening, what terrain to avoid, and what signs to look for. Use analogies and simple language.",
      "likelihood": "Possible/Likely/Very Likely/Almost Certain",
      "size": "Small/Medium/Large/Very Large"
    }
  ]
}

For the briefing field:
1. Explain what the danger level means in practical terms (what can you do safely?)
2. Teach WHY these conditions exist (weather patterns, snowpack structure, etc.)
3. Provide actionable terrain selection advice
4. Use analogies or simple explanations to help beginners understand

For the problems array:
- Identify 1-3 most likely avalanche problems for these conditions
- Each problem should have an educational description teaching users about the hazard
- Be specific about terrain features, aspects, and elevations where this problem exists
- Explain warning signs (sounds, cracks, recent avalanches, etc.)

Keep it conversational, like a knowledgeable friend giving advice. Avoid jargon unless you explain it. Make it educational but not preachy.

IMPORTANT: Return ONLY valid JSON, no additional text before or after.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Parse the JSON response
  let briefingData;
  try {
    // Clean up the response text (remove markdown code blocks if present)
    let cleanedText = responseText.trim();

    // Remove ```json and ``` markers
    cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/,'').trim();

    briefingData = JSON.parse(cleanedText);
  } catch (parseError) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error('AI returned invalid JSON format');
  }

  // Store in Supabase
  const { data: newBriefing, error: insertError } = await supabase
    .from('avalanche_briefings')
    .insert({
      center,
      zone,
      forecast_date: today,
      danger_level: forecastData.danger_overall,
      briefing_text: briefingData.briefing,
      problems: briefingData.problems
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting briefing:', insertError);
    throw new Error('Failed to store briefing');
  }

  return NextResponse.json({
    success: true,
    briefing: newBriefing,
    cached: false
  });
}

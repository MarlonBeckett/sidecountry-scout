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

// Helper function to strip HTML tags and decode entities
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  let text = html.replace(/<[^>]*>/g, ' ');
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
  return text.replace(/\s+/g, ' ').trim();
}

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
          forecast_url: zoneForecast.url,
          // Product API fields
          bottom_line: zoneForecast.bottomLine,
          hazard_discussion: zoneForecast.hazardDiscussion,
          weather_discussion: zoneForecast.weatherDiscussion,
          forecast_avalanche_problems: zoneForecast.avalancheProblems,
          media: zoneForecast.media,
          has_product_data: zoneForecast.hasFullForecast,
          geometry: zoneForecast.geometry
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
      forecast_url: forecast.forecast_url,
      // Product API fields
      bottom_line: forecast.bottom_line,
      hazard_discussion: forecast.hazard_discussion,
      weather_discussion: forecast.weather_discussion,
      forecast_avalanche_problems: forecast.forecast_avalanche_problems,
      media: forecast.media,
      has_product_data: forecast.has_product_data,
      geometry: forecast.geometry
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
    // Product API fields
    bottom_line?: string | null;
    hazard_discussion?: string | null;
    weather_discussion?: string | null;
    forecast_avalanche_problems?: any[];
    media?: any[];
    has_product_data?: boolean;
    geometry?: any;
  }
) {
  // Fetch weather data if geometry is available
  let weatherData = null;
  if (forecastData.geometry?.coordinates?.[0]?.[0]) {
    try {
      const coords = forecastData.geometry.coordinates[0];
      let totalLon = 0;
      let totalLat = 0;
      let count = 0;

      for (const [lon, lat] of coords) {
        totalLon += lon;
        totalLat += lat;
        count++;
      }

      const centerLat = totalLat / count;
      const centerLon = totalLon / count;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const weatherResponse = await fetch(
        `${baseUrl}/api/weather?lat=${centerLat}&lon=${centerLon}&center=${center}&zone=${zone}`
      );
      const weatherJson = await weatherResponse.json();

      if (weatherJson.success && weatherJson.weather) {
        weatherData = weatherJson.weather;
      }
    } catch (weatherError) {
      console.error('Error fetching weather for briefing:', weatherError);
      // Continue without weather data
    }
  }

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

  // Build enhanced prompt with Product API data
  let promptContext = `**Location:** ${zone}, ${center}
**Overall Danger Level:** ${getDangerText(forecastData.danger_overall)}
**Danger by Elevation:**
- Above Treeline: ${getDangerText(forecastData.danger_high)}
- Near Treeline: ${getDangerText(forecastData.danger_middle)}
- Below Treeline: ${getDangerText(forecastData.danger_low)}
**Official Travel Advice:** ${forecastData.travel_advice || 'No specific advice provided'}`;

  // Add weather data if available
  if (weatherData) {
    promptContext += '\n\n--- WEATHER DATA ---\n';

    // Calculate historical weather (past 14 days)
    // Open-Meteo returns data with past days first, then current, then future
    // Daily array: [day-14, day-13, ..., day-1, today, tomorrow, ..., day+7]
    // So we need to find "today" in the array
    const todayIndex = weatherData.daily.time.findIndex(date => {
      const dataDate = new Date(date).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      return dataDate === today;
    });

    if (todayIndex > 0) {
      // We have historical data
      const past14Days = weatherData.daily.time.slice(Math.max(0, todayIndex - 14), todayIndex);
      const past14DaysSnow = weatherData.daily.snowfallSum.slice(Math.max(0, todayIndex - 14), todayIndex);
      const past14DaysTemp = weatherData.daily.temperatureMax.slice(Math.max(0, todayIndex - 14), todayIndex);
      const past14DaysWind = weatherData.daily.windGustsMax.slice(Math.max(0, todayIndex - 14), todayIndex);

      const totalSnow14d = past14DaysSnow.reduce((a, b) => a + b, 0);
      const maxWind14d = Math.max(...past14DaysWind);
      const avgTemp14d = past14DaysTemp.reduce((a, b) => a + b, 0) / past14DaysTemp.length;

      promptContext += `**Past 14 Days (Recent Weather History):**
- Total snowfall: ${totalSnow14d.toFixed(1)}"
- Average high temperature: ${Math.round(avgTemp14d)}°F
- Max wind gusts: ${Math.round(maxWind14d)} mph
- Snow days: ${past14DaysSnow.filter(s => s > 0.5).length} days with >0.5" snow

**Day-by-day recent history:**`;

      // Show last 7 days in detail
      const last7Days = Math.min(7, past14Days.length);
      for (let i = past14Days.length - last7Days; i < past14Days.length; i++) {
        const daysAgo = past14Days.length - i;
        const date = new Date(past14Days[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        promptContext += `\n- ${dayName} (${daysAgo}d ago): ${past14DaysSnow[i].toFixed(1)}" snow, High ${Math.round(past14DaysTemp[i])}°F, Wind gusts ${Math.round(past14DaysWind[i])} mph`;
      }

      promptContext += '\n\n';
    }

    promptContext += `**Current Conditions:**
- Temperature: ${Math.round(weatherData.current.temperature)}°F (Feels like ${Math.round(weatherData.current.feelsLike)}°F)
- Weather: ${weatherData.current.weatherDescription}
- Wind: ${Math.round(weatherData.current.windSpeed)} mph ${weatherData.current.windDirectionCardinal} (gusts ${Math.round(weatherData.current.windGusts)} mph)
- Humidity: ${weatherData.current.humidity}%
- Cloud Cover: ${weatherData.current.cloudCover}%
- Current Precipitation: ${weatherData.current.precipitation > 0 ? weatherData.current.precipitation.toFixed(2) + '"' : 'None'}
- Barometric Pressure: ${Math.round(weatherData.current.pressure)} mb

**Today's Forecast:**
- High/Low: ${Math.round(weatherData.daily.temperatureMax[todayIndex])}°F / ${Math.round(weatherData.daily.temperatureMin[todayIndex])}°F
- Precipitation: ${weatherData.daily.precipitationSum[todayIndex].toFixed(2)}" (${weatherData.daily.precipitationProbabilityMax[todayIndex]}% chance)
- Snowfall: ${weatherData.daily.snowfallSum[todayIndex].toFixed(1)}"
- Max Wind: ${Math.round(weatherData.daily.windSpeedMax[todayIndex])} mph (gusts ${Math.round(weatherData.daily.windGustsMax[todayIndex])} mph)
- UV Index: ${weatherData.daily.uvIndexMax[todayIndex].toFixed(1)}

**Next 24 Hours Trends:**`;

    // Find current hour index in hourly data
    const currentHourIndex = weatherData.hourly.time.findIndex(time => {
      return new Date(time) >= new Date();
    });

    if (currentHourIndex >= 0) {
      const next24Hours = weatherData.hourly.time.slice(currentHourIndex, currentHourIndex + 24);
      const tempTrend = weatherData.hourly.temperature.slice(currentHourIndex, currentHourIndex + 24);
      const snowTrend = weatherData.hourly.snowfall.slice(currentHourIndex, currentHourIndex + 24);
      const windTrend = weatherData.hourly.windSpeed.slice(currentHourIndex, currentHourIndex + 24);
      const precipProb = weatherData.hourly.precipitationProbability.slice(currentHourIndex, currentHourIndex + 24);

      const totalSnow24h = snowTrend.reduce((a, b) => a + b, 0);
      const maxWind24h = Math.max(...windTrend);
      const minTemp24h = Math.min(...tempTrend);
      const maxTemp24h = Math.max(...tempTrend);

      promptContext += `
- Temperature range: ${Math.round(minTemp24h)}°F - ${Math.round(maxTemp24h)}°F
- Expected snow: ${totalSnow24h.toFixed(1)}"
- Max wind speed: ${Math.round(maxWind24h)} mph
- Precipitation probability: ${Math.max(...precipProb)}%`;
    }
  }

  // Add Product API data if available
  if (forecastData.has_product_data) {
    promptContext += '\n\n--- OFFICIAL FORECAST DATA ---\n';

    if (forecastData.bottom_line) {
      promptContext += `\n**Bottom Line (from forecasters):**\n${stripHtml(forecastData.bottom_line)}\n`;
    }

    if (forecastData.hazard_discussion) {
      promptContext += `\n**Hazard Discussion:**\n${stripHtml(forecastData.hazard_discussion)}\n`;
    }

    if (forecastData.weather_discussion) {
      promptContext += `\n**Weather Discussion:**\n${stripHtml(forecastData.weather_discussion)}\n`;
    }

    if (forecastData.forecast_avalanche_problems && forecastData.forecast_avalanche_problems.length > 0) {
      promptContext += '\n**Official Avalanche Problems:**\n';
      forecastData.forecast_avalanche_problems.forEach((problem: any, index: number) => {
        promptContext += `\n${index + 1}. ${problem.name || 'Unknown Problem'}\n`;
        promptContext += `   Likelihood: ${problem.likelihood || 'Not specified'}\n`;
        promptContext += `   Size: ${problem.minSize || 'Small'} to ${problem.maxSize || 'Large'}\n`;
        if (problem.discussion) {
          promptContext += `   Discussion: ${stripHtml(problem.discussion)}\n`;
        }
        if (problem.location && problem.location.length > 0) {
          promptContext += `   Affected Areas: ${problem.location.join(', ')}\n`;
        }
      });
    }

    if (forecastData.media && forecastData.media.length > 0) {
      promptContext += `\n**Field Photos Available:** ${forecastData.media.length} photos with observations\n`;
      forecastData.media.forEach((photo: any, index: number) => {
        if (photo.caption) {
          promptContext += `  Photo ${index + 1}: ${stripHtml(photo.caption)}\n`;
        }
      });
    }
  }

  const prompt = `You are a backcountry avalanche safety expert who teaches recreational skiers and snowboarders about avalanche conditions in a clear, educational way.

Create a briefing for the following avalanche forecast:

${promptContext}

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
3. **CRITICAL: Analyze the past 14 days of weather history to understand HOW the current snowpack was built**
   - Recent storm cycles and snow loading patterns
   - Wind events that created wind slabs or loaded specific aspects
   - Temperature trends that created crusts, faceting, or wet snow problems
   - The sequence of weather events that created the current hazard
4. Explain the relationship between PAST weather and CURRENT avalanche problems (this is key!)
5. Connect current conditions and near-term forecast to the existing snowpack structure
6. Provide actionable terrain selection advice based on avalanche forecast, weather history, and current conditions
7. Use analogies or simple explanations to help beginners understand
8. If official forecast data is provided above, USE IT as your primary source of information
9. Synthesize the official bottom line, hazard discussion, weather discussion, historical weather, and current conditions into accessible language

Weather-specific guidance to include when historical/current weather data is available:
**Historical Weather (Past 14 days) - THIS IS CRITICAL:**
- Recent storm cycles: When did snow fall? How much? This is the load on weak layers
- Wind history: When were there strong wind events (>20 mph)? These created wind slabs on specific aspects
- Temperature cycles: Warm-ups that created melt-freeze crusts, cold snaps that created surface hoar or faceting
- Multi-day patterns: Clear cold nights = surface hoar formation, prolonged cold = faceting, warm periods = settlement vs. destabilization
- Storm breaks: Gaps between storms where weak layers formed (surface hoar, near-surface facets)

**Current Conditions:**
- Strong winds (>15 mph): Discuss wind slab formation, wind-loaded slopes, and cornices
- Recent/forecast snow: Explain how new snow adds load to weak layers THAT FORMED IN THE PAST
- Temperature trends: Warming can destabilize snowpack (wet avalanches), freezing can strengthen it
- Rapid temperature changes: Discuss stress on snowpack
- High UV index + clear skies: Discuss sun-exposed slope instability
- Low visibility/cloud cover: Discuss navigation hazards

For the problems array:
- If official avalanche problems are provided above, USE THOSE as your base
- Translate the official problem discussions into educational, beginner-friendly language
- If no official problems are provided, identify 1-3 most likely problems for these conditions
- Each problem should have an educational description teaching users about the hazard
- Be specific about terrain features, aspects, and elevations where this problem exists
- Explain warning signs (sounds, cracks, recent avalanches, etc.)
- If field photo observations are provided, incorporate those details

Keep it conversational, like a knowledgeable friend giving advice. Avoid jargon unless you explain it. Make it educational but not preachy.

IMPORTANT: When official forecast data is available, your briefing should be based on that professional analysis, not speculation.

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

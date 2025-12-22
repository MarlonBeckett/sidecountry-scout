# Sidecountry Scout - Complete Data Flow Documentation

This document explains the entire data flow from user interaction to AI-generated briefings, including all API calls, data transformations, and caching strategies.

---

## Table of Contents
1. [High-Level Overview](#high-level-overview)
2. [Initial App Load](#initial-app-load)
3. [User Selects Center/Zone](#user-selects-centerzone)
4. [Briefing Generation Flow](#briefing-generation-flow)
5. [Weather Data Integration](#weather-data-integration)
6. [AI Prompt Structure](#ai-prompt-structure)
7. [Chat Feature Flow](#chat-feature-flow)
8. [Caching Strategy](#caching-strategy)

---

## High-Level Overview

```
┌─────────────────┐
│   User Opens    │
│   Application   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  1. Fetch ALL Avalanche Centers & Zones     │
│     GET /api/forecasts                      │
│     ↓                                        │
│     - Calls avalanche.org Map-Layer API     │
│     - Calls avalanche.org Product API       │
│     - Stores in Supabase (1hr cache)        │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  2. User Selects Center & Zone              │
│     (Saved to user_preferences table)       │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  3. Fetch/Generate Briefing                 │
│     POST /api/briefings/generate            │
│     ↓                                        │
│     - Fetches forecast from Supabase        │
│     - Fetches weather from Open-Meteo       │
│     - Generates AI briefing with Gemini     │
│     - Stores in avalanche_briefings table   │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  4. Display on Frontend                     │
│     - AI Briefing                           │
│     - Weather Card                          │
│     - Avalanche Problems                    │
│     - Forecast Photos                       │
└─────────────────────────────────────────────┘
```

---

## Initial App Load

### Step 1: Authentication Check
**File:** `app/page.tsx`

```typescript
// Check if user is logged in
const { user, loading: authLoading } = useAuth();

// Redirect to /auth if not logged in
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/auth');
  }
}, [user, authLoading, router]);
```

### Step 2: Fetch All Forecasts
**Hook:** `hooks/useAvalancheForecasts.ts`
**API Route:** `app/api/forecasts/route.ts`

```
Frontend Hook Call:
const { data, loading, error } = useAvalancheForecasts();
         ↓
API: GET /api/forecasts
         ↓
┌──────────────────────────────────────────────────────────┐
│ Step 1: Check Supabase Cache                             │
│   SELECT * FROM avalanche_forecasts                      │
│   WHERE forecast_date = today                            │
│   AND created_at > now() - interval '1 hour'             │
└────────────┬─────────────────────────────────────────────┘
             │
   ┌─────────┴─────────┐
   │ Cache Hit?        │
   └─────────┬─────────┘
             │
    ┌────────┴────────┐
    │ YES             │ NO
    ▼                 ▼
┌───────────┐   ┌─────────────────────────────────────────┐
│ Return    │   │ Step 2: Fetch from Avalanche.org APIs   │
│ Cached    │   │                                          │
│ Data      │   │ A) Map-Layer API                         │
└───────────┘   │    GET https://api.avalanche.org/v2/     │
                │        public/products/map-layer         │
                │                                          │
                │    Returns:                              │
                │    - All avalanche zones (polygons)      │
                │    - Basic danger ratings                │
                │    - Zone metadata                       │
                │                                          │
                │ B) Product API (for each zone)           │
                │    GET https://api.avalanche.org/v2/     │
                │        public/product?                   │
                │        type=forecast&                    │
                │        center_id={CENTER_ID}&            │
                │        zone_id={ZONE_ID}                 │
                │                                          │
                │    Returns:                              │
                │    - Bottom Line (forecaster summary)    │
                │    - Hazard Discussion                   │
                │    - Weather Discussion                  │
                │    - Avalanche Problems (detailed)       │
                │    - Media (photos with captions)        │
                │    - Danger Rose                         │
                │                                          │
                │ C) Combine Data                          │
                │    Map-Layer data + Product API data     │
                │                                          │
                │ D) Store in Supabase                     │
                │    INSERT INTO avalanche_forecasts       │
                └─────────────┬───────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Return Combined  │
                    │ Forecast Data    │
                    └──────────────────┘
```

**Data Returned to Frontend:**
```typescript
{
  success: true,
  count: 150,  // Total number of zones
  forecasts: [
    {
      id: "NWAC-01",
      zone: "Stevens Pass",
      center: "Northwest Avalanche Center",
      state: "WA",
      timezone: "America/Los_Angeles",
      dates: {
        start: "2025-12-21T00:00:00Z",
        end: "2025-12-22T23:59:59Z"
      },
      danger: {
        overall: 3,      // Considerable
        high: 4,         // High above treeline
        middle: 3,       // Considerable near treeline
        low: 2          // Moderate below treeline
      },
      travelAdvice: "Dangerous avalanche conditions...",
      url: "https://nwac.us/avalanche-forecast/#/stevens-pass",
      warning: null,
      geometry: {
        type: "Polygon",
        coordinates: [[[-121.09, 47.74], ...]]
      },

      // Product API enriched data:
      bottomLine: "Wind slabs and persistent weak layers...",
      hazardDiscussion: "Recent loading from E-NE winds...",
      weatherDiscussion: "An active weather pattern continues...",
      avalancheProblems: [
        {
          name: "Wind Slab",
          likelihood: "Likely",
          minSize: "1",
          maxSize: "2.5",
          discussion: "Wind slabs forming on lee slopes...",
          location: ["Upper elevation", "Leeward aspects"],
          aspectElevation: {...}
        }
      ],
      media: [
        {
          id: "photo-123",
          url: "https://...",
          caption: "Natural avalanche observed...",
          sizes: { large: "...", medium: "...", ... }
        }
      ],
      hasFullForecast: true
    },
    // ... 149 more zones
  ],
  cached: false
}
```

---

## User Selects Center/Zone

### Step 1: User Interaction
**Component:** `components/LocationSelectorSheet.tsx`

```typescript
// User taps location selector
<LocationSelectorSheet
  options={centers}  // List of all centers
  selected={currentSelectedCenter}
  selectedZone={selectedZone}
  onSelect={(center, zone) => {
    setSelectedCenter(center);
    setSelectedZone(zone || null);
  }}
/>
```

### Step 2: Save Preference to Database
**API Route:** `app/api/preferences/route.ts`

```
Frontend:
  POST /api/preferences
  Body: {
    userId: "user-uuid",
    selectedCenter: "Northwest Avalanche Center",
    selectedZone: "Stevens Pass"
  }
         ↓
API Route:
  UPSERT INTO user_preferences (
    user_id,
    selected_center,
    selected_zone,
    updated_at
  )
  VALUES (...)
  ON CONFLICT (user_id)
  DO UPDATE SET ...
         ↓
Response:
  { success: true }
```

### Step 3: Filter Forecasts
**File:** `app/page.tsx`

```typescript
// Filter forecasts to selected center/zone
const centerForecasts = useMemo(() => {
  if (!data?.forecasts || !currentSelectedCenter) return [];

  let forecasts = data.forecasts.filter(
    f => f.center === currentSelectedCenter.id
  );

  // If zone selected, filter to just that zone
  if (selectedZone) {
    forecasts = forecasts.filter(f => f.zone === selectedZone);
  }

  return forecasts;
}, [data, currentSelectedCenter, selectedZone]);
```

---

## Briefing Generation Flow

### Step 1: Trigger Briefing Generation
**Hook:** `hooks/useBriefing.ts`

```typescript
const { briefing, loading, generating, error } = useBriefing(
  "Northwest Avalanche Center",  // center
  "Stevens Pass"                  // zone
);
```

### Step 2: Briefing API Route
**API Route:** `app/api/briefings/generate/route.ts`

```
Frontend:
  POST /api/briefings/generate
  Body: {
    center: "Northwest Avalanche Center",
    zone: "Stevens Pass"
  }
         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 1: Check if briefing exists for today              │
│                                                          │
│   SELECT * FROM avalanche_briefings                     │
│   WHERE center = 'Northwest Avalanche Center'           │
│     AND zone = 'Stevens Pass'                           │
│     AND forecast_date = '2025-12-21'                    │
└────────────┬────────────────────────────────────────────┘
             │
   ┌─────────┴─────────┐
   │ Briefing Exists?  │
   └─────────┬─────────┘
             │
    ┌────────┴────────┐
    │ YES             │ NO
    ▼                 ▼
┌───────────┐   ┌─────────────────────────────────────────┐
│ Return    │   │ Step 2: Fetch Forecast from Supabase    │
│ Cached    │   │                                          │
│ Briefing  │   │   SELECT * FROM avalanche_forecasts     │
└───────────┘   │   WHERE center = '...'                  │
                │     AND zone = '...'                    │
                │     AND forecast_date = today           │
                │                                          │
                │   Returns:                              │
                │   {                                     │
                │     danger_overall: 3,                  │
                │     danger_high: 4,                     │
                │     danger_middle: 3,                   │
                │     danger_low: 2,                      │
                │     travel_advice: "...",               │
                │     bottom_line: "...",                 │
                │     hazard_discussion: "...",           │
                │     weather_discussion: "...",          │
                │     forecast_avalanche_problems: [...], │
                │     media: [...],                       │
                │     geometry: {...}                     │
                │   }                                     │
                └─────────────┬───────────────────────────┘
                              ▼
                ┌──────────────────────────────────────────┐
                │ Step 3: Fetch Weather Data               │
                │                                           │
                │ A) Extract coordinates from geometry      │
                │    geometry.coordinates[0] = [            │
                │      [-121.09, 47.74],                    │
                │      [-121.10, 47.75],                    │
                │      ...                                  │
                │    ]                                      │
                │                                           │
                │ B) Calculate centroid                     │
                │    centerLat = avg(all latitudes)         │
                │    centerLon = avg(all longitudes)        │
                │    → (47.745, -121.095)                   │
                │                                           │
                │ C) Call Weather API                       │
                │    GET /api/weather?                      │
                │      lat=47.745&                          │
                │      lon=-121.095&                        │
                │      center=Northwest Avalanche Center&   │
                │      zone=Stevens Pass                    │
                └─────────────┬─────────────────────────────┘
                              ▼
                ┌──────────────────────────────────────────┐
                │ Step 4: Generate AI Briefing             │
                │                                           │
                │ See "AI Prompt Structure" section below   │
                └─────────────┬─────────────────────────────┘
                              ▼
                ┌──────────────────────────────────────────┐
                │ Step 5: Store Briefing                   │
                │                                           │
                │   INSERT INTO avalanche_briefings (       │
                │     center,                               │
                │     zone,                                 │
                │     forecast_date,                        │
                │     danger_level,                         │
                │     briefing_text,                        │
                │     problems                              │
                │   ) VALUES (...)                          │
                │                                           │
                │   Returns:                                │
                │   {                                       │
                │     id: "briefing-uuid",                  │
                │     center: "Northwest Avalanche Center", │
                │     zone: "Stevens Pass",                 │
                │     forecast_date: "2025-12-21",          │
                │     danger_level: 3,                      │
                │     briefing_text: "...",                 │
                │     problems: [...]                       │
                │   }                                       │
                └─────────────┬─────────────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │ Return Briefing  │
                    │ to Frontend      │
                    └──────────────────┘
```

---

## Weather Data Integration

### Weather API Flow
**API Route:** `app/api/weather/route.ts`

```
Frontend/Backend:
  GET /api/weather?
    lat=47.745&
    lon=-121.095&
    center=Northwest Avalanche Center&
    zone=Stevens Pass
         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 1: Check Supabase Cache                            │
│                                                          │
│   SELECT * FROM weather_data                            │
│   WHERE center = 'Northwest Avalanche Center'           │
│     AND zone = 'Stevens Pass'                           │
│     AND forecast_date = '2025-12-21'                    │
│     AND created_at > now() - interval '6 hours'         │
└────────────┬────────────────────────────────────────────┘
             │
   ┌─────────┴─────────┐
   │ Cache Hit?        │
   └─────────┬─────────┘
             │
    ┌────────┴────────┐
    │ YES             │ NO
    ▼                 ▼
┌───────────┐   ┌─────────────────────────────────────────┐
│ Return    │   │ Step 2: Call Open-Meteo API              │
│ Cached    │   │                                          │
│ Weather   │   │ GET https://api.open-meteo.com/v1/       │
└───────────┘   │     forecast?                            │
                │     latitude=47.745&                     │
                │     longitude=-121.095&                  │
                │     current=temperature_2m,              │
                │            relative_humidity_2m,         │
                │            apparent_temperature,         │
                │            precipitation,                │
                │            weather_code,                 │
                │            cloud_cover,                  │
                │            pressure_msl,                 │
                │            wind_speed_10m,               │
                │            wind_direction_10m,           │
                │            wind_gusts_10m&               │
                │     hourly=temperature_2m,               │
                │           precipitation_probability,     │
                │           precipitation,                 │
                │           snowfall,                      │
                │           cloud_cover,                   │
                │           visibility,                    │
                │           wind_speed_10m,                │
                │           wind_direction_10m,            │
                │           wind_gusts_10m,                │
                │           uv_index&                      │
                │     daily=temperature_2m_max,            │
                │          temperature_2m_min,             │
                │          precipitation_sum,              │
                │          snowfall_sum,                   │
                │          precipitation_probability_max,  │
                │          wind_speed_10m_max,             │
                │          wind_gusts_10m_max,             │
                │          uv_index_max&                   │
                │     temperature_unit=fahrenheit&         │
                │     wind_speed_unit=mph&                 │
                │     precipitation_unit=inch&             │
                │     timezone=auto&                       │
                │     forecast_days=7                      │
                │                                          │
                │ Open-Meteo Returns:                      │
                │ {                                        │
                │   latitude: 47.745,                      │
                │   longitude: -121.095,                   │
                │   elevation: 4061,                       │
                │   current: {                             │
                │     time: "2025-12-21T14:30:00Z",        │
                │     temperature_2m: 28,                  │
                │     apparent_temperature: 18,            │
                │     relative_humidity_2m: 75,            │
                │     precipitation: 0.02,                 │
                │     weather_code: 71,  // Light snow     │
                │     cloud_cover: 85,                     │
                │     pressure_msl: 1015,                  │
                │     wind_speed_10m: 22,                  │
                │     wind_direction_10m: 315,  // NW      │
                │     wind_gusts_10m: 38                   │
                │   },                                     │
                │   hourly: { ... },  // 168 hours         │
                │   daily: { ... }    // 7 days            │
                │ }                                        │
                │                                          │
                │ Step 3: Transform to App Schema          │
                │   - Add weather descriptions             │
                │   - Convert wind direction to cardinal   │
                │   - Add lastUpdated timestamp            │
                │                                          │
                │ Step 4: Cache in Supabase                │
                │   INSERT INTO weather_data (              │
                │     center, zone, forecast_date,         │
                │     latitude, longitude,                 │
                │     weather_data,                        │
                │     created_at                           │
                │   ) VALUES (...)                         │
                └─────────────┬───────────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │ Return Weather   │
                    │ Data             │
                    └──────────────────┘
```

**Weather Data Returned:**
```typescript
{
  success: true,
  weather: {
    location: {
      latitude: 47.745,
      longitude: -121.095,
      elevation: 4061
    },
    current: {
      time: "2025-12-21T14:30:00Z",
      temperature: 28,
      feelsLike: 18,
      humidity: 75,
      precipitation: 0.02,
      weatherCode: 71,
      weatherDescription: "Slight snow",
      cloudCover: 85,
      pressure: 1015,
      windSpeed: 22,
      windDirection: 315,
      windDirectionCardinal: "NW",
      windGusts: 38
    },
    hourly: {
      time: ["2025-12-21T00:00", ...],  // 168 hours
      temperature: [26, 25, 24, ...],
      precipitationProbability: [60, 65, 70, ...],
      precipitation: [0.01, 0.02, 0.03, ...],
      snowfall: [0.5, 0.8, 1.2, ...],
      cloudCover: [80, 85, 90, ...],
      visibility: [5000, 4500, 4000, ...],
      windSpeed: [20, 22, 25, ...],
      windDirection: [310, 315, 320, ...],
      windGusts: [35, 38, 42, ...],
      uvIndex: [0, 0, 0, ...]
    },
    daily: {
      time: ["2025-12-21", ...],  // 7 days
      temperatureMax: [32, 30, 28, ...],
      temperatureMin: [22, 20, 18, ...],
      precipitationSum: [0.8, 1.2, 0.5, ...],
      snowfallSum: [6.5, 9.2, 3.8, ...],
      precipitationProbabilityMax: [80, 85, 60, ...],
      windSpeedMax: [28, 32, 25, ...],
      windGustsMax: [45, 52, 40, ...],
      uvIndexMax: [2.5, 3.0, 2.8, ...]
    },
    lastUpdated: "2025-12-21T14:30:00Z"
  },
  cached: false
}
```

---

## AI Prompt Structure

### Complete AI Prompt (Gemini 2.5 Flash)

The AI receives a comprehensive prompt with all available data. Here's what it looks like:

````markdown
You are a backcountry avalanche safety expert who teaches recreational skiers and snowboarders about avalanche conditions in a clear, educational way.

Create a briefing for the following avalanche forecast:

**Location:** Stevens Pass, Northwest Avalanche Center
**Overall Danger Level:** Considerable (3/5)
**Danger by Elevation:**
- Above Treeline: High (4/5)
- Near Treeline: Considerable (3/5)
- Below Treeline: Moderate (2/5)
**Official Travel Advice:** Dangerous avalanche conditions. Careful snowpack evaluation, cautious route-finding, and conservative decision-making essential.

--- CURRENT WEATHER CONDITIONS ---
**Current Conditions:**
- Temperature: 28°F (Feels like 18°F)
- Weather: Slight snow
- Wind: 22 mph NW (gusts 38 mph)
- Humidity: 75%
- Cloud Cover: 85%
- Current Precipitation: 0.02"
- Barometric Pressure: 1015 mb

**Today's Forecast:**
- High/Low: 32°F / 22°F
- Precipitation: 0.80" (80% chance)
- Snowfall: 6.5"
- Max Wind: 28 mph (gusts 45 mph)
- UV Index: 2.5

**Next 24 Hours Trends:**
- Temperature range: 22°F - 32°F
- Expected snow: 8.2"
- Max wind speed: 32 mph
- Precipitation probability: 85%

--- OFFICIAL FORECAST DATA ---

**Bottom Line (from forecasters):**
Wind slabs and persistent weak layers present the primary concerns today. Recent loading from E-NE winds has created fresh wind slabs on W-NW aspects. Additionally, a persistent weak layer of faceted snow exists mid-pack. Human triggering is likely on wind-loaded slopes and possible on slopes with the persistent weak layer.

**Hazard Discussion:**
The primary avalanche concern is fresh wind slabs formed over the past 48 hours. Moderate to strong E-NE winds have transported recent snow onto leeward W-NW aspects, creating slabs up to 2 feet thick. These slabs are reactive to human triggers, especially on slopes steeper than 35 degrees above treeline.

A secondary concern is the persistent weak layer of faceted snow that developed during the early December cold spell. This layer sits 2-3 feet deep in the snowpack and has been responsible for several large avalanches in the past week. While this layer is becoming less reactive with time, it remains a serious concern on steep, rocky terrain where the snowpack is shallower.

**Weather Discussion:**
An active weather pattern continues with a series of weather systems bringing snow and wind to the Cascades. The current system is producing light to moderate snowfall with E-NE winds averaging 15-25 mph and gusting to 40+ mph at ridgetop. Snow levels are at 3000 feet.

Over the next 48 hours, expect 8-14 inches of new snow with winds gradually shifting to the N-NW. Temperatures will remain cold, with highs in the upper 20s and lows in the teens. This will maintain dry, low-density snow that is easily transported by wind.

**Official Avalanche Problems:**

1. Wind Slab
   Likelihood: Likely
   Size: 1 to 2.5
   Discussion: Fresh wind slabs have formed on W-NW aspects above treeline due to E-NE winds. These slabs are 6-24 inches thick and are sitting on soft snow from earlier this week. Cracking and collapsing are signs of instability. Avoid steep, wind-loaded slopes and terrain features like cornices and convexities. Slabs are most reactive in the 24-48 hours after formation.
   Affected Areas: Upper elevation, Leeward aspects, Cross-loaded gullies

2. Persistent Slab
   Likelihood: Possible
   Size: 2 to 4
   Discussion: A layer of weak, faceted snow 2-3 feet deep in the snowpack continues to produce avalanches. This layer is most reactive on steep, rocky terrain where the snowpack is shallower and on N-NE aspects where cold temperatures have preserved the weak layer. Recent avalanches in this problem have been Large (D2.5-D3) and capable of running long distances. Conservative terrain selection is essential.
   Affected Areas: Upper elevation, Shallow snowpack areas, North to East aspects

**Field Photos Available:** 3 photos with observations
  Photo 1: Natural wind slab avalanche on west aspect at 5200', ran 600 vertical feet. Crown 18 inches deep. Likely triggered by wind loading overnight.
  Photo 2: Shooting crack observed on ridgeline, extending 50+ feet from skier. Clear sign of slab instability.
  Photo 3: Snowpack profile showing faceted layer at 80cm depth with CT12 Q1 result (poor structure).

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
3. If current weather data is provided, analyze how temperature, wind, precipitation, and pressure affect avalanche risk
4. Explain the relationship between weather conditions and avalanche formation (e.g., wind loading, temperature inversions, rapid warming)
5. Provide actionable terrain selection advice based on both avalanche forecast and current weather
6. Use analogies or simple explanations to help beginners understand
7. If official forecast data is provided above, USE IT as your primary source of information
8. Synthesize the official bottom line, hazard discussion, weather discussion, and current conditions into accessible language

Weather-specific guidance to include when weather data is available:
- Strong winds (>15 mph): Discuss wind slab formation, wind-loaded slopes, and cornices
- Recent/forecast snow: Explain how new snow adds load to weak layers
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

IMPORTANT: Return ONLY valid JSON, no additional text before or after.
````

### Example AI Response

```json
{
  "briefing": "Today we're looking at Considerable danger at Stevens Pass, ramping up to High above treeline. This is a day where careful decision-making is absolutely critical. The combination of fresh wind slabs and a deeper persistent weak layer creates a complex avalanche problem that requires conservative terrain choices.\n\nThe main story today is wind. Those 22 mph NW winds (gusting to 38 mph!) are actively building fresh wind slabs on west and northwest-facing slopes. Think of wind slabs like a house of cards sitting on a soft foundation - they look stable, but the slightest disturbance can cause them to collapse. With 6.5 inches of new snow expected today and temps staying cold (28°F), this wind-transported snow is creating pillowy deposits that are very reactive to human triggers. If you see shooting cracks or hear that hollow 'whumpf' sound, you're standing on one of these slabs - time to back off immediately.\n\nThe secondary concern is trickier: there's a buried layer of weak, faceted snow about 2-3 feet deep that's been lurking since early December. This is the kind of problem that can produce large, dangerous avalanches even when surface conditions look fine. It's most touchy in rocky, shallow areas where the snowpack is thinner. Bottom line: stick to simple, low-angle terrain (under 30 degrees) if you're venturing out. Avoid wind-loaded slopes, steep convexities, and anywhere you see signs of wind effect like cornices or scoured ridgelines. This is a great day for mellow tree skiing below treeline where danger is Moderate and the persistent weak layer is less of a concern.",

  "problems": [
    {
      "name": "Wind Slab",
      "description": "Wind slabs are formed when wind picks up snow from one area and deposits it on another, creating a cohesive slab that sits on top of softer snow. Imagine stacking a rigid dinner plate on top of a pile of feathers - that's essentially what's happening. The plate (wind slab) can hold together until you step on it, then it breaks and slides as a unit.\n\nRight now, east-northeast winds have been loading west and northwest-facing slopes with fresh snow. These slabs are 6-24 inches thick and are sitting on the soft snow from earlier this week, making them prime candidates for human triggering. The field observations today confirm this - a natural avalanche already released on a west aspect, and someone triggered shooting cracks on a ridgeline. These are your warning signs! Wind slabs are most dangerous in the first 24-48 hours after they form (like right now). Look for smooth, pillowy snow that looks different from the surrounding area, drifts on the lee side of ridges, and cornices overhanging slopes. Avoid steep slopes (>35°) on west, northwest, and cross-loaded gullies above treeline. If you see cracking or hear hollow sounds, you're on a wind slab - retreat to safer terrain immediately.",
      "likelihood": "Likely",
      "size": "Medium"
    },
    {
      "name": "Persistent Slab",
      "description": "A persistent slab is one of the most dangerous avalanche problems because it can lurk in the snowpack for weeks or even months, waiting for the right trigger. Think of it like a structural flaw in a building's foundation - it might hold up for a while, but when it fails, the whole structure comes down. In this case, there's a layer of weak, sugary snow (called facets) about 2-3 feet deep that formed during the early December cold snap.\n\nThis type of snow is called 'faceted' because the crystals have transformed into larger, angular shapes that don't bond well - like trying to stack sugar cubes instead of building blocks. When this weak layer breaks, the entire slab above it can release, producing very large avalanches (Size 2-4, meaning they can bury cars, destroy buildings, or break trees). Recent large avalanches in the area have been tied to this layer. It's most reactive on steep, rocky terrain where the snowpack is shallower and on north to east aspects where cold temps have kept the weak layer preserved. A snowpack test today showed this layer failing with only 12 taps (CT12 Q1 - that's not good). Warning signs are subtle - you might not get the obvious clues like with wind slabs. Your best defense is avoiding steep terrain (>35°) especially in rocky, shallow areas and on north-east aspects. This is a problem that demands respect and conservative terrain choices.",
      "likelihood": "Possible",
      "size": "Large"
    }
  ]
}
```

---

## Chat Feature Flow

### User Asks Follow-up Question
**API Route:** `app/api/chat/route.ts`

```
Frontend:
  POST /api/chat
  Body: {
    messages: [
      { role: "user", content: "What slopes should I avoid today?" }
    ],
    center: "Northwest Avalanche Center",
    zone: "Stevens Pass"
  }
         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 1: Fetch Context Data                              │
│                                                          │
│ A) Get Latest Briefing                                  │
│    SELECT * FROM avalanche_briefings                    │
│    WHERE center = '...' AND zone = '...'                │
│    ORDER BY forecast_date DESC LIMIT 1                  │
│                                                          │
│ B) Get Latest Forecast                                  │
│    SELECT * FROM avalanche_forecasts                    │
│    WHERE center = '...' AND zone = '...'                │
│    ORDER BY forecast_date DESC LIMIT 1                  │
└─────────────┬───────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: Build Context-Aware Prompt                      │
│                                                          │
│ System Prompt:                                          │
│   "You are an avalanche safety expert assistant for     │
│    SideCountry Scout. You have access to the current    │
│    avalanche forecast and briefing for [Zone], [Center].│
│                                                          │
│    Current Conditions:                                  │
│    - Danger Level: Considerable (3/5)                   │
│    - Danger by Elevation: High/Considerable/Moderate    │
│    - Travel Advice: [...]                               │
│                                                          │
│    Today's Briefing:                                    │
│    [Full AI-generated briefing text]                    │
│                                                          │
│    Avalanche Problems:                                  │
│    1. Wind Slab - Likely, Size Medium                   │
│       [Problem description]                             │
│    2. Persistent Slab - Possible, Size Large            │
│       [Problem description]                             │
│                                                          │
│    Answer the user's questions based on this            │
│    information. Be specific, educational, and focus     │
│    on safety."                                          │
│                                                          │
│ User Messages:                                          │
│   [User's conversation history]                         │
└─────────────┬───────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: Call Gemini AI                                  │
│                                                          │
│   model: "gemini-2.0-flash-exp"                         │
│   stream: true  (real-time streaming)                   │
└─────────────┬───────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────┐
│ Step 4: Stream Response to Frontend                     │
│                                                          │
│   Response (streamed):                                  │
│   "Based on today's forecast, you should definitely     │
│    avoid west and northwest-facing slopes above         │
│    treeline. Here's why:                                │
│                                                          │
│    1. Wind Slabs on W-NW Aspects:                       │
│    The current 22 mph NW winds (gusting to 38 mph!)     │
│    have been loading these slopes with fresh snow       │
│    over the past 48 hours..."                           │
└─────────────────────────────────────────────────────────┘
```

---

## Caching Strategy

### Summary Table

| Data Type | API Route | External Source | Cache Location | Cache Duration | Revalidation |
|-----------|-----------|-----------------|----------------|----------------|--------------|
| **Avalanche Forecasts** | `/api/forecasts` | avalanche.org Map-Layer + Product APIs | `avalanche_forecasts` table | 1 hour | ISR (Incremental Static Regeneration) |
| **Weather Data** | `/api/weather` | Open-Meteo API | `weather_data` table | 6 hours | On-demand fetch if cache expired |
| **AI Briefings** | `/api/briefings/generate` | Gemini 2.5 Flash | `avalanche_briefings` table | 1 day | Generated once per day per zone |
| **User Preferences** | `/api/preferences` | N/A | `user_preferences` table | Persistent | Updated on user selection |
| **Chat Context** | `/api/chat` | Gemini 2.0 Flash | Not cached | N/A | Real-time generation |

### Cache Invalidation Rules

1. **Avalanche Forecasts**: Expire after 1 hour or at midnight (whichever comes first)
2. **Weather Data**: Expire after 6 hours (weather changes more frequently than avalanche forecasts)
3. **AI Briefings**: Expire daily at midnight (tied to forecast date)
4. **User Preferences**: Never expire (updated on user action)

### Performance Optimizations

```
Initial Page Load (Cache Hit):
  - Forecasts: ~50ms (from Supabase)
  - Briefing: ~30ms (from Supabase)
  - Weather: ~40ms (from Supabase)
  Total: ~120ms

Initial Page Load (Cache Miss):
  - Forecasts: ~3000ms (avalanche.org APIs + processing)
  - Briefing: ~5000ms (includes weather fetch + AI generation)
  - Weather: ~800ms (Open-Meteo API)
  Total: ~8800ms (first user of the day)

Subsequent Users (within cache window):
  - All data from cache: ~120ms
  - 98.6% faster than fresh fetch!
```

---

## Data Flow Diagram (Complete)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTION                             │
│                                                                       │
│  1. Opens app → Authentication check                                 │
│  2. Loads all centers/zones                                          │
│  3. Selects "Northwest Avalanche Center" → "Stevens Pass"            │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       DATA FETCHING PIPELINE                          │
│                                                                       │
│  ┌────────────────────┐      ┌────────────────────┐                 │
│  │ Avalanche Forecast │      │   Weather Data     │                 │
│  │                    │      │                    │                 │
│  │ avalanche.org API  │      │  Open-Meteo API    │                 │
│  │ ↓                  │      │  ↓                 │                 │
│  │ Map-Layer (zones)  │      │  Current: 28°F     │                 │
│  │ Product (details)  │      │  Wind: 22 mph NW   │                 │
│  │ ↓                  │      │  Snow: 6.5"        │                 │
│  │ Cache: 1 hour      │      │  Cache: 6 hours    │                 │
│  └──────────┬─────────┘      └─────────┬──────────┘                 │
│             │                           │                            │
│             └──────────┬────────────────┘                            │
│                        ▼                                             │
│          ┌──────────────────────────────┐                            │
│          │   AI BRIEFING GENERATION     │                            │
│          │                              │                            │
│          │  Gemini 2.5 Flash            │                            │
│          │  ↓                           │                            │
│          │  Input:                      │                            │
│          │  - Forecast data             │                            │
│          │  - Weather data              │                            │
│          │  - Official discussions      │                            │
│          │  - Field observations        │                            │
│          │  ↓                           │                            │
│          │  Output:                     │                            │
│          │  - Educational briefing      │                            │
│          │  - Avalanche problems        │                            │
│          │  Cache: 1 day                │                            │
│          └──────────────┬───────────────┘                            │
│                         │                                            │
└─────────────────────────┼────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      FRONTEND DISPLAY                                 │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 📍 Location: Stevens Pass, Northwest Avalanche Center        │    │
│  │ 📅 Date: Dec 21                                              │    │
│  │ ⚠️  Danger: Considerable (3/5)                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 💡 SCOUT BRIEFING                                            │    │
│  │                                                              │    │
│  │ "Today we're looking at Considerable danger at Stevens       │    │
│  │  Pass, ramping up to High above treeline. The combination    │    │
│  │  of fresh wind slabs and a deeper persistent weak layer..."  │    │
│  │                                                              │    │
│  │ [Full AI-generated educational briefing]                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 🌤️  CURRENT CONDITIONS                                       │    │
│  │                                                              │    │
│  │ 🌡️  28°F (Feels like 18°F)    💨 22 mph NW (gusts 38 mph)   │    │
│  │ ❄️  6.5" snow today           ☁️  85% cloud cover           │    │
│  │ 💧 0.02" precipitation        📊 1015 mb pressure            │    │
│  │                                                              │    │
│  │ 7-Day Outlook: [Temp/snow charts]                           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 📋 THE DETAILS                                               │    │
│  │                                                              │    │
│  │ ▸ Wind Slab - Likely • Medium                               │    │
│  │   "Wind slabs are formed when wind picks up snow from one    │    │
│  │    area and deposits it on another, creating a cohesive      │    │
│  │    slab..."                                                  │    │
│  │                                                              │    │
│  │ ▸ Persistent Slab - Possible • Large                         │    │
│  │   "A persistent slab is one of the most dangerous avalanche  │    │
│  │    problems because it can lurk in the snowpack for weeks..." │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 💬 Ask follow-up questions...                                │    │
│  │                                                              │    │
│  │ User: "What slopes should I avoid today?"                    │    │
│  │ AI: "Based on today's forecast, avoid W-NW aspects above     │    │
│  │      treeline due to wind slabs. Also steer clear of steep,  │    │
│  │      rocky terrain where the persistent weak layer lurks..." │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

1. **Multi-Source Data Aggregation**: The app combines data from avalanche.org (official forecasts), Open-Meteo (weather), and Gemini AI (analysis)

2. **Intelligent Caching**: Different data types have different cache durations based on how frequently they change

3. **Context-Aware AI**: The AI receives comprehensive context including official forecasts, current weather, and field observations

4. **Educational Focus**: All AI-generated content is designed to teach users WHY conditions are dangerous, not just WHAT is dangerous

5. **Real-Time Updates**: Weather data refreshes every 6 hours, forecasts every hour, and chat responses are generated in real-time

6. **User Personalization**: Selected center/zone preferences are saved and persist across sessions

7. **Performance Optimization**: Aggressive caching reduces API calls by 98%+ for subsequent users

---

## Database Schema Reference

```sql
-- Stores avalanche forecasts from avalanche.org
CREATE TABLE avalanche_forecasts (
  forecast_id VARCHAR PRIMARY KEY,
  center VARCHAR,
  zone VARCHAR,
  state VARCHAR,
  forecast_date DATE,
  danger_overall INT,
  danger_high INT,
  danger_middle INT,
  danger_low INT,
  travel_advice TEXT,
  forecast_url TEXT,
  bottom_line TEXT,
  hazard_discussion TEXT,
  weather_discussion TEXT,
  forecast_avalanche_problems JSONB,
  media JSONB,
  geometry JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stores weather data from Open-Meteo
CREATE TABLE weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center VARCHAR,
  zone VARCHAR,
  forecast_date DATE,
  latitude NUMERIC,
  longitude NUMERIC,
  weather_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(center, zone, forecast_date)
);

-- Stores AI-generated briefings
CREATE TABLE avalanche_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center VARCHAR,
  zone VARCHAR,
  forecast_date DATE,
  danger_level INT,
  briefing_text TEXT,
  problems JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stores user preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY,
  selected_center VARCHAR,
  selected_zone VARCHAR,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Response Time |
|----------|--------|---------|---------------|
| `/api/forecasts` | GET | Fetch all avalanche forecasts | ~50ms (cached) / ~3s (fresh) |
| `/api/forecasts?center=X` | GET | Fetch forecasts for specific center | ~30ms (cached) / ~2s (fresh) |
| `/api/weather?lat=X&lon=Y` | GET | Fetch weather data | ~40ms (cached) / ~800ms (fresh) |
| `/api/briefings/generate` | POST | Generate AI briefing | ~30ms (cached) / ~5s (fresh) |
| `/api/preferences` | GET | Load user preferences | ~20ms |
| `/api/preferences` | POST | Save user preferences | ~30ms |
| `/api/chat` | POST | Chat with AI (streaming) | Real-time stream |

---

**Document Version:** 1.0
**Last Updated:** 2025-12-21
**Maintained By:** Sidecountry Scout Development Team

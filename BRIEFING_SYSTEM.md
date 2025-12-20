# AI Briefing System

This document describes the AI-powered avalanche briefing system implemented in SideCountry Scout.

## Overview

The system uses Google's Gemini AI to generate educational, easy-to-understand briefings about avalanche conditions. Briefings are cached in Supabase to avoid regenerating them and to provide fast responses.

## Architecture

### Database (Supabase)

**Table: `avalanche_briefings`**
- `id` - UUID primary key
- `center` - Avalanche center name
- `zone` - Zone name within the center
- `forecast_date` - Date of the forecast
- `danger_level` - Overall danger level (1-5)
- `briefing_text` - AI-generated briefing content
- `created_at` - Timestamp when created
- `updated_at` - Timestamp when last updated
- **Unique constraint** on (center, zone, forecast_date) to prevent duplicates
- **RLS enabled** with public read access

### API Routes

#### `/api/briefings` (GET)
Fetches an existing briefing from Supabase.

**Query Parameters:**
- `center` - Avalanche center name
- `zone` - Zone name

**Response:**
```json
{
  "success": true,
  "briefing": {
    "id": "...",
    "center": "...",
    "zone": "...",
    "briefing_text": "..."
  }
}
```

#### `/api/briefings/generate` (POST)
Generates a new briefing using Gemini AI and stores it in Supabase.

**Request Body:**
```json
{
  "center": "Northwest Avalanche Center",
  "zone": "Mt Baker",
  "forecastData": {
    "danger": {
      "overall": 3,
      "high": 4,
      "middle": 3,
      "low": 2
    },
    "travelAdvice": "...",
    "url": "..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "briefing": {...},
  "cached": false
}
```

### Custom Hook

**`useBriefing(center, zone, forecastData)`**

React hook that:
1. Attempts to fetch existing briefing from cache
2. If not found, generates a new briefing using Gemini AI
3. Returns briefing data along with loading and error states

**Returns:**
```typescript
{
  briefing: Briefing | null,
  loading: boolean,
  error: string | null,
  generating: boolean
}
```

## AI Prompt Engineering

The Gemini AI is instructed to create briefings that:
1. Explain danger levels in practical terms
2. Teach WHY conditions exist (educational focus)
3. Provide actionable terrain selection advice
4. Use analogies and simple explanations for beginners
5. Remain conversational and non-preachy

## User Flow

1. User selects an avalanche center
2. User selects a zone within that center
3. System checks Supabase for existing briefing
4. If found, displays cached briefing immediately
5. If not found, generates new briefing with Gemini AI
6. Briefing is stored in Supabase for future requests
7. Briefing is displayed to user

## Environment Variables

Required in `.env.local`:
```
google_gemini_api=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Benefits

- **Educational**: Teaches users about avalanche conditions
- **Fast**: Cached briefings load instantly
- **Cost-effective**: Only generates once per zone/day
- **Accessible**: Simplifies complex avalanche terminology
- **Up-to-date**: Generates fresh briefings daily

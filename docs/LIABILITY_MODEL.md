# Sidecountry Scout Liability Model: "The Pocket Mentor"

## Overview

Sidecountry Scout is designed as a **Decision Support Tool**, NOT a decision maker. This document outlines the specific linguistic, structural, and technical safeguards implemented to reduce liability and ensure users understand their responsibility for avalanche safety decisions.

## Core Philosophy

The AI assistant acts as "The Pocket Mentor" - a knowledgeable librarian looking over your shoulder, helping you interpret official forecasts and understand conditions, but **never** telling you what to do or making go/no-go decisions.

---

## 1. The "Anchor Rule" - Source Citations

**Implementation:** Every AI-generated statement is anchored to a human-written authoritative source.

### Technical Implementation:
- **Location:** `app/api/briefings/generate/route.ts:425-429`
- **Pattern:** Inline citations in format: `[Official Forecast: {center}]` or `[Weather Data: Open-Meteo]`
- **Database:** `source_url` field stores the official forecast URL
- **Validation:** API rejects responses without `sourceUrl` and `disclaimer` fields (line 510-513)

### Example Output:
```
"The primary concern is Wind Slab on N-NE-E aspects near treeline [Official Forecast: NWAC].
Weather data shows sustained winds of 25-35 mph over the past 48 hours [Weather Data: Open-Meteo],
which has created wind loading on leeward slopes."
```

---

## 2. Voice & Tone: The "Professional Librarian"

**Implementation:** AI prompt strictly defines forbidden and required language patterns.

### Forbidden Language (Directive):
- ❌ "You should..."
- ❌ "It is safe to..."
- ❌ "I recommend..."
- ❌ "Go ahead and..."

### Required Language (Observational):
- ✅ "The forecast indicates..."
- ✅ "The data shows..."
- ✅ "Forecasters have identified..."
- ✅ "Users often consider..."

### Technical Implementation:
- **Location:** `app/api/briefings/generate/route.ts:431-434`
- **Enforcement:** Prompt instructions explicitly prohibit authoritative language
- **Example:** Lines 436-438 demonstrate correct vs. incorrect phrasing

---

## 3. The "Thought Provoker" Protocol

**Implementation:** Instead of providing answers, the AI prompts users for field observations.

### Technical Implementation:
- **Database Field:** `field_observation_prompts` (JSONB array)
- **Location:** `app/api/briefings/generate/route.ts:416-420`
- **Required Output:** Every briefing includes 3+ field observation questions

### Example Prompts:
```json
{
  "fieldObservationPrompts": [
    "What did you observe during your approach? (roller balls, shooting cracks, whumpfing)",
    "What were the results of your stability tests? (hand shear, compression test, etc.)",
    "Have you seen any recent avalanche activity in this area?"
  ]
}
```

**UI Integration:** Frontend must display these prominently before users make decisions.

---

## 4. Data Staleness Warning (Not a Hard Stop)

**Implementation:** Acknowledge and warn about data age if source data is >24 hours old, but still provide the briefing with enhanced disclaimers.

### Philosophy:
Users need information even if it's slightly outdated. Rather than refusing to serve data, we:
1. **Acknowledge** the data is old
2. **Warn** that conditions may have changed
3. **Clarify** this is the most recent data available
4. **Enhance** the disclaimer with age information

### Technical Implementation:

#### Cached Briefing Check:
- **Location:** `app/api/briefings/generate/route.ts:70-83`
- **Logic:** Check `created_at` timestamp, add warning metadata
- **Response:** JSON with `staleData: true` and `stalenessWarning` message

#### New Briefing Generation Check:
- **Location:** `app/api/briefings/generate/route.ts:247-270`
- **Logic:** Calculate forecast age in hours
- **Prompt Context:** Includes staleness warning if >24 hours
- **Disclaimer:** Auto-updated with data age

#### AI Instructions:
- **Location:** `app/api/briefings/generate/route.ts:415-418`
- **Behavior:** If data is stale, AI instructed to:
  - Start briefing with staleness acknowledgment
  - Include age in disclaimer
  - Add "Conditions may have changed" warning

### Response Format:
```json
{
  "success": true,
  "briefing": { ... },
  "staleData": true,
  "dataAge": 86400000,  // milliseconds
  "stalenessWarning": "This forecast data is more than 24 hours old. It may not reflect current conditions. This is the most recent data available for this zone."
}
```

**UI Requirement:** Display staleness warning prominently at top of briefing if `staleData: true`.

---

## 5. Mandatory Disclaimer

**Implementation:** Every briefing includes a legal disclaimer emphasizing user responsibility.

### Standard Disclaimer Text:
```
This briefing is an educational summary only. It is not a substitute for reading the
full official forecast, checking current conditions in the field, or making your own
risk assessment. You are responsible for your own decisions in avalanche terrain.
```

### Technical Implementation:
- **Database Field:** `disclaimer` (TEXT, required)
- **Validation:** API rejects responses without disclaimer (line 510-513)
- **Location in Response:** `briefingData.disclaimer`

**UI Requirement:** Display disclaimer prominently at top and bottom of briefing.

---

## 6. Official Source Priority

**Implementation:** When official avalanche forecast data exists, AI MUST use it as primary source.

### Technical Implementation:
- **Location:** `app/api/briefings/generate/route.ts:454-458`
- **Logic:** If `forecast_avalanche_problems` exist in Product API response, use exclusively
- **Flag:** `officialSource: true` marks problems from official forecast
- **Fallback:** Only generate problems if no official data exists

### Data Flow:
1. Fetch from Avalanche.org Map-Layer API (basic data)
2. Enrich with Product API (official forecast details)
3. AI synthesizes official content, never replaces it
4. Mark each problem with `officialSource: true`

---

## 7. No Go/No-Go Decisions

**Implementation:** AI explicitly forbidden from making terrain-specific safety decisions.

### Forbidden Examples:
- ❌ "The South Face is safe today"
- ❌ "You can ski this slope"
- ❌ "Avoid the North Bowl"

### Required Examples:
- ✅ "The forecast identifies Moderate danger on south aspects due to warming. Have you observed roller balls or pinwheels? [Official Forecast: CAIC]"
- ✅ "Forecasters note wind slabs on N-NE-E aspects. What signs of wind loading have you seen? [Official Forecast: NWAC]"

### Technical Implementation:
- **Location:** `app/api/briefings/generate/route.ts:436-443`
- **Enforcement:** Prompt examples demonstrate correct pattern
- **Pattern:** Always pair forecast info with field observation question

---

## 8. Educational, Not Directive

**Implementation:** AI teaches users HOW to assess conditions, not WHAT to do.

### Teaching Pattern:
1. **Cite official forecast:** "Forecasters have identified..."
2. **Explain causation:** "Past weather shows... which created..."
3. **Describe warning signs:** "Look for cracks, whumpfing, recent avalanches..."
4. **Prompt observation:** "What have you observed in the field?"

### Technical Implementation:
- **Location:** `app/api/briefings/generate/route.ts:440-443, 445-452`
- **Structure:** Briefing must follow educational progression
- **Historical Context:** Connect past 14 days weather to current snowpack (lines 461-466)

---

## Database Schema

### New Fields in `avalanche_briefings` Table:

```sql
source_url TEXT                          -- Official forecast URL
disclaimer TEXT                          -- Legal disclaimer
field_observation_prompts JSONB          -- Array of field observation questions
forecast_url TEXT                        -- Direct link to forecast
published_time TIMESTAMP WITH TIME ZONE  -- Original forecast publish time
```

**Migration:** `/supabase/migrations/add_liability_fields_to_briefings.sql`

---

## Frontend Requirements

### Minimum UI Elements:

1. **Disclaimer Display:**
   - Show at top of briefing (above content)
   - Show at bottom (after problems)
   - Use prominent styling (border, bold text)

2. **Source Attribution:**
   - Display official forecast center name
   - Provide clickable link to `source_url`
   - Show "Last Updated" timestamp

3. **Field Observation Prompts:**
   - Display as interactive checklist
   - Require acknowledgment before viewing briefing
   - Provide input fields for user notes

4. **Stale Data Handling:**
   - Catch HTTP 410 responses
   - Display error message prominently
   - Provide direct link to official forecast
   - Hide/disable AI briefing content

5. **Citation Visibility:**
   - Render inline citations as clickable links
   - Highlight cited vs. AI-generated content
   - Provide tooltip on hover explaining source

---

## Legal Protection Strategy

### Multi-Layer Defense:

1. **Technical:** Hard stops for stale data (>24 hours)
2. **Linguistic:** Never directive, always educational
3. **Attribution:** Every claim cited to authoritative source
4. **Disclaimer:** Explicit user responsibility statements
5. **User Engagement:** Force field observations before decisions
6. **Audit Trail:** Database stores all sources and timestamps

### Key Legal Positions:

✅ **"We are a search/summarization tool"** - Like Google, we point to sources
✅ **"Expert-in-the-loop model"** - User must validate in field
✅ **"Educational assistant"** - Teaching interpretation, not making decisions
✅ **"Current data requirement"** - Refuse to work with outdated information

---

## Testing Checklist

- [ ] AI responses include inline citations for every claim
- [ ] Voice is observational ("The forecast shows...") not directive ("You should...")
- [ ] Field observation prompts included in every briefing
- [ ] Stale data (>24h) returns HTTP 410 with error message
- [ ] Disclaimer present and stored in database
- [ ] Source URL validated and clickable
- [ ] Official avalanche problems used when available (not AI-generated)
- [ ] No go/no-go language in any briefing
- [ ] Frontend displays disclaimer prominently
- [ ] Frontend handles stale data errors correctly

---

## Version History

- **v1.0** - Initial implementation of Pocket Mentor model
- **Date:** 2025-12-23
- **Author:** Liability reduction per legal consultation

---

## Contact

For questions about this liability model or implementation details:
- **GitHub Issues:** [Report issues](https://github.com/yourusername/sidecountry-scout/issues)
- **Email:** legal@sidecountryscout.com

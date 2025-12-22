# Sidecountry Scout

## Overview

Sidecountry Scout is an intelligent backcountry safety companion that transforms complex avalanche forecasts into clear, actionable briefings. Designed for skiers, snowboarders, and backcountry enthusiasts, this application combines real-time avalanche data with AI-powered analysis to help users make informed decisions in the mountains.

## What It Does

Sidecountry Scout aggregates avalanche forecasts from multiple centers across North America and delivers personalized safety briefings for specific zones. Instead of sifting through technical reports, users receive concise AI-generated summaries that highlight the key risks and conditions for their chosen location.

## Key Features

### AI-Powered Briefings
- **Gemini AI Integration**: Generates intelligent, context-aware briefings that synthesize avalanche forecasts into digestible insights
- **Real-time Analysis**: Processes the latest avalanche data to provide up-to-the-minute safety information
- **Problem Breakdown**: Clearly explains specific avalanche problems including likelihood, size, and detailed descriptions

### Location Intelligence
- **Multi-Center Support**: Access forecasts from avalanche centers across North America
- **Zone-Specific Data**: Drill down to specific zones within each forecast center
- **Saved Preferences**: Automatically remembers your preferred locations for quick access
- **Weather Integration**: Real-time weather data for selected zones

### User Experience
- **Mobile-First Design**: Optimized interface for quick checks in the field
- **Danger Level Indicators**: Clear visual representation of current avalanche danger ratings
- **Expandable Details**: Collapsible sections for avalanche problems with full technical information
- **Live Updates**: Real-time status indicators showing when data is fresh

### Authentication & Persistence
- **Supabase Integration**: Secure user authentication and data storage
- **Chat History**: Track your safety briefings over time
- **Preference Sync**: Your location preferences persist across sessions

## Technical Stack

### Frontend
- **Next.js 16**: React framework with App Router for optimal performance
- **TypeScript**: Type-safe development for reliability
- **Tailwind CSS v4**: Modern, responsive styling system
- **Lucide React**: Beautiful icon system

### Backend & Services
- **Supabase**: PostgreSQL database, authentication, and real-time subscriptions
- **Google Gemini AI**: Advanced language model for briefing generation
- **Avalanche Forecast API**: Integration with official avalanche forecast data sources
- **Weather API**: Real-time weather data integration

### Key Dependencies
- React 19.2.3
- Next.js 16.1.0
- Supabase JS SDK 2.89.0
- Google Generative AI SDK 0.24.1

## Use Cases

### Daily Backcountry Planning
Quickly check conditions before heading out. Get a snapshot of danger levels and specific problems to watch for in your target zone.

### Tour Planning
Review multiple zones to identify the safest areas for your backcountry tour. Compare danger levels and specific avalanche problems across different regions.

### Education & Awareness
Learn to interpret avalanche forecasts through AI-summarized explanations. Build knowledge about different avalanche problem types and conditions.

### Risk Assessment
Combine AI briefings with official forecasts to make informed go/no-go decisions. Understand not just the danger level, but the specific risks present.

## Data Sources

Sidecountry Scout pulls avalanche forecast data from official avalanche centers and processes it through AI to provide:
- Danger ratings by elevation band
- Specific avalanche problem types (persistent slabs, wind slabs, wet avalanches, etc.)
- Likelihood and size estimates
- Zone-specific recommendations
- Weather conditions and trends

## Safety Notice

**Sidecountry Scout is a tool to assist in backcountry decision-making, not a replacement for proper avalanche education, experience, and judgment.** Always:
- Take an avalanche safety course
- Carry proper safety equipment (beacon, probe, shovel)
- Check official avalanche forecasts directly
- Make conservative decisions in uncertain conditions
- Never travel alone in avalanche terrain

## Target Audience

- Backcountry skiers and snowboarders
- Splitboarders
- Snowmobilers
- Mountain guides and outdoor professionals
- Avalanche safety educators
- Anyone recreating in avalanche terrain

## Competitive Advantages

1. **AI Simplification**: Converts technical avalanche jargon into clear, actionable language
2. **Multi-Source Aggregation**: Single interface for multiple avalanche centers
3. **Personalization**: Remembers your zones and preferences
4. **Mobile Optimization**: Built for quick field checks, not desktop analysis
5. **Real-time Updates**: Fresh data when you need it most

## Future Enhancements

Potential areas for expansion:
- Push notifications for danger level changes
- Photo galleries from avalanche centers
- Historical trend analysis
- Trip planning with saved routes
- Social features for sharing conditions
- Offline mode for backcountry access
- Integration with weather forecast models
- GPS-based automatic zone detection

## Development Status

Current Version: 0.1.0 (Private)

This application represents a complete MVP with core features operational, including:
- User authentication
- Location selection and persistence
- AI briefing generation
- Weather data integration
- Avalanche problem breakdown
- Chat history tracking

## License & Usage

This is a private application. All rights reserved.

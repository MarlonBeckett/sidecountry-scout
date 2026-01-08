/**
 * AI Briefing Types
 * Types for AI-generated avalanche briefings
 */

export interface AvalancheProblemBriefing {
  name: string;
  description: string;
  likelihood: string;
  size: string;
}

export interface BriefingData {
  briefing: string;
  problems: AvalancheProblemBriefing[];
}

export interface AvalancheBriefing {
  id: string;
  center: string;
  zone: string;
  forecast_date: string;
  danger_level: number;
  briefing_text: string;
  problems: AvalancheProblemBriefing[];
  created_at: string;
  updated_at?: string;
}

export interface GenerateBriefingRequest {
  center: string;
  zone: string;
}

export interface BriefingResponse {
  success: boolean;
  briefing: AvalancheBriefing;
  cached: boolean;
  staleData?: boolean;
  dataAge?: number;
  stalenessWarning?: string | null;
}

export interface RegenerateBriefingRequest {
  center: string;
  zone: string;
  force?: boolean;
}

-- Add liability and citation fields to avalanche_briefings table
-- This migration adds fields to support "The Pocket Mentor" model for liability reduction

-- Add source_url field to track the official forecast source
ALTER TABLE avalanche_briefings
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Add disclaimer field for legal protection
ALTER TABLE avalanche_briefings
ADD COLUMN IF NOT EXISTS disclaimer TEXT;

-- Add field_observation_prompts to encourage user field assessments
ALTER TABLE avalanche_briefings
ADD COLUMN IF NOT EXISTS field_observation_prompts JSONB DEFAULT '[]'::jsonb;

-- Add forecast_url for direct link to official forecast
ALTER TABLE avalanche_briefings
ADD COLUMN IF NOT EXISTS forecast_url TEXT;

-- Add published_time to track when the original forecast was published
ALTER TABLE avalanche_briefings
ADD COLUMN IF NOT EXISTS published_time TIMESTAMP WITH TIME ZONE;

-- Create index on published_time for staleness checks
CREATE INDEX IF NOT EXISTS idx_briefings_published_time
ON avalanche_briefings(published_time);

-- Add comment explaining the liability model
COMMENT ON COLUMN avalanche_briefings.disclaimer IS 'Legal disclaimer text emphasizing this is a decision support tool, not a decision maker';
COMMENT ON COLUMN avalanche_briefings.source_url IS 'URL to the official avalanche forecast source that this briefing summarizes';
COMMENT ON COLUMN avalanche_briefings.field_observation_prompts IS 'Array of questions prompting users to make their own field observations';
COMMENT ON COLUMN avalanche_briefings.forecast_url IS 'Direct link to the official forecast page';

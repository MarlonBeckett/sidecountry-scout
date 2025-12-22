-- Create weather_data table for caching Open-Meteo weather data
CREATE TABLE IF NOT EXISTS weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center VARCHAR(100) NOT NULL,
  zone VARCHAR(255) NOT NULL,
  forecast_date DATE NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  weather_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT weather_data_unique UNIQUE (center, zone, forecast_date)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_weather_center_zone ON weather_data(center, zone);
CREATE INDEX IF NOT EXISTS idx_weather_date ON weather_data(forecast_date);
CREATE INDEX IF NOT EXISTS idx_weather_created_at ON weather_data(created_at);
CREATE INDEX IF NOT EXISTS idx_weather_coordinates ON weather_data(latitude, longitude);

-- Enable Row Level Security
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (weather data is public)
CREATE POLICY "Allow public read access to weather data"
  ON weather_data FOR SELECT
  TO public
  USING (true);

-- Create policy to allow service role to insert/update
CREATE POLICY "Allow service role to manage weather data"
  ON weather_data FOR ALL
  TO service_role
  USING (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weather_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER weather_data_updated_at
  BEFORE UPDATE ON weather_data
  FOR EACH ROW
  EXECUTE FUNCTION update_weather_data_updated_at();

-- Add comment to table
COMMENT ON TABLE weather_data IS 'Caches weather data from Open-Meteo API for avalanche forecast zones';

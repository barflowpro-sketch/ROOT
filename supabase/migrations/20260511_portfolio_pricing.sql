ALTER TABLE specialist_profiles ADD COLUMN IF NOT EXISTS service_prices JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS portfolio_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

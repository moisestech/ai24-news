-- Create news table with art style tracking
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  art_style_id TEXT,
  art_style_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Add constraints
  CONSTRAINT unique_title_in_timeframe UNIQUE (title, created_at),
  CONSTRAINT check_image_url CHECK (image_url ~ '^https?://.*$')
);

-- Add index for faster queries
CREATE INDEX idx_news_created_at ON news(created_at DESC); 
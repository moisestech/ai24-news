-- Add audio-related columns to news_history table
ALTER TABLE news_history
ADD COLUMN audio_url TEXT,
ADD COLUMN audio_alignment JSONB;

-- Add constraint to ensure audio_url is a valid URL if present
ALTER TABLE news_history
ADD CONSTRAINT check_audio_url CHECK (audio_url IS NULL OR audio_url ~ '^https?://.*$');

-- Create index for audio_url
CREATE INDEX idx_news_history_audio_url ON news_history(audio_url);

-- Update the unique constraint to include audio_url
ALTER TABLE news_history
DROP CONSTRAINT unique_headline_source,
ADD CONSTRAINT unique_headline_source UNIQUE (headline, source, audio_url); 
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Emails table
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- News history table
CREATE TABLE IF NOT EXISTS news_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    headline TEXT NOT NULL,
    source TEXT NOT NULL,
    url TEXT NOT NULL,
    image_url TEXT,
    audio_url TEXT,
    audio_alignment JSONB,
    art_style TEXT,
    prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_email TEXT REFERENCES auth.users(email)
);

-- Rate limiting table (for Upstash backup/sync)
CREATE TABLE rate_limits (
    email TEXT PRIMARY KEY REFERENCES emails(email),
    daily_requests_remaining INTEGER DEFAULT 5,
    last_reset TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_history_created_at ON news_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_history_user_email ON news_history(user_email);

-- Add unique constraint to existing table
ALTER TABLE news_history
ADD CONSTRAINT unique_headline_source UNIQUE (headline, source); 
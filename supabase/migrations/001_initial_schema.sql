-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Emails table
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- News history table
CREATE TABLE news_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    headline TEXT NOT NULL,
    source TEXT,
    url TEXT,
    image_url TEXT,
    user_email TEXT REFERENCES emails(email),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Rate limiting table (for Upstash backup/sync)
CREATE TABLE rate_limits (
    email TEXT PRIMARY KEY REFERENCES emails(email),
    daily_requests_remaining INTEGER DEFAULT 5,
    last_reset TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_news_history_user_email ON news_history(user_email);
CREATE INDEX idx_news_history_created_at ON news_history(created_at); 
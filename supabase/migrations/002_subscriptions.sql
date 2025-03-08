-- Subscription tracking
CREATE TYPE subscription_tier AS ENUM ('FREE', 'PRO', 'UNLIMITED');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL REFERENCES emails(email),
  tier subscription_tier NOT NULL DEFAULT 'FREE',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  stripe_subscription_id TEXT,
  
  CONSTRAINT unique_active_subscription 
    UNIQUE (user_email, is_active)
);

-- Usage tracking
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL REFERENCES emails(email),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  visualizations_count INTEGER DEFAULT 0,
  
  CONSTRAINT unique_daily_usage 
    UNIQUE (user_email, date)
); 
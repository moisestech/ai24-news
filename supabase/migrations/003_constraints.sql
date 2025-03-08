-- Add constraints to existing tables
ALTER TABLE usage_metrics
  ADD CONSTRAINT unique_daily_usage 
  UNIQUE (user_email, date);

-- Add function for atomic increment
CREATE OR REPLACE FUNCTION increment_usage(p_email TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_metrics (user_email, date, visualizations_count)
  VALUES (p_email, CURRENT_DATE, 1)
  ON CONFLICT (user_email, date) 
  DO UPDATE SET visualizations_count = usage_metrics.visualizations_count + 1;
END;
$$ LANGUAGE plpgsql; 
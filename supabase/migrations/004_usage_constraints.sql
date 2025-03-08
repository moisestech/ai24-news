-- Ensure unique daily usage records per user
ALTER TABLE usage_metrics
ADD CONSTRAINT unique_daily_user_usage 
UNIQUE (user_email, date);

-- Add check constraint for non-negative usage
ALTER TABLE usage_metrics
ADD CONSTRAINT non_negative_usage 
CHECK (visualizations_count >= 0);

-- Add trigger for automatic daily reset
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS trigger AS $$
BEGIN
  IF NEW.date != OLD.date THEN
    NEW.visualizations_count := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 
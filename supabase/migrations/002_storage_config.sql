-- Create storage bucket for news audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('news-audio', 'news-audio', true, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg']);

-- Update CORS configuration for the bucket
UPDATE storage.buckets
SET cors_origins = array['*'],
    cors_methods = array['GET', 'HEAD', 'OPTIONS'],
    cors_allowed_headers = array[
      'authorization',
      'x-client-info',
      'apikey',
      'content-type',
      'range',
      'accept-ranges'
    ],
    cors_exposed_headers = array[
      'content-length',
      'content-range',
      'accept-ranges',
      'content-type'
    ],
    cors_max_age_seconds = 3600
WHERE id = 'news-audio';

-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Service Role Upload" ON storage.objects;

-- Create policies for public access and service role uploads
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'news-audio');

CREATE POLICY "Service Role Upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'news-audio');
-- Create table for caching Wikipedia article rewrites
CREATE TABLE IF NOT EXISTS public.article_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wikipedia_url TEXT NOT NULL UNIQUE,
  original_content TEXT NOT NULL,
  rewritten_content TEXT NOT NULL,
  insights JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster URL lookups
CREATE INDEX IF NOT EXISTS idx_article_cache_url ON public.article_cache(wikipedia_url);

-- Enable RLS (not strictly needed for this use case but good practice)
ALTER TABLE public.article_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cached articles
CREATE POLICY "Allow public read access to article cache"
  ON public.article_cache
  FOR SELECT
  USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_article_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_article_cache_updated_at
  BEFORE UPDATE ON public.article_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_article_cache_updated_at();
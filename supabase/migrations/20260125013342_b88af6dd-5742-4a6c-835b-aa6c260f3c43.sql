-- Add Sefaria citation tracking columns to scholars table
ALTER TABLE public.scholars
ADD COLUMN IF NOT EXISTS sefaria_citations_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sefaria_citing_sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sefaria_last_updated TIMESTAMP WITH TIME ZONE;

-- Create index for efficient citation-based queries
CREATE INDEX IF NOT EXISTS idx_scholars_citations ON public.scholars(sefaria_citations_total DESC);

-- Add comment for documentation
COMMENT ON COLUMN public.scholars.sefaria_citations_total IS 'Total number of citations from Sefaria API';
COMMENT ON COLUMN public.scholars.sefaria_citing_sources IS 'JSON array of works that cite this scholar, with counts';
COMMENT ON COLUMN public.scholars.sefaria_last_updated IS 'Last time Sefaria data was refreshed';
-- Add work_id to manuscript_sources (edition_sources already has it)
ALTER TABLE public.manuscript_sources
ADD COLUMN work_id uuid REFERENCES public.works(id);

-- Add work_id to geographic_distribution
ALTER TABLE public.geographic_distribution
ADD COLUMN work_id uuid REFERENCES public.works(id);

-- Create indexes for efficient work-level queries
CREATE INDEX IF NOT EXISTS idx_manuscript_sources_work_id ON public.manuscript_sources(work_id);
CREATE INDEX IF NOT EXISTS idx_edition_sources_work_id ON public.edition_sources(work_id);
CREATE INDEX IF NOT EXISTS idx_geographic_distribution_work_id ON public.geographic_distribution(work_id);

-- Add comments
COMMENT ON COLUMN public.manuscript_sources.work_id IS 'Links source to specific work for work-level scoring.';
COMMENT ON COLUMN public.geographic_distribution.work_id IS 'Links geographic spread to specific work for work-level scoring.';
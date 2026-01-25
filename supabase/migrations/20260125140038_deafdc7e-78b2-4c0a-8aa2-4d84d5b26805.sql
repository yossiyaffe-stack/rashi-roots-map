-- Add digital_url column to work_locations for linking to online manuscripts/resources
ALTER TABLE public.work_locations ADD COLUMN IF NOT EXISTS digital_url text;

-- Add a comment for documentation
COMMENT ON COLUMN public.work_locations.digital_url IS 'URL to digital version of manuscript, print edition, or other resource';

-- Create index for faster lookups on records with URLs
CREATE INDEX IF NOT EXISTS idx_work_locations_digital_url ON public.work_locations (digital_url) WHERE digital_url IS NOT NULL;
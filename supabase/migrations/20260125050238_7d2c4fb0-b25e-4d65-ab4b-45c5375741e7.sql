-- Add enhanced link columns to works table
ALTER TABLE public.works
ADD COLUMN IF NOT EXISTS manuscript_link_url text,
ADD COLUMN IF NOT EXISTS manuscript_link_text text,
ADD COLUMN IF NOT EXISTS manuscript_repository text,
ADD COLUMN IF NOT EXISTS print_link_url text,
ADD COLUMN IF NOT EXISTS print_link_text text,
ADD COLUMN IF NOT EXISTS print_repository text,
ADD COLUMN IF NOT EXISTS sefaria_text text;

-- Note: sefaria_url already exists, keeping it
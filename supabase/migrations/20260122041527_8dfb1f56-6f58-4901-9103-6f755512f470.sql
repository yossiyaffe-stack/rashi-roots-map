-- Add manuscript_url column to works table for storing digital access links
ALTER TABLE public.works ADD COLUMN manuscript_url TEXT;
ALTER TABLE public.works ADD COLUMN manuscript_id TEXT;
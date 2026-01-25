-- Add separate URL fields for different resource types
ALTER TABLE public.works 
ADD COLUMN IF NOT EXISTS sefaria_url text,
ADD COLUMN IF NOT EXISTS hebrewbooks_url text;

-- Update Rashi's Commentary on Torah with proper links
UPDATE public.works 
SET 
  sefaria_url = 'https://www.sefaria.org/Rashi_on_Genesis.1.1',
  hebrewbooks_url = 'https://hebrewbooks.org/14559',
  manuscript_url = 'https://www.nli.org.il/he/discover/manuscripts/hebrew-manuscripts/viewerpage?vid=MANUSCRIPTS&docid=PNX_MANUSCRIPTS003858442'
WHERE id = '4ed54050-6058-44a3-9398-6ff8500a05b7';

-- Also update Rashi's Talmud Commentary
UPDATE public.works 
SET 
  sefaria_url = 'https://www.sefaria.org/Rashi_on_Berakhot.2a.1'
WHERE id = 'bda203c5-c85c-4a32-acd2-e7876e3d8351';
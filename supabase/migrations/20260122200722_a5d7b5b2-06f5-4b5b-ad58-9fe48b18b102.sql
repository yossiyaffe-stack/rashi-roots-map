-- Add category column to historical_events for filtering between Jewish and Secular history
ALTER TABLE public.historical_events 
ADD COLUMN category text DEFAULT 'jewish' CHECK (category IN ('jewish', 'secular'));

-- Update existing events - categorize based on name patterns
-- Events mentioning rabbis, Rashi, Jewish terms are Jewish; others are secular
UPDATE public.historical_events
SET category = CASE
  WHEN name ILIKE '%rashi%' THEN 'jewish'
  WHEN name ILIKE '%rabbi%' THEN 'jewish'
  WHEN name ILIKE '%maharal%' THEN 'jewish'
  WHEN name ILIKE '%gershom%' THEN 'jewish'
  WHEN name ILIKE '%maimonides%' THEN 'jewish'
  WHEN name ILIKE '%saadia%' THEN 'jewish'
  WHEN name ILIKE '%disputation%' THEN 'jewish'
  WHEN name ILIKE '%expulsion%' THEN 'jewish'
  WHEN name ILIKE '%persecution%' THEN 'jewish'
  WHEN name ILIKE '%massacre%' THEN 'jewish'
  WHEN name ILIKE '%takkanot%' THEN 'jewish'
  WHEN name ILIKE '%shulchan%' THEN 'jewish'
  WHEN name ILIKE '%hebrew%' THEN 'jewish'
  WHEN name ILIKE '%council%' THEN 'secular'
  WHEN name ILIKE '%crusade%' THEN 'secular'
  ELSE 'jewish'
END;
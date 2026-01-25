-- Add domain fields to scholars table
ALTER TABLE public.scholars 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS primary_domain TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS secondary_domains TEXT[] DEFAULT '{}';

-- Create unique index on slug for efficient lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_scholars_slug ON public.scholars(slug) WHERE slug IS NOT NULL;

-- Set initial slug values based on name patterns
UPDATE public.scholars SET slug = 'rashi' WHERE name ILIKE '%Rashi%' AND id = '00000000-0000-0000-0000-000000000001';
UPDATE public.scholars SET slug = 'ramban' WHERE name ILIKE '%Ramban%' OR name ILIKE '%Nachmanides%';
UPDATE public.scholars SET slug = 'ibn_ezra' WHERE name ILIKE '%Ibn Ezra%';
UPDATE public.scholars SET slug = 'rashbam' WHERE name ILIKE '%Rashbam%' OR name ILIKE '%Samuel ben Meir%';
UPDATE public.scholars SET slug = 'rabbeinu_tam' WHERE name ILIKE '%Rabbeinu Tam%' OR name ILIKE '%Jacob ben Meir%';
UPDATE public.scholars SET slug = 'maharal' WHERE name ILIKE '%Maharal%' OR name ILIKE '%Judah Loew%';
UPDATE public.scholars SET slug = 'vilna_gaon' WHERE name ILIKE '%Vilna Gaon%' OR name ILIKE '%Elijah%Solomon%Zalman%';
UPDATE public.scholars SET slug = 'mizrahi' WHERE name ILIKE '%Mizrahi%' OR name ILIKE '%Re''em%';
UPDATE public.scholars SET slug = 'shabbetai_bass' WHERE name ILIKE '%Shabbetai Bass%';
UPDATE public.scholars SET slug = 'taz' WHERE name ILIKE '%Taz%' OR name ILIKE '%David HaLevi Segal%';
UPDATE public.scholars SET slug = 'maharshal' WHERE name ILIKE '%Maharshal%' OR name ILIKE '%Solomon Luria%';

-- Set domain assignments for known scholars
UPDATE public.scholars 
SET primary_domain = 'torah_commentary', 
    secondary_domains = ARRAY['talmud_commentary']
WHERE slug = 'rashi';

UPDATE public.scholars 
SET primary_domain = 'torah_commentary', 
    secondary_domains = ARRAY['kabbalah', 'halakha']
WHERE slug = 'ramban';

UPDATE public.scholars 
SET primary_domain = 'torah_commentary'
WHERE slug IN ('ibn_ezra', 'rashbam', 'mizrahi');

UPDATE public.scholars 
SET primary_domain = 'talmud_commentary'
WHERE slug IN ('rabbeinu_tam', 'maharshal');

UPDATE public.scholars 
SET primary_domain = 'kabbalah',
    secondary_domains = ARRAY['torah_commentary']
WHERE slug = 'maharal';

UPDATE public.scholars 
SET primary_domain = 'halakha',
    secondary_domains = ARRAY['talmud_commentary']
WHERE slug IN ('vilna_gaon', 'taz');
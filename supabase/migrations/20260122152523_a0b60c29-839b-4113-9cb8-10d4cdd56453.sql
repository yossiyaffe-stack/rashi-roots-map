-- ============================================
-- LOCATION_NAMES TABLE (Multilingual Name Variations)
-- Stores all historical and linguistic variations of place names
-- ============================================

CREATE TABLE public.location_names (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference to the place
    place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
    
    -- The name itself
    name VARCHAR(200) NOT NULL,
    
    -- Name classification
    name_type VARCHAR(50) NOT NULL, -- official_modern, official_historical, hebrew_traditional, yiddish_colloquial, latin_scholarly, etc.
    language VARCHAR(10) NOT NULL, -- en, he, yi, de, fr, la, ar, etc.
    script VARCHAR(20) DEFAULT 'latin', -- latin, hebrew, cyrillic, arabic, etc.
    
    -- Time period when this name was used
    valid_from INTEGER, -- Year (e.g., 1096)
    valid_to INTEGER,   -- Year (e.g., 1918) - NULL means still valid
    
    -- Context and origin
    name_origin VARCHAR(100), -- official, colloquial, scholarly, rabbinic, etc.
    source TEXT, -- Where this name was found (manuscript, responsa, etc.)
    
    -- Is this the preferred name for this language/time period?
    is_preferred BOOLEAN DEFAULT false,
    
    -- Search optimization - normalized form for fuzzy matching
    normalized_name VARCHAR(200),
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.location_names ENABLE ROW LEVEL SECURITY;

-- Create policies (public read, admin write)
CREATE POLICY "Anyone can view location_names" 
ON public.location_names 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert location_names" 
ON public.location_names 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update location_names" 
ON public.location_names 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete location_names" 
ON public.location_names 
FOR DELETE 
USING (is_admin());

-- Indexes for common queries
CREATE INDEX idx_location_names_place ON public.location_names(place_id);
CREATE INDEX idx_location_names_language ON public.location_names(language);
CREATE INDEX idx_location_names_type ON public.location_names(name_type);
CREATE INDEX idx_location_names_period ON public.location_names(valid_from, valid_to);
CREATE INDEX idx_location_names_search ON public.location_names(normalized_name);

-- Trigger for updated_at
CREATE TRIGGER update_location_names_updated_at
BEFORE UPDATE ON public.location_names
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to normalize names for search (removes diacritics, lowercases)
CREATE OR REPLACE FUNCTION public.normalize_place_name(input_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(
    translate(
      input_name,
      'àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝŸ',
      'aaaaaaaceeeeiiiinooooooouuuuyyAAAAAAAACEEEEIIIINOOOOOOUUUUYY'
    )
  )
$$;

-- Trigger to auto-populate normalized_name
CREATE OR REPLACE FUNCTION public.set_normalized_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only normalize Latin script names
  IF NEW.script = 'latin' THEN
    NEW.normalized_name := normalize_place_name(NEW.name);
  ELSE
    NEW.normalized_name := lower(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER location_names_normalize
BEFORE INSERT OR UPDATE ON public.location_names
FOR EACH ROW
EXECUTE FUNCTION public.set_normalized_name();
-- ============================================
-- PLACES TABLE (Cities/Locations for Map Display)
-- Separate from 'locations' table which tracks scholar movements
-- ============================================

CREATE TABLE public.places (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Geographic coordinates
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    
    -- Modern context
    modern_country VARCHAR(100),
    modern_name VARCHAR(200) NOT NULL,
    
    -- Display names (for map labels)
    name_english VARCHAR(200) NOT NULL,
    name_hebrew VARCHAR(200),
    
    -- Historical names (for when regions are selected)
    name_historical VARCHAR(200),
    historical_context TEXT,
    
    -- Classification
    location_type VARCHAR(50) DEFAULT 'city', -- city, town, village, region
    importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10), -- 1-10 scale
    
    -- Regional classification (from Barzen map)
    medieval_region VARCHAR(100), -- Loter, Ashkenaz, Z'arfat, etc.
    is_bishopric BOOLEAN DEFAULT false,
    is_archbishopric BOOLEAN DEFAULT false,
    is_shum_city BOOLEAN DEFAULT false, -- Speyer, Worms, Mainz
    
    -- Time period when this place was significant
    significance_start_year INTEGER,
    significance_end_year INTEGER,
    
    -- Notes and sources
    notes TEXT,
    source TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Create policies (public read, admin write)
CREATE POLICY "Anyone can view places" 
ON public.places 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert places" 
ON public.places 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update places" 
ON public.places 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete places" 
ON public.places 
FOR DELETE 
USING (is_admin());

-- Indexes for common queries
CREATE INDEX idx_places_coordinates ON public.places(latitude, longitude);
CREATE INDEX idx_places_importance ON public.places(importance DESC);
CREATE INDEX idx_places_region ON public.places(medieval_region);

-- Trigger for updated_at
CREATE TRIGGER update_places_updated_at
BEFORE UPDATE ON public.places
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
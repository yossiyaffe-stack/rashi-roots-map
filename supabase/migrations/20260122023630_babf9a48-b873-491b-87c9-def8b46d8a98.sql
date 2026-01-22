-- Create enums for relationship types and other categorizations
CREATE TYPE public.relationship_type AS ENUM ('family', 'educational', 'literary');
CREATE TYPE public.family_subtype AS ENUM ('parent', 'child', 'sibling', 'spouse', 'grandparent', 'grandchild');
CREATE TYPE public.educational_subtype AS ENUM ('teacher', 'student', 'study_partner');
CREATE TYPE public.literary_subtype AS ENUM ('supercommentary', 'explanation', 'debate', 'response', 'citation', 'translation');
CREATE TYPE public.work_type AS ENUM ('commentary', 'responsa', 'talmud_commentary', 'halakha', 'philosophy', 'kabbalah', 'supercommentary', 'poetry', 'grammar', 'ethics', 'homiletics', 'other');
CREATE TYPE public.location_reason AS ENUM ('birth', 'study', 'rabbinate', 'exile', 'refuge', 'travel', 'death');
CREATE TYPE public.event_importance AS ENUM ('critical', 'major', 'foundational', 'scholarly');

-- Create app_role enum for admin management
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');

-- Create user_roles table for admin access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Create scholars table
CREATE TABLE public.scholars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    hebrew_name TEXT,
    birth_year INTEGER,
    death_year INTEGER,
    birth_place TEXT,
    death_place TEXT,
    bio TEXT,
    importance INTEGER DEFAULT 50 CHECK (importance >= 1 AND importance <= 100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    period TEXT,
    relationship_type TEXT, -- e.g., 'foundational_commentator', 'supercommentator'
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create works table
CREATE TABLE public.works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scholar_id UUID REFERENCES public.scholars(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    hebrew_title TEXT,
    year_written INTEGER,
    work_type work_type NOT NULL DEFAULT 'other',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create relationships table with polymorphic structure
CREATE TABLE public.relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type relationship_type NOT NULL,
    -- For family relationships
    family_subtype family_subtype,
    -- For educational relationships
    educational_subtype educational_subtype,
    -- For literary relationships
    literary_subtype literary_subtype,
    -- From entity (can be scholar or work)
    from_scholar_id UUID REFERENCES public.scholars(id) ON DELETE CASCADE,
    from_work_id UUID REFERENCES public.works(id) ON DELETE CASCADE,
    -- To entity (can be scholar or work)
    to_scholar_id UUID REFERENCES public.scholars(id) ON DELETE CASCADE,
    to_work_id UUID REFERENCES public.works(id) ON DELETE CASCADE,
    -- Metadata
    description TEXT,
    start_year INTEGER,
    end_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- Ensure at least one from and one to reference exists
    CONSTRAINT valid_from_reference CHECK (from_scholar_id IS NOT NULL OR from_work_id IS NOT NULL),
    CONSTRAINT valid_to_reference CHECK (to_scholar_id IS NOT NULL OR to_work_id IS NOT NULL),
    -- Ensure subtype matches relationship type
    CONSTRAINT valid_family_subtype CHECK (type != 'family' OR family_subtype IS NOT NULL),
    CONSTRAINT valid_educational_subtype CHECK (type != 'educational' OR educational_subtype IS NOT NULL),
    CONSTRAINT valid_literary_subtype CHECK (type != 'literary' OR literary_subtype IS NOT NULL)
);

-- Create locations table for scholar locations over time
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scholar_id UUID REFERENCES public.scholars(id) ON DELETE CASCADE NOT NULL,
    location_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    start_year INTEGER,
    end_year INTEGER,
    reason location_reason,
    historical_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create historical_events table
CREATE TABLE public.historical_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    importance event_importance NOT NULL DEFAULT 'scholarly',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.scholars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scholars (public read, admin write)
CREATE POLICY "Anyone can view scholars"
    ON public.scholars FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert scholars"
    ON public.scholars FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update scholars"
    ON public.scholars FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete scholars"
    ON public.scholars FOR DELETE
    USING (public.is_admin());

-- Create RLS policies for works
CREATE POLICY "Anyone can view works"
    ON public.works FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert works"
    ON public.works FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update works"
    ON public.works FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete works"
    ON public.works FOR DELETE
    USING (public.is_admin());

-- Create RLS policies for relationships
CREATE POLICY "Anyone can view relationships"
    ON public.relationships FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert relationships"
    ON public.relationships FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update relationships"
    ON public.relationships FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete relationships"
    ON public.relationships FOR DELETE
    USING (public.is_admin());

-- Create RLS policies for locations
CREATE POLICY "Anyone can view locations"
    ON public.locations FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert locations"
    ON public.locations FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update locations"
    ON public.locations FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete locations"
    ON public.locations FOR DELETE
    USING (public.is_admin());

-- Create RLS policies for historical_events
CREATE POLICY "Anyone can view historical_events"
    ON public.historical_events FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert historical_events"
    ON public.historical_events FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update historical_events"
    ON public.historical_events FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete historical_events"
    ON public.historical_events FOR DELETE
    USING (public.is_admin());

-- Create RLS policies for user_roles (only admins can manage)
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.is_admin());

-- Create indexes for better query performance
CREATE INDEX idx_scholars_name ON public.scholars(name);
CREATE INDEX idx_scholars_period ON public.scholars(period);
CREATE INDEX idx_scholars_birth_year ON public.scholars(birth_year);
CREATE INDEX idx_scholars_location ON public.scholars(latitude, longitude);
CREATE INDEX idx_works_scholar ON public.works(scholar_id);
CREATE INDEX idx_works_type ON public.works(work_type);
CREATE INDEX idx_relationships_type ON public.relationships(type);
CREATE INDEX idx_relationships_from_scholar ON public.relationships(from_scholar_id);
CREATE INDEX idx_relationships_to_scholar ON public.relationships(to_scholar_id);
CREATE INDEX idx_locations_scholar ON public.locations(scholar_id);
CREATE INDEX idx_historical_events_year ON public.historical_events(year);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_scholars_updated_at
    BEFORE UPDATE ON public.scholars
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_works_updated_at
    BEFORE UPDATE ON public.works
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
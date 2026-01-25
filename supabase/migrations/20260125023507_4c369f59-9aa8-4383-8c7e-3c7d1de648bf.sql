-- Create table for manuscript sources
CREATE TABLE public.manuscript_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scholar_id UUID NOT NULL,
    repository TEXT NOT NULL,
    location TEXT,
    date_min INTEGER,
    date_max INTEGER,
    century TEXT,
    manuscript_type TEXT,
    coverage TEXT,
    script TEXT,
    notes TEXT,
    digital_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for edition sources (both historical and modern print)
CREATE TABLE public.edition_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scholar_id UUID NOT NULL,
    work_id UUID,
    year INTEGER,
    year_gregorian INTEGER,
    location TEXT,
    location_hebrew TEXT,
    publisher TEXT,
    edition_type TEXT NOT NULL,
    status TEXT,
    surviving_copies TEXT,
    notes TEXT,
    significance INTEGER,
    digital_url TEXT,
    century INTEGER,
    specific_book TEXT,
    subjects TEXT,
    title TEXT,
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for geographic distribution data
CREATE TABLE public.geographic_distribution (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scholar_id UUID NOT NULL,
    location TEXT NOT NULL,
    location_type TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manuscript_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geographic_distribution ENABLE ROW LEVEL SECURITY;

-- RLS policies for manuscript_sources
CREATE POLICY "Anyone can view manuscript_sources" ON public.manuscript_sources FOR SELECT USING (true);
CREATE POLICY "Admins can insert manuscript_sources" ON public.manuscript_sources FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update manuscript_sources" ON public.manuscript_sources FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete manuscript_sources" ON public.manuscript_sources FOR DELETE USING (is_admin());

-- RLS policies for edition_sources
CREATE POLICY "Anyone can view edition_sources" ON public.edition_sources FOR SELECT USING (true);
CREATE POLICY "Admins can insert edition_sources" ON public.edition_sources FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update edition_sources" ON public.edition_sources FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete edition_sources" ON public.edition_sources FOR DELETE USING (is_admin());

-- RLS policies for geographic_distribution
CREATE POLICY "Anyone can view geographic_distribution" ON public.geographic_distribution FOR SELECT USING (true);
CREATE POLICY "Admins can insert geographic_distribution" ON public.geographic_distribution FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update geographic_distribution" ON public.geographic_distribution FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete geographic_distribution" ON public.geographic_distribution FOR DELETE USING (is_admin());

-- Create indexes for performance
CREATE INDEX idx_manuscript_sources_scholar ON public.manuscript_sources(scholar_id);
CREATE INDEX idx_edition_sources_scholar ON public.edition_sources(scholar_id);
CREATE INDEX idx_edition_sources_year ON public.edition_sources(year_gregorian);
CREATE INDEX idx_geographic_distribution_scholar ON public.geographic_distribution(scholar_id);
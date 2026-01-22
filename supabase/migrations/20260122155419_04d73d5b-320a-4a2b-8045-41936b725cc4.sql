-- ============================================
-- MULTI-DIMENSIONAL RELATIONSHIP SCHEMA
-- 3 separate tables for biographical, textual, and intellectual relationships
-- ============================================

-- Create enum types for relationship categories and certainty levels
CREATE TYPE relationship_domain AS ENUM ('biographical', 'textual', 'intellectual');
CREATE TYPE relationship_certainty AS ENUM ('certain', 'probable', 'possible', 'speculated');

-- ============================================
-- BIOGRAPHICAL_RELATIONSHIPS TABLE
-- Person-to-Person relationships
-- ============================================
CREATE TABLE public.biographical_relationships (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scholar_id UUID NOT NULL REFERENCES public.scholars(id) ON DELETE CASCADE,
    related_scholar_id UUID NOT NULL REFERENCES public.scholars(id) ON DELETE CASCADE,
    
    -- Relationship type classification
    relationship_category VARCHAR(50) NOT NULL, -- family, pedagogical, professional, social, institutional
    relationship_type VARCHAR(50) NOT NULL,     -- father, son, teacher, student, etc.
    
    -- Time period when relationship was active
    from_year INTEGER,
    to_year INTEGER,
    circa BOOLEAN DEFAULT false,
    
    -- Certainty and importance
    certainty relationship_certainty DEFAULT 'certain',
    primary_relationship BOOLEAN DEFAULT false,
    
    -- Context
    location_id UUID REFERENCES public.places(id),
    notes TEXT,
    source TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TEXTUAL_RELATIONSHIPS TABLE
-- Work-to-Work relationships (commentary chains, citations)
-- ============================================
CREATE TABLE public.textual_relationships (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
    related_work_id UUID REFERENCES public.works(id) ON DELETE CASCADE,
    
    -- If relating to a canonical text without work record
    related_text_canonical VARCHAR(100),  -- e.g., 'torah', 'talmud_bavli'
    
    -- Relationship type classification
    relationship_category VARCHAR(50) NOT NULL, -- commentary, citation, influence, response, transmission
    relationship_type VARCHAR(50) NOT NULL,     -- base_text, direct_commentary, supercommentary_1, etc.
    
    -- Commentary depth level (for supercommentary chains)
    depth_level INTEGER DEFAULT 0, -- 0=base, 1=commentary, 2=super, 3=super-super
    
    -- Subject classification
    subject_type VARCHAR(50), -- biblical, talmudic, mishnaic, halakhic, kabbalistic
    subject_text VARCHAR(100), -- specific book (Genesis, Berakhot, etc.)
    
    -- Citation details
    section_reference TEXT, -- Chapter/verse or tractate/folio reference
    citation_count INTEGER DEFAULT 1,
    
    -- Certainty
    certainty relationship_certainty DEFAULT 'certain',
    
    notes TEXT,
    source TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- INTELLECTUAL_RELATIONSHIPS TABLE
-- Person-to-Work or Person-to-Idea relationships
-- ============================================
CREATE TABLE public.intellectual_relationships (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scholar_id UUID NOT NULL REFERENCES public.scholars(id) ON DELETE CASCADE,
    work_id UUID REFERENCES public.works(id) ON DELETE CASCADE,
    
    -- If relating to a canonical text or concept without work record
    related_concept VARCHAR(200),
    
    -- Relationship type classification
    relationship_category VARCHAR(50) NOT NULL, -- authorship, study, methodology, school, transmission
    relationship_type VARCHAR(50) NOT NULL,     -- author, studied, influenced_by, school_founder, etc.
    
    -- Time period
    from_year INTEGER,
    to_year INTEGER,
    circa BOOLEAN DEFAULT false,
    
    -- Importance and certainty
    certainty relationship_certainty DEFAULT 'certain',
    influence_strength VARCHAR(20) DEFAULT 'moderate', -- strong, moderate, minor
    
    notes TEXT,
    source TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Biographical indexes
CREATE INDEX idx_bio_rel_scholar ON public.biographical_relationships(scholar_id);
CREATE INDEX idx_bio_rel_related ON public.biographical_relationships(related_scholar_id);
CREATE INDEX idx_bio_rel_type ON public.biographical_relationships(relationship_type);
CREATE INDEX idx_bio_rel_category ON public.biographical_relationships(relationship_category);
CREATE INDEX idx_bio_rel_dates ON public.biographical_relationships(from_year, to_year);

-- Textual indexes
CREATE INDEX idx_text_rel_work ON public.textual_relationships(work_id);
CREATE INDEX idx_text_rel_related_work ON public.textual_relationships(related_work_id);
CREATE INDEX idx_text_rel_type ON public.textual_relationships(relationship_type);
CREATE INDEX idx_text_rel_category ON public.textual_relationships(relationship_category);
CREATE INDEX idx_text_rel_subject ON public.textual_relationships(subject_type, subject_text);

-- Intellectual indexes
CREATE INDEX idx_intel_rel_scholar ON public.intellectual_relationships(scholar_id);
CREATE INDEX idx_intel_rel_work ON public.intellectual_relationships(work_id);
CREATE INDEX idx_intel_rel_type ON public.intellectual_relationships(relationship_type);
CREATE INDEX idx_intel_rel_category ON public.intellectual_relationships(relationship_category);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE public.biographical_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textual_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intellectual_relationships ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view biographical_relationships" ON public.biographical_relationships FOR SELECT USING (true);
CREATE POLICY "Anyone can view textual_relationships" ON public.textual_relationships FOR SELECT USING (true);
CREATE POLICY "Anyone can view intellectual_relationships" ON public.intellectual_relationships FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can insert biographical_relationships" ON public.biographical_relationships FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update biographical_relationships" ON public.biographical_relationships FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete biographical_relationships" ON public.biographical_relationships FOR DELETE USING (is_admin());

CREATE POLICY "Admins can insert textual_relationships" ON public.textual_relationships FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update textual_relationships" ON public.textual_relationships FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete textual_relationships" ON public.textual_relationships FOR DELETE USING (is_admin());

CREATE POLICY "Admins can insert intellectual_relationships" ON public.intellectual_relationships FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update intellectual_relationships" ON public.intellectual_relationships FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete intellectual_relationships" ON public.intellectual_relationships FOR DELETE USING (is_admin());

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE TRIGGER update_biographical_relationships_updated_at
BEFORE UPDATE ON public.biographical_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_textual_relationships_updated_at
BEFORE UPDATE ON public.textual_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_intellectual_relationships_updated_at
BEFORE UPDATE ON public.intellectual_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
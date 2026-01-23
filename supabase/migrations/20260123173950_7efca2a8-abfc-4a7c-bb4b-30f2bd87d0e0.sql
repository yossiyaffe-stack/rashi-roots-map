-- Create enum for work location event types
CREATE TYPE public.work_location_type AS ENUM (
  'composition',
  'first_print',
  'reprint',
  'manuscript_copy',
  'translation'
);

-- Create work_locations table to track geographic history of works
CREATE TABLE public.work_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  place_id UUID REFERENCES public.places(id),
  location_type public.work_location_type NOT NULL,
  year INTEGER,
  circa BOOLEAN DEFAULT false,
  printer_publisher TEXT,
  notes TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view work_locations" 
ON public.work_locations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert work_locations" 
ON public.work_locations 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update work_locations" 
ON public.work_locations 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete work_locations" 
ON public.work_locations 
FOR DELETE 
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_work_locations_updated_at
BEFORE UPDATE ON public.work_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX idx_work_locations_work_id ON public.work_locations(work_id);
CREATE INDEX idx_work_locations_place_id ON public.work_locations(place_id);
CREATE INDEX idx_work_locations_type ON public.work_locations(location_type);
-- Create temporal_influence table for tracking scholar influence over time
CREATE TABLE public.temporal_influence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scholar_id UUID REFERENCES public.scholars(id) ON DELETE CASCADE NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  period_label TEXT,
  manuscripts_new INTEGER DEFAULT 0,
  manuscripts_cumulative INTEGER DEFAULT 0,
  print_editions INTEGER DEFAULT 0,
  geographic_regions INTEGER DEFAULT 0,
  influence_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_temporal_period ON public.temporal_influence(period_start);
CREATE INDEX idx_temporal_scholar ON public.temporal_influence(scholar_id);
CREATE INDEX idx_temporal_score ON public.temporal_influence(influence_score DESC);

-- Enable RLS
ALTER TABLE public.temporal_influence ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view temporal_influence"
ON public.temporal_influence FOR SELECT
USING (true);

CREATE POLICY "Admins can insert temporal_influence"
ON public.temporal_influence FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update temporal_influence"
ON public.temporal_influence FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete temporal_influence"
ON public.temporal_influence FOR DELETE
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_temporal_influence_updated_at
BEFORE UPDATE ON public.temporal_influence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
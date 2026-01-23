-- Add manuscript classification field to work_locations
ALTER TABLE work_locations 
ADD COLUMN manuscript_significance VARCHAR(50) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN work_locations.manuscript_significance IS 'Classification of manuscript importance: oldest, best, important, standard';
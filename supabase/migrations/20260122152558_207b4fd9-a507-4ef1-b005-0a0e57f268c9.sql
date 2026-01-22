-- Fix function search_path security issue
CREATE OR REPLACE FUNCTION public.normalize_place_name(input_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(
    translate(
      input_name,
      'àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝŸ',
      'aaaaaaaceeeeiiiinooooooouuuuyyAAAAAAAACEEEEIIIINOOOOOOUUUUYY'
    )
  )
$$;
-- Add missing manuscript repository cities
INSERT INTO places (name_english, modern_name, modern_country, latitude, longitude, location_type, historical_context, importance)
VALUES 
  ('New York', 'New York', 'United States', 40.7128, -74.0060, 'city', 'Home of Jewish Theological Seminary, major repository of Hebrew manuscripts including Rashi supercommentaries', 7),
  ('Zurich', 'Zurich', 'Switzerland', 47.3769, 8.5417, 'city', 'Zentralbibliothek holds medieval Hebrew manuscripts including anonymous Rashi supercommentaries', 5),
  ('Moscow', 'Moscow', 'Russia', 55.7558, 37.6173, 'city', 'Russian State Military Archive holds Hebrew manuscripts including Safenat paneah', 6),
  ('Parma', 'Parma', 'Italy', 44.8015, 10.3279, 'city', 'Biblioteca Palatina holds significant Hebrew manuscript collection including Maharai commentaries', 5)
ON CONFLICT DO NOTHING;
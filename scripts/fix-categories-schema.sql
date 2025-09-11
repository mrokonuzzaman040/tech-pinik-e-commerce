-- Migration script to ensure all required columns exist
-- Run this in your Supabase SQL Editor

-- Add banner_image_url column to categories table if it doesn't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

-- Verify the categories table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Refresh the schema cache to ensure PostgREST picks up the changes
NOTIFY pgrst, 'reload schema';

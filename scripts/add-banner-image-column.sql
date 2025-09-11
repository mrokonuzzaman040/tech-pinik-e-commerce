-- Add banner_image_url column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
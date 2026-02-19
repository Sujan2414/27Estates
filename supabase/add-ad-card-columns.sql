-- Add ad card columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ad_card_image text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_ad_on_home boolean DEFAULT false;

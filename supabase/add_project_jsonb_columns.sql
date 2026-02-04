-- Add missing JSONB columns to the projects table to support rich detailed views

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS towers_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS project_plan JSONB DEFAULT '[]'::jsonb, -- For the "Project Plan" table (Type, BHK, Area, Price)
ADD COLUMN IF NOT EXISTS specifications_complex JSONB DEFAULT '[]'::jsonb, -- For detailed specifications list
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb; -- To match properties table

-- Add comment to explain the structure
COMMENT ON COLUMN projects.towers_data IS 'Structure: [{ name: "Tower 1", completion_date: "2030-12-31" }, ...]';
COMMENT ON COLUMN projects.project_plan IS 'Structure: [{ tower: "Tower 5", type: "Residential", bhk: 4, area: "2513 Sq.Ft", price: "3.51 Cr" }, ...]';

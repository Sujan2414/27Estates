-- Populate display_name with Project Name if available, otherwise Sub Category or Category
UPDATE properties
SET display_name = COALESCE(
    NULLIF(project_name, ''), 
    NULLIF(sub_category, ''), 
    category,
    'Property'
);

-- For rows where project_name is generic like 'Prestige Group' or 'Embassy', 
-- we might want to append the category for clarity, but for now we stick to user request of "Project Name"

-- Verify the update
SELECT title, project_name, sub_category, display_name 
FROM properties 
LIMIT 20;

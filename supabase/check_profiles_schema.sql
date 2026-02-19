-- ==============================================================
-- VERIFY PROFILES TABLE SCHEMA
-- Run this in Supabase SQL Editor to check what columns exist
-- ==============================================================

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'profiles';

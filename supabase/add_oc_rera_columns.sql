-- ============================================================
-- Migration: Add is_oc_approved to projects,
--            Add is_rera_approved + is_oc_approved to properties
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Projects table: add OC Certificate column
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS is_oc_approved BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Properties table: add RERA and OC columns
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_rera_approved BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_oc_approved   BOOLEAN NOT NULL DEFAULT FALSE;

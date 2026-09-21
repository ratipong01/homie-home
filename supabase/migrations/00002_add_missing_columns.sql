-- Migration 00002: Add missing user & task columns for Pages Function backend
-- Run in Supabase Dashboard > SQL Editor

-- Users: add columns that exist in TypeScript types but were missing from schema
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gender       VARCHAR(10)  NOT NULL DEFAULT 'OTHER',
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
  ADD COLUMN IF NOT EXISTS theme_color  VARCHAR(20)  NOT NULL DEFAULT '#F97316',
  ADD COLUMN IF NOT EXISTS is_virtual   BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS failed_attempts INT        NOT NULL DEFAULT 0;

-- Tasks: add beneficiary columns used for pet/asset task assignment
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS beneficiary_id   UUID REFERENCES house_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS beneficiary_type VARCHAR(30);

-- recovery_keys: add is_used flag if missing
ALTER TABLE recovery_keys
  ADD COLUMN IF NOT EXISTS is_used BOOLEAN NOT NULL DEFAULT FALSE;

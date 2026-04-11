-- SQL to create password_reset_tokens table for JBR7 Bags
-- Run this in Supabase SQL editor or psql connected to your database.

-- Enable pgcrypto for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  -- Match the users.id column type. If your users.id is an integer/bigint, use bigint here.
  -- The error you saw indicates users.id is bigint, so set user_id to bigint.
  user_id bigint REFERENCES public.users(id) ON DELETE SET NULL,
  email text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Optional index to speed lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

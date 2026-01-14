-- TropiChat Waitlist Table Schema
-- Run this in your Supabase SQL Editor

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  business_type TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (for the signup form)
CREATE POLICY "Enable insert for all users" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow read access (optional - only if you need to display count or similar)
CREATE POLICY "Enable read access for all users" ON waitlist
  FOR SELECT
  USING (true);

-- Add comment to table
COMMENT ON TABLE waitlist IS 'Stores email signups for TropiChat early access waitlist';

-- ====================================================================
-- TIDARA SUPABASE PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- Project: https://nkhtxqomvxjqnfwvmjnv.supabase.co
-- Run this in Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text,
  email text,
  wallet_balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure updated_at exists on existing tables
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone text NOT NULL,
  service_id text NOT NULL,
  service_name text NOT NULL,
  price numeric NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  scheduled_at timestamptz NOT NULL,
  address text NOT NULL,
  payment_id text,
  order_id text,
  payment_method text,
  quantity integer DEFAULT 1,
  duration text,
  created_at timestamptz DEFAULT now()
);

-- Add missing columns to existing bookings table
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS order_id text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS duration text;

-- 3. SAVED ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone text NOT NULL,
  address_type text DEFAULT 'Home',
  flat_no text,
  landmark text,
  full_address text NOT NULL,
  city text DEFAULT 'Gurugram',
  latitude double precision,
  longitude double precision,
  created_at timestamptz DEFAULT now()
);

-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- Note: Tidara authenticates via custom WhatsApp OTP gateway (anon client),
-- so the policies grant access to the 'anon' role.

-- Users RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon to select user" ON public.users;
CREATE POLICY "Allow anon to select user" 
  ON public.users FOR SELECT 
  TO anon 
  USING (true);

DROP POLICY IF EXISTS "Allow anon to insert user" ON public.users;
CREATE POLICY "Allow anon to insert user" 
  ON public.users FOR INSERT 
  TO anon 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to update user" ON public.users;
CREATE POLICY "Allow anon to update user" 
  ON public.users FOR UPDATE 
  TO anon 
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to delete user" ON public.users;
CREATE POLICY "Allow anon to delete user" 
  ON public.users FOR DELETE 
  TO anon 
  USING (true);

-- Bookings RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon to select bookings" ON public.bookings;
CREATE POLICY "Allow anon to select bookings" 
  ON public.bookings FOR SELECT 
  TO anon 
  USING (true);

DROP POLICY IF EXISTS "Allow anon to insert bookings" ON public.bookings;
CREATE POLICY "Allow anon to insert bookings" 
  ON public.bookings FOR INSERT 
  TO anon 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to update bookings" ON public.bookings;
CREATE POLICY "Allow anon to update bookings" 
  ON public.bookings FOR UPDATE 
  TO anon 
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to delete bookings" ON public.bookings;
CREATE POLICY "Allow anon to delete bookings" 
  ON public.bookings FOR DELETE 
  TO anon 
  USING (true);

-- Addresses RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon to manage addresses" ON public.addresses;
CREATE POLICY "Allow anon to manage addresses" 
  ON public.addresses FOR ALL 
  TO anon 
  USING (true)
  WITH CHECK (true);

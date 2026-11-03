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
  wallet_balance numeric DEFAULT 0 CHECK (wallet_balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure updated_at & non-negative wallet check exists on existing tables
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS push_token text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_wallet_balance_non_negative'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT chk_wallet_balance_non_negative CHECK (wallet_balance >= 0);
  END IF;
END $$;

-- 2. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone text NOT NULL,
  service_id text NOT NULL,
  service_name text NOT NULL,
  price numeric NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  slot_label text,
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
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS slot_label text;

-- Index for phone queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_phone ON public.bookings(user_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_addresses_user_phone ON public.addresses(user_phone);

-- 4. WALLET TRANSACTIONS LEDGER (C4 Recommendation)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  description text NOT NULL,
  payment_id text,
  order_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_phone ON public.wallet_transactions(user_phone);

-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Drop insecure open-delete policies
DROP POLICY IF EXISTS "Allow anon to delete user" ON public.users;
DROP POLICY IF EXISTS "Allow anon to delete bookings" ON public.bookings;

-- Users RLS
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

-- Bookings RLS
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

-- Addresses RLS
DROP POLICY IF EXISTS "Allow anon to manage addresses" ON public.addresses;
CREATE POLICY "Allow anon to manage addresses" 
  ON public.addresses FOR ALL 
  TO anon 
  USING (true)
  WITH CHECK (true);

-- Wallet Ledger RLS
DROP POLICY IF EXISTS "Allow anon to read own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Allow anon to read own wallet transactions" 
  ON public.wallet_transactions FOR SELECT 
  TO anon 
  USING (true);

-- ====================================================
-- SECURITY DEFINER RPC Functions
-- ====================================================

-- 1. Atomic Wallet Debit (Guards against client-side math and overdrafts)
CREATE OR REPLACE FUNCTION public.debit_wallet(
  p_phone text,
  p_amount numeric,
  p_description text DEFAULT 'Service Booking Payment'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone text;
  v_current numeric;
  v_remaining numeric;
BEGIN
  v_phone := trim(p_phone);
  IF v_phone IS NULL OR length(v_phone) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid phone number');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Debit amount must be greater than zero');
  END IF;

  SELECT wallet_balance INTO v_current FROM public.users WHERE phone = v_phone FOR UPDATE;
  
  IF v_current IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_current < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient wallet balance', 'current', v_current);
  END IF;

  v_remaining := v_current - p_amount;
  UPDATE public.users SET wallet_balance = v_remaining WHERE phone = v_phone;

  INSERT INTO public.wallet_transactions (user_phone, amount, type, description)
  VALUES (v_phone, p_amount, 'debit', p_description);

  RETURN json_build_object('success', true, 'remaining', v_remaining);
END;
$$;

-- 2. Atomic Wallet Credit & Top-up with Ledger Entry
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_phone text,
  p_amount numeric,
  p_bonus numeric DEFAULT 0,
  p_description text DEFAULT 'Wallet Top-up'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone text;
  v_total_credit numeric;
  v_new_balance numeric;
BEGIN
  v_phone := trim(p_phone);
  IF v_phone IS NULL OR length(v_phone) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid phone number');
  END IF;

  v_total_credit := p_amount + COALESCE(p_bonus, 0);
  IF v_total_credit <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Credit amount must be greater than zero');
  END IF;

  UPDATE public.users 
  SET wallet_balance = COALESCE(wallet_balance, 0) + v_total_credit 
  WHERE phone = v_phone
  RETURNING wallet_balance INTO v_new_balance;

  INSERT INTO public.wallet_transactions (user_phone, amount, type, description)
  VALUES (v_phone, v_total_credit, 'credit', p_description);

  RETURN json_build_object('success', true, 'balance', v_new_balance);
END;
$$;

-- 3. Server-Side Account Deletion
CREATE OR REPLACE FUNCTION public.delete_user_account(p_phone text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone text;
  v_deleted int := 0;
BEGIN
  v_phone := trim(p_phone);
  IF v_phone IS NULL OR length(v_phone) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid phone number');
  END IF;

  DELETE FROM public.addresses WHERE user_phone = v_phone;
  DELETE FROM public.bookings WHERE user_phone = v_phone;
  DELETE FROM public.wallet_transactions WHERE user_phone = v_phone;
  DELETE FROM public.users WHERE phone = v_phone;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN json_build_object('success', true, 'deleted_rows', v_deleted);
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.debit_wallet(text, numeric, text) TO anon;
GRANT EXECUTE ON FUNCTION public.credit_wallet(text, numeric, numeric, text) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account(text) TO anon;


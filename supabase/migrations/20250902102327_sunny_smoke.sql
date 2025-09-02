/*
  # Create bank_accounts table

  1. New Tables
    - `bank_accounts`
      - `id` (uuid, primary key)
      - `account_name` (text, required)
      - `account_number` (text, required, unique)
      - `bank_name` (text, required)
      - `account_type` (text, required)
      - `balance` (numeric, default 0.00)
      - `currency` (text, default 'USD')
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `bank_accounts` table
    - Add policy for authenticated users to read all bank accounts
    - Add policy for admin users to manage all bank accounts

  3. Indexes
    - Index on account_number for fast lookups
    - Index on is_active for filtering active accounts
*/

CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name text NOT NULL,
  account_number text UNIQUE NOT NULL,
  bank_name text NOT NULL,
  account_type text NOT NULL,
  balance numeric(15,2) DEFAULT 0.00,
  currency text DEFAULT 'USD',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read bank accounts"
  ON bank_accounts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage bank accounts"
  ON bank_accounts
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_account_number 
  ON bank_accounts (account_number);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_active 
  ON bank_accounts (is_active) 
  WHERE is_active = true;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_bank_accounts_updated_at'
  ) THEN
    CREATE TRIGGER update_bank_accounts_updated_at
      BEFORE UPDATE ON bank_accounts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
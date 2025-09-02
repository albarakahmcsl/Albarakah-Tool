/*
  # Create bank_accounts table

  1. New Tables
    - `bank_accounts`
      - `id` (uuid, primary key)
      - `name` (text, not null) - Name of the bank account
      - `account_number` (text, not null) - Bank account number
      - `description` (text, nullable) - Optional description
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `bank_accounts` table
    - Add policy for authenticated users to read bank accounts
    - Add policy for admin users to manage bank accounts

  3. Indexes
    - Add index on account_number for faster lookups
    - Add trigger for automatic updated_at timestamp
*/

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  account_number text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index for faster account number lookups
CREATE INDEX IF NOT EXISTS idx_bank_accounts_account_number ON bank_accounts(account_number);

-- Enable Row Level Security
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read bank accounts"
  ON bank_accounts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage bank accounts"
  ON bank_accounts
  FOR ALL
  TO authenticated
  USING (is_admin(uid()))
  WITH CHECK (is_admin(uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
/*
  # Create missing tables for membership system

  1. New Tables
    - `members`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable, foreign key to auth.users)
      - `full_name` (text, required)
      - `contact_email` (text, required, unique)
      - `phone_number` (text, nullable)
      - `address` (text, nullable)
      - `status` (text, default 'active')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `account_types`
      - `id` (uuid, primary key)
      - `name` (text, required, unique)
      - `description` (text, nullable)
      - `min_balance` (numeric, default 0)
      - `profit_rate` (numeric, default 0)
      - `withdrawal_rules` (jsonb, default {})
      - `processing_fee` (numeric, default 0)
      - `bank_account_id` (uuid, foreign key to bank_accounts)
      - `created_at` (timestamp)
    
    - `accounts`
      - `id` (uuid, primary key)
      - `member_id` (uuid, foreign key to members)
      - `account_type_id` (uuid, foreign key to account_types)
      - `account_number` (text, required, unique)
      - `balance` (numeric, default 0)
      - `open_date` (date, default today)
      - `status` (text, default 'open')
      - `processing_fee_paid` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read data
    - Add policies for admin users to manage data

  3. Triggers
    - Add updated_at triggers for tables that need them
*/

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  contact_email text UNIQUE NOT NULL,
  phone_number text,
  address text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create account_types table
CREATE TABLE IF NOT EXISTS account_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  min_balance numeric(15,2) DEFAULT 0.00,
  profit_rate numeric(5,2) DEFAULT 0.00,
  withdrawal_rules jsonb DEFAULT '{}',
  processing_fee numeric(15,2) DEFAULT 0.00,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  account_type_id uuid REFERENCES account_types(id) ON DELETE RESTRICT,
  account_number text UNIQUE NOT NULL,
  balance numeric(15,2) DEFAULT 0.00,
  open_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'open',
  processing_fee_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_contact_email ON members(contact_email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_account_types_name ON account_types(name);
CREATE INDEX IF NOT EXISTS idx_account_types_bank_account_id ON account_types(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_member_id ON accounts(member_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_type_id ON accounts(account_type_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);

-- RLS Policies for members
CREATE POLICY "Authenticated users can read members"
  ON members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage members"
  ON members
  FOR ALL
  TO authenticated
  USING (is_admin(uid()))
  WITH CHECK (is_admin(uid()));

-- RLS Policies for account_types
CREATE POLICY "Authenticated users can read account types"
  ON account_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage account types"
  ON account_types
  FOR ALL
  TO authenticated
  USING (is_admin(uid()))
  WITH CHECK (is_admin(uid()));

-- RLS Policies for accounts
CREATE POLICY "Authenticated users can read accounts"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage accounts"
  ON accounts
  FOR ALL
  TO authenticated
  USING (is_admin(uid()))
  WITH CHECK (is_admin(uid()));

-- Add updated_at triggers
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
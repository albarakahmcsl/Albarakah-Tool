/*
  # Create Members System Tables

  1. New Tables
    - `members`
      - `id` (uuid, primary key)
      - `full_name` (text, required)
      - `contact_email` (text, unique, required)
      - `phone_number` (text, optional)
      - `address` (text, optional)
      - `user_id` (uuid, optional foreign key to auth.users)
      - `status` (text, default 'active')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `account_types`
      - `id` (uuid, primary key)
      - `name` (text, unique, required)
      - `description` (text, optional)
      - `interest_rate` (numeric, default 0.00)
      - `minimum_balance` (numeric, default 0.00)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `accounts`
      - `id` (uuid, primary key)
      - `account_number` (text, unique, required)
      - `member_id` (uuid, foreign key to members)
      - `account_type_id` (uuid, foreign key to account_types)
      - `bank_account_id` (uuid, foreign key to bank_accounts)
      - `balance` (numeric, default 0.00)
      - `status` (text, default 'active')
      - `opened_date` (date, default today)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read data
    - Add policies for admin users to manage all data

  3. Indexes
    - Add performance indexes on frequently queried columns
    - Add unique constraints where needed

  4. Triggers
    - Add auto-updating timestamp triggers for all tables
*/

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  contact_email text UNIQUE NOT NULL,
  phone_number text,
  address text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create account_types table
CREATE TABLE IF NOT EXISTS account_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  interest_rate numeric(5,4) DEFAULT 0.0000,
  minimum_balance numeric(15,2) DEFAULT 0.00,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number text UNIQUE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  account_type_id uuid REFERENCES account_types(id) ON DELETE RESTRICT,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE RESTRICT,
  balance numeric(15,2) DEFAULT 0.00,
  status text DEFAULT 'active',
  opened_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_contact_email ON members(contact_email);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_account_types_name ON account_types(name);
CREATE INDEX IF NOT EXISTS idx_account_types_is_active ON account_types(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_member_id ON accounts(member_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_type_id ON accounts(account_type_id);
CREATE INDEX IF NOT EXISTS idx_accounts_bank_account_id ON accounts(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status) WHERE status = 'active';

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for members
CREATE POLICY "Authenticated users can read members"
  ON members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage members"
  ON members
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create RLS policies for account_types
CREATE POLICY "Authenticated users can read account types"
  ON account_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage account types"
  ON account_types
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create RLS policies for accounts
CREATE POLICY "Authenticated users can read accounts"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage accounts"
  ON accounts
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_types_updated_at
  BEFORE UPDATE ON account_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
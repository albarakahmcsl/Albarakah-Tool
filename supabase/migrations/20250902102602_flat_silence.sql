/*
  # Fix bank_accounts table schema

  1. Schema Updates
    - Rename `name` column to `account_name` to match existing schema
    - Update column structure to match the database schema
  
  2. Security
    - Maintain existing RLS policies
    - Keep existing indexes and constraints
*/

-- First, check if the table exists and has the wrong column name
DO $$
BEGIN
  -- If the table exists with 'name' column, rename it to 'account_name'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_accounts' AND column_name = 'name'
  ) THEN
    ALTER TABLE bank_accounts RENAME COLUMN name TO account_name;
  END IF;
  
  -- If the table doesn't exist at all, create it with the correct schema
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'bank_accounts' AND table_schema = 'public'
  ) THEN
    CREATE TABLE bank_accounts (
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

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_bank_accounts_account_number ON bank_accounts(account_number);
    CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_active ON bank_accounts(is_active) WHERE is_active = true;

    -- Enable RLS
    ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Admin users can manage bank accounts"
      ON bank_accounts
      FOR ALL
      TO authenticated
      USING (is_admin(uid()))
      WITH CHECK (is_admin(uid()));

    CREATE POLICY "Authenticated users can read bank accounts"
      ON bank_accounts
      FOR SELECT
      TO authenticated
      USING (true);

    -- Create trigger for updated_at
    CREATE TRIGGER update_bank_accounts_updated_at
      BEFORE UPDATE ON bank_accounts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
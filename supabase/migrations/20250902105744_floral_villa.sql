/*
  # Insert Dummy Data for Islamic Finance System

  1. Bank Accounts
    - Al Baraka Main Account (checking account)
    - Islamic Investment Fund (investment account)

  2. Account Types
    - Hajj Savings Account (linked to Al Baraka Main)
    - General Savings Account (linked to Al Baraka Main)
    - Investment Account (linked to Islamic Investment Fund)

  3. Members
    - Ahmed Hassan (active member)
    - Fatima Al-Zahra (active member)
    - Omar Khalid (pending member)

  4. Accounts
    - Ahmed's Hajj Savings Account
    - Fatima's General Savings Account
    - Omar's Investment Account
*/

-- Insert Bank Accounts
INSERT INTO bank_accounts (id, account_name, account_number, bank_name, account_type, balance, currency, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Al Baraka Main Account', 'ALB-001-2024', 'Al Baraka Bank', 'checking', 250000.00, 'USD', true),
('550e8400-e29b-41d4-a716-446655440002', 'Islamic Investment Fund', 'IIF-002-2024', 'Dubai Islamic Bank', 'investment', 500000.00, 'USD', true);

-- Insert Account Types
INSERT INTO account_types (id, name, description, interest_rate, minimum_balance, is_active, bank_account_id) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Hajj Savings Account', 'Special savings account for Hajj pilgrimage with competitive profit sharing', 0.0350, 1000.00, true, '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440002', 'General Savings Account', 'Standard Islamic savings account with monthly profit distribution', 0.0250, 500.00, true, '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440003', 'Investment Account', 'High-yield Islamic investment account for long-term growth', 0.0450, 5000.00, true, '550e8400-e29b-41d4-a716-446655440002');

-- Insert Members
INSERT INTO members (id, full_name, contact_email, phone_number, address, status) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Ahmed Hassan', 'ahmed.hassan@example.com', '+1-555-0101', '123 Islamic Center Dr, Dearborn, MI 48124', 'active'),
('770e8400-e29b-41d4-a716-446655440002', 'Fatima Al-Zahra', 'fatima.alzahra@example.com', '+1-555-0102', '456 Crescent Moon Ave, Sterling, VA 20164', 'active'),
('770e8400-e29b-41d4-a716-446655440003', 'Omar Khalid', 'omar.khalid@example.com', '+1-555-0103', '789 Masjid Way, Fremont, CA 94536', 'pending');

-- Insert Accounts
INSERT INTO accounts (id, account_number, member_id, account_type_id, bank_account_id, balance, status, opened_date) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'HAJ-2024-001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 15000.00, 'active', '2024-01-15'),
('880e8400-e29b-41d4-a716-446655440002', 'SAV-2024-001', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 7500.00, 'active', '2024-02-01'),
('880e8400-e29b-41d4-a716-446655440003', 'INV-2024-001', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 25000.00, 'active', '2024-02-15');
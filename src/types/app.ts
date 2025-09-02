// src/types/app.ts
export interface User {
  id: string
  email: string
  full_name: string
  role_ids?: string[]
  menu_access: string[]
  sub_menu_access: Record<string, string[]>
  component_access: string[]
  is_active: boolean
  created_at: string
  needs_password_reset?: boolean
  roles?: Role[]
  permissions?: Permission[]
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  role_ids: string[]
  menu_access?: string[]
  sub_menu_access?: Record<string, string[]>
  component_access?: string[]
}

export interface UpdateUserData {
  full_name: string
  role_ids: string[]
  menu_access: string[]
  sub_menu_access: Record<string, string[]>
  component_access: string[]
  is_active: boolean
  needs_password_reset?: boolean
}

export interface Role {
  id: string
  name: string
  description: string
  created_at: string
  permissions?: Permission[]
}

export interface Permission {
  id: string
  resource: string
  action: string
  description: string
  created_at: string
}

export interface PasswordValidationResult {
  isValid: boolean
  message: string
  errors: string[]
}

export interface CreateRoleData {
  name: string
  description?: string
  permission_ids?: string[]
}

export interface UpdateRoleData {
  name: string
  description?: string
  permission_ids?: string[]
}

export interface CreatePermissionData {
  resource: string
  action: string
  description?: string
}

export interface UpdatePermissionData {
  resource: string
  action: string
  description?: string
}

// New types for membership system
export interface BankAccount {
  id: string
  name: string
  account_number: string
  description: string | null
  created_at: string
}

export interface AccountType {
  id: string
  name: string
  description: string | null
  min_balance: number
  profit_rate: number
  withdrawal_rules: Record<string, any> // Adjust as needed for specific rules structure
  processing_fee: number
  bank_account_id: string
  bank_accounts?: BankAccount // Joined data
  created_at: string
}

export interface Member {
  id: string
  user_id: string | null
  full_name: string
  contact_email: string
  phone_number: string | null
  address: string | null
  status: string
  created_at: string
  updated_at: string
  accounts?: Account[] // Joined data
}

export interface Account {
  id: string
  member_id: string
  account_type_id: string
  bank_account_id: string | null
  account_number: string
  balance: number
  open_date: string
  status: string
  processing_fee_paid: boolean
  created_at: string
  updated_at: string
  members?: Member // Joined data
  account_types?: AccountType // Joined data
  bank_accounts?: BankAccount // Joined data
}

// Data transfer objects for creating/updating new entities
export interface CreateBankAccountData {
  name: string
  account_number: string
  description?: string
}

export interface UpdateBankAccountData {
  name?: string
  account_number?: string
  description?: string
}

export interface CreateAccountTypeData {
  name: string
  description?: string
  min_balance?: number
  profit_rate?: number
  withdrawal_rules?: Record<string, any>
  processing_fee?: number
  bank_account_id: string
}

export interface UpdateAccountTypeData {
  name?: string
  description?: string
  min_balance?: number
  profit_rate?: number
  withdrawal_rules?: Record<string, any>
  processing_fee?: number
  bank_account_id?: string
}

export interface CreateMemberData {
  user_id?: string | null
  full_name: string
  contact_email: string
  phone_number?: string
  address?: string
  status?: string
}

export interface UpdateMemberData {
  user_id?: string | null
  full_name?: string
  contact_email?: string
  phone_number?: string
  address?: string
  status?: string
}

export interface CreateAccountData {
  member_id: string
  account_type_id: string
  bank_account_id?: string
  account_number: string
  balance?: number
  open_date?: string
  status?: string
}

export interface UpdateAccountData {
  member_id?: string
  account_type_id?: string
  bank_account_id?: string
  account_number?: string
  balance?: number
  open_date?: string
  status?: string
  processing_fee_paid?: boolean
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          menu_access: string[]
          sub_menu_access: Record<string, string[]>
          component_access: string[]
          is_active: boolean
          needs_password_reset: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string
          menu_access?: string[]
          sub_menu_access?: Record<string, string[]>
          component_access?: string[]
          is_active?: boolean
          needs_password_reset?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          menu_access?: string[]
          sub_menu_access?: Record<string, string[]>
          component_access?: string[]
          is_active?: boolean
          needs_password_reset?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          resource: string
          action: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          resource: string
          action: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          resource?: string
          action?: string
          description?: string | null
          created_at?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          permission_id: string
          created_at: string
        }
        Insert: {
          id?: string
          role_id: string
          permission_id: string
          created_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          permission_id?: string
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          created_at?: string
        }
      }
      bank_accounts: { // New table
        Row: {
          id: string
          name: string
          account_number: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          account_number: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          account_number?: string
          description?: string | null
          created_at?: string
        }
      }
      account_types: { // New table
        Row: {
          id: string
          name: string
          description: string | null
          min_balance: number
          profit_rate: number
          withdrawal_rules: Json
          processing_fee: number
          bank_account_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          min_balance?: number
          profit_rate?: number
          withdrawal_rules?: Json
          processing_fee?: number
          bank_account_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          min_balance?: number
          profit_rate?: number
          withdrawal_rules?: Json
          processing_fee?: number
          bank_account_id?: string
          created_at?: string
        }
      }
      members: { // New table
        Row: {
          id: string
          user_id: string | null
          full_name: string
          contact_email: string
          phone_number: string | null
          address: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          contact_email: string
          phone_number?: string | null
          address?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          contact_email?: string
          phone_number?: string | null
          address?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      accounts: { // New table
        Row: {
          id: string
          member_id: string
          account_type_id: string
          account_number: string
          balance: number
          open_date: string
          status: string
          processing_fee_paid: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          account_type_id: string
          account_number: string
          balance?: number
          open_date?: string
          status?: string
          processing_fee_paid?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          account_type_id?: string
          account_number?: string
          balance?: number
          open_date?: string
          status?: string
          processing_fee_paid?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

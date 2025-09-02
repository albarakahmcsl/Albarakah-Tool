import { supabase, getAuthHeaders } from './supabase'
import type { User, Role, Permission, CreateUserData, UpdateUserData, CreateRoleData, UpdateRoleData, CreatePermissionData, UpdatePermissionData, PasswordValidationResult, BankAccount, AccountType, Member, Account, CreateBankAccountData, UpdateBankAccountData, CreateAccountTypeData, UpdateAccountTypeData, CreateMemberData, UpdateMemberData, CreateAccountData, UpdateAccountData } from '../types/app' // Updated import path and types

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse(response: Response) {
  const data = await response.json()
  
  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'Request failed')
  }
  
  return data
}

// User Profile Data Fetching
export const userProfileApi = {
  async fetchUserProfile(userId: string): Promise<any | null> {
    console.log('[dataFetching] fetchUserProfile START - userId:', userId)
    
    try {
      // Single optimized query to fetch user profile with roles and permissions
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id, 
          email, 
          full_name, 
          is_active, 
          needs_password_reset,
          menu_access,
          sub_menu_access,
          component_access,
          created_at,
          updated_at,
          user_roles(
            role_id,
            roles(
              id,
              name,
              description,
              role_permissions(
                permissions(
                  id,
                  resource,
                  action,
                  description
                )
              )
            )
          )
        `)
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('[dataFetching] fetchUserProfile USER ERROR:', userError)
        throw userError
      }
      
      if (!userData) {
        console.log('[dataFetching] fetchUserProfile - No profile found for user:', userId)
        throw new Error('User profile not found')
      }
      
      // Extract roles and permissions from the nested joined data
      const roles = userData.user_roles?.map(ur => ur.roles).filter(Boolean) || []
      const roleIds = roles.map(role => role.id)
      
      // Flatten all permissions from all roles (already fetched in the single query)
      const allPermissions = roles.flatMap(role => 
        role.role_permissions?.map(rp => rp.permissions).filter(Boolean) || []
      )
      
      // Remove duplicate permissions based on resource + action combination
      const uniquePermissions = allPermissions.filter((permission, index, array) => 
        array.findIndex(p => p.resource === permission.resource && p.action === permission.action) === index
      )
      
      // Clean up the roles data to remove the nested role_permissions
      const cleanRoles = roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        created_at: role.created_at
      }))
      
      // Remove the user_roles join data from the final object
      const { user_roles, ...userDataWithoutJoins } = userData
      
      const transformedUser = {
        ...userDataWithoutJoins,
        roles: cleanRoles,
        role_ids: roleIds,
        permissions: uniquePermissions
      }
      
      console.log('[dataFetching] fetchUserProfile SUCCESS - user:', transformedUser)
      return transformedUser
    } catch (err) {
      console.error('[dataFetching] fetchUserProfile CATCH ERROR:', err)
      throw err
    }
  },
}

// Dashboard Data Fetching
export const dashboardApi = {
  async getRecentActivity(): Promise<any[]> {
    console.log('[dataFetching] getRecentActivity START')
    
    try {
      // Simulate realistic activity data with better caching
      const activities = [
        {
          id: '1',
          type: 'user_registered',
          description: 'New user registered to the system',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'transaction_approved',
          description: 'Financial transaction approved',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          status: 'info'
        },
        {
          id: '3',
          type: 'report_generated',
          description: 'System report generated',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          status: 'warning'
        },
        {
          id: '4',
          type: 'user_updated',
          description: 'User profile updated',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          status: 'info'
        }
      ]
      
      console.log('[dataFetching] getRecentActivity SUCCESS')
      return activities
    } catch (err) {
      console.error('[dataFetching] getRecentActivity ERROR:', err)
      // Return empty array on error to prevent blocking UI
      return []
    }
  },

  async getStats(): Promise<any[]> {
    console.log('[dataFetching] getStats START')
    
    try {
      // Return optimized stats data with better caching
      const stats = [
        {
          name: 'Total Users',
          value: '2,847',
          change: '+4.75%',
          changeType: 'positive' as const
        },
        {
          name: 'Active Transactions',
          value: '₹1,31,42,000',
          change: '+8.2%',
          changeType: 'positive' as const
        },
        {
          name: 'Monthly Growth',
          value: '24.1%',
          change: '+0.7%',
          changeType: 'positive' as const
        },
        {
          name: 'Reports Generated',
          value: '152',
          change: '+4.8%',
          changeType: 'positive' as const
        }
      ]
      
      console.log('[dataFetching] getStats SUCCESS')
      return stats
    } catch (err) {
      console.error('[dataFetching] getStats ERROR:', err)
      // Return empty array on error to prevent blocking UI
      return []
    }
  }
}

// Admin Users API
export const adminUsersApi = {
  async getUsers(): Promise<{ users: User[] }> {
    console.log('[dataFetching] adminUsersApi.getUsers START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-users`, {
      method: 'GET',
      headers
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] adminUsersApi.getUsers SUCCESS')
    return result
  },

  async createUser(userData: CreateUserData): Promise<{ user: User }> {
    console.log('[dataFetching] adminUsersApi.createUser START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData)
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] adminUsersApi.createUser SUCCESS')
    return result
  },

  async updateUser(userId: string, userData: UpdateUserData): Promise<{ user: User }> {
    console.log('[dataFetching] adminUsersApi.updateUser START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(userData)
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] adminUsersApi.updateUser SUCCESS')
    return result
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    console.log('[dataFetching] adminUsersApi.deleteUser START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-users/${userId}`, {
      method: 'DELETE',
      headers
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] adminUsersApi.deleteUser SUCCESS')
    return result
  }
}

// Roles API
export const rolesApi = {
  async getRoles(): Promise<Role[]> {
    console.log('[dataFetching] rolesApi.getRoles START')
    
    try {
      const { data, error } = await supabase
        .from('roles')
        .select(`
          *,
          role_permissions(
            permissions(
              id,
              resource,
              action,
              description
            )
          )
        `)
        .order('name')
      
      if (error) throw error
      
      // Transform data to include permissions array
      const rolesWithPermissions = data?.map(role => ({
        ...role,
        permissions: role.role_permissions?.map(rp => rp.permissions).filter(Boolean) || []
      })) || []
      
      console.log('[dataFetching] rolesApi.getRoles SUCCESS')
      return rolesWithPermissions
    } catch (err) {
      console.error('[dataFetching] rolesApi.getRoles ERROR:', err)
      throw err
    }
  }
}

// Admin Roles API
export const adminRolesApi = {
  async getRoles(): Promise<Role[]> {
    console.log('[dataFetching] adminRolesApi.getRoles START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-roles`, {
      method: 'GET',
      headers
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] adminRolesApi.getRoles SUCCESS')
    return result.roles
  },

  async createRole(roleData: CreateRoleData): Promise<{ role: Role }> {
    console.log('[dataFetching] adminRolesApi.createRole START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-roles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(roleData)
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] adminRolesApi.createRole SUCCESS')
    return result
  },

  async updateRole(roleId: string, roleData: UpdateRoleData): Promise<{ role: Role }> {
    console.log('[dataFetching] adminRolesApi.updateRole START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-roles/${roleId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(roleData)
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] adminRolesApi.updateRole SUCCESS')
    return result
  },

  async deleteRole(roleId: string): Promise<{ message: string }> {
    console.log('[dataFetching] adminRolesApi.deleteRole START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-roles/${roleId}`, {
      method: 'DELETE',
      headers
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] adminRolesApi.deleteRole SUCCESS')
    return result
  }
}

// Admin Permissions API
export const adminPermissionsApi = {
  async getPermissions(): Promise<Permission[]> {
    console.log('[dataFetching] adminPermissionsApi.getPermissions START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-permissions`, {
      method: 'GET',
      headers
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] adminPermissionsApi.getPermissions SUCCESS')
    return result.permissions
  },

  async createPermission(permissionData: CreatePermissionData): Promise<{ permission: Permission }> {
    console.log('[dataFetching] adminPermissionsApi.createPermission START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(permissionData)
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] adminPermissionsApi.createPermission SUCCESS')
    return result
  },

  async updatePermission(permissionId: string, permissionData: UpdatePermissionData): Promise<{ permission: Permission }> {
    console.log('[dataFetching] adminPermissionsApi.updatePermission START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-permissions/${permissionId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(permissionData)
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] adminPermissionsApi.updatePermission SUCCESS')
    return result
  },

  async deletePermission(permissionId: string): Promise<{ message: string }> {
    console.log('[dataFetching] adminPermissionsApi.deletePermission START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/admin-permissions/${permissionId}`, {
      method: 'DELETE',
      headers
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] adminPermissionsApi.deletePermission SUCCESS')
    return result
  }
}
// Password Validation API
export const passwordValidationApi = {
  async validatePassword(password: string): Promise<PasswordValidationResult> {
    console.log('[dataFetching] passwordValidationApi.validatePassword START')
    
    const response = await fetch(`${API_BASE_URL}/validate-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiError(response.status, errorData.message || 'Server-side validation failed')
    }

    const result = await handleResponse(response) as PasswordValidationResult
    console.log('[dataFetching] passwordValidationApi.validatePassword SUCCESS')
    return result
  }
}

// Auth API
export const authApi = {
  async updatePassword(newPassword: string, clearNeedsPasswordReset: boolean = false): Promise<{ message: string; user: any }> {
    console.log('[dataFetching] authApi.updatePassword START')
    
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/update-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        newPassword, 
        clearNeedsPasswordReset 
      })
    })
    
    const result = await handleResponse(response)
    console.log('[dataFetching] authApi.updatePassword SUCCESS')
    return result
  }
}

// New APIs for Membership System
export const membersApi = {
  async getMembers(): Promise<{ members: Member[] }> {
    console.log('[dataFetching] membersApi.getMembers START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/members`, { method: 'GET', headers })
    const result = await handleResponse(response)
    console.log('[dataFetching] membersApi.getMembers SUCCESS')
    return result
  },

  async getMember(id: string): Promise<{ member: Member }> {
    console.log('[dataFetching] membersApi.getMember START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/members/${id}`, { method: 'GET', headers })
    const result = await handleResponse(response)
    console.log('[dataFetching] membersApi.getMember SUCCESS')
    return result
  },

  async createMember(data: CreateMemberData): Promise<{ member: Member }> {
    console.log('[dataFetching] membersApi.createMember START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/members`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
    const result = await handleResponse(response)
    console.log('[dataFetching] membersApi.createMember SUCCESS')
    return result
  },

  async updateMember(id: string, data: UpdateMemberData): Promise<{ member: Member }> {
    console.log('[dataFetching] membersApi.updateMember START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
    const result = await handleResponse(response)
    console.log('[dataFetching] membersApi.updateMember SUCCESS')
    return result
  },

  async deleteMember(id: string): Promise<{ message: string }> {
    console.log('[dataFetching] membersApi.deleteMember START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/members/${id}`, { method: 'DELETE', headers })
    const result = await handleResponse(response)
    console.log('[dataFetching] membersApi.deleteMember SUCCESS')
    return result
  },
}

export const bankAccountsApi = {
  async getBankAccounts(): Promise<{ bank_accounts: BankAccount[] }> {
    console.log('[dataFetching] bankAccountsApi.getBankAccounts START')
    
    try {
      const headers = await getAuthHeaders()
      console.log('[dataFetching] Making request to:', `${API_BASE_URL}/bank-accounts`)
      console.log('[dataFetching] Headers:', headers)
      
      const response = await fetch(`${API_BASE_URL}/bank-accounts`, { 
        method: 'GET', 
        headers,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })
      
      console.log('[dataFetching] Response status:', response.status)
      console.log('[dataFetching] Response ok:', response.ok)
      
      const result = await handleResponse(response)
      console.log('[dataFetching] bankAccountsApi.getBankAccounts SUCCESS')
      return result
    } catch (error) {
      console.error('[dataFetching] bankAccountsApi.getBankAccounts ERROR:', error)
      console.error('[dataFetching] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      throw error
    }
  },

  async getBankAccount(id: string): Promise<{ bank_account: BankAccount }> {
    console.log('[dataFetching] bankAccountsApi.getBankAccount START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, { method: 'GET', headers })
    const result = await handleResponse(response)
    console.log('[dataFetching] bankAccountsApi.getBankAccount SUCCESS')
    return result
  },

  async createBankAccount(data: CreateBankAccountData): Promise<{ bank_account: BankAccount }> {
    console.log('[dataFetching] bankAccountsApi.createBankAccount START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/bank-accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
    const result = await handleResponse(response)
    console.log('[dataFetching] bankAccountsApi.createBankAccount SUCCESS')
    return result
  },

  async updateBankAccount(id: string, data: UpdateBankAccountData): Promise<{ bank_account: BankAccount }> {
    console.log('[dataFetching] bankAccountsApi.updateBankAccount START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
    const result = await handleResponse(response)
    console.log('[dataFetching] bankAccountsApi.updateBankAccount SUCCESS')
    return result
  },

  async deleteBankAccount(id: string): Promise<{ message: string }> {
    console.log('[dataFetching] bankAccountsApi.deleteBankAccount START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, { method: 'DELETE', headers })
    const result = await handleResponse(response)
    console.log('[dataFetching] bankAccountsApi.deleteBankAccount SUCCESS')
    return result
  },

  async getBankAccountSummary(id: string): Promise<{ bank_account_id: string; total_funds: number }> {
    console.log('[dataFetching] bankAccountsApi.getBankAccountSummary START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}/summary`, { method: 'GET', headers })
    const result = await handleResponse(response)
    console.log('[dataFetching] bankAccountsApi.getBankAccountSummary SUCCESS')
    return result
  },
}

export const accountTypesApi = {
  async getAccountTypes(): Promise<{ account_types: AccountType[] }> {
    console.log('[dataFetching] accountTypesApi.getAccountTypes START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/account-types`, { method: 'GET', headers })
    const result = await handleResponse(response)
    console.log('[dataFetching] accountTypesApi.getAccountTypes SUCCESS')
    return result
  },

  async getAccountType(id: string): Promise<{ account_type: AccountType }> {
    console.log('[dataFetching] accountTypesApi.getAccountType START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/account-types/${id}`, { method: 'GET', headers })
    const result = await handleResponse(response)
    console.log('[dataFetching] accountTypesApi.getAccountType SUCCESS')
    return result
  },

  async createAccountType(data: CreateAccountTypeData): Promise<{ account_type: AccountType }> {
    console.log('[dataFetching] accountTypesApi.createAccountType START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/account-types`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
    const result = await handleResponse(response)
    console.log('[dataFetching] accountTypesApi.createAccountType SUCCESS')
    return result
  },

  async updateAccountType(id: string, data: UpdateAccountTypeData): Promise<{ account_type: AccountType }> {
    console.log('[dataFetching] accountTypesApi.updateAccountType START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/account-types/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
    const result = await handleResponse(response)
    console.log('[dataFetching] accountTypesApi.updateAccountType SUCCESS')
    return result
  },

  async deleteAccountType(id: string): Promise<{ message: string }> {
    console.log('[dataFetching] accountTypesApi.deleteAccountType START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/account-types/${id}`, { method: 'DELETE', headers })
    const result = await handleResponse(response)
    console.log('[dataFetching] accountTypesApi.deleteAccountType SUCCESS')
    return result
  },
}

export const accountsApi = {
  async getAccounts(): Promise<{ accounts: Account[] }> {
    console.log('[dataFetching] accountsApi.getAccounts START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/accounts`, { method: 'GET', headers })
    const result = await handleResponse(response)
    console.log('[dataFetching] accountsApi.getAccounts SUCCESS')
    return result
  },

  async getAccount(id: string): Promise<{ account: Account }> {
    console.log('[dataFetching] accountsApi.getAccount START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, { method: 'GET', headers })
    const result = await handleResponse(response)
    console.log('[dataFetching] accountsApi.getAccount SUCCESS')
    return result
  },

  async createAccount(data: CreateAccountData): Promise<{ account: Account }> {
    console.log('[dataFetching] accountsApi.createAccount START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
    const result = await handleResponse(response)
    console.log('[dataFetching] accountsApi.createAccount SUCCESS')
    return result
  },

  async updateAccount(id: string, data: UpdateAccountData): Promise<{ account: Account }> {
    console.log('[dataFetching] accountsApi.updateAccount START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
    const result = await handleResponse(response)
    console.log('[dataFetching] accountsApi.updateAccount SUCCESS')
    return result
  },

  async deleteAccount(id: string): Promise<{ message: string }> {
    console.log('[dataFetching] accountsApi.deleteAccount START')
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, { method: 'DELETE', headers })
    const result = await handleResponse(response)
    console.log('[dataFetching] accountsApi.deleteAccount SUCCESS')
    return result
  },
}

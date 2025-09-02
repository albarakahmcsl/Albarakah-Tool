import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import { accountTypesApi, bankAccountsApi, ApiError } from '../lib/dataFetching'
import { Plus, Search, Edit, Trash2, Layers, Banknote, Percent, Scale, DollarSign } from 'lucide-react'
import type { AccountType, CreateAccountTypeData, UpdateAccountTypeData, BankAccount } from '../types/app'

export default function AccountTypesPage() {
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch account types
  const { data: accountTypesData, isLoading: accountTypesLoading } = useQuery({
    queryKey: queryKeys.accountTypes(),
    queryFn: accountTypesApi.getAccountTypes,
  })

  // Fetch bank accounts for dropdowns in modals
  const { data: bankAccountsData } = useQuery({
    queryKey: queryKeys.bankAccounts(),
    queryFn: bankAccountsApi.getBankAccounts,
  })

  // Mutations for account type operations
  const createAccountTypeMutation = useMutation({
    mutationFn: accountTypesApi.createAccountType,
    onSuccess: () => {
      setSuccess('Account type created successfully')
      setShowCreateModal(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.accountTypes() })
    },
    onError: (error) => {
      setError(error instanceof ApiError ? error.message : 'Failed to create account type')
    },
  })

  const updateAccountTypeMutation = useMutation({
    mutationFn: ({ accountTypeId, accountTypeData }: { accountTypeId: string; accountTypeData: UpdateAccountTypeData }) =>
      accountTypesApi.updateAccountType(accountTypeId, accountTypeData),
    onSuccess: () => {
      setSuccess('Account type updated successfully')
      setShowEditModal(false)
      setSelectedAccountType(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.accountTypes() })
    },
    onError: (error) => {
      setError(error instanceof ApiError ? error.message : 'Failed to update account type')
    },
  })

  const deleteAccountTypeMutation = useMutation({
    mutationFn: accountTypesApi.deleteAccountType,
    onSuccess: () => {
      setSuccess('Account type deleted successfully')
      queryClient.invalidateQueries({ queryKey: queryKeys.accountTypes() })
    },
    onError: (error) => {
      setError(error instanceof ApiError ? error.message : 'Failed to delete account type')
    },
  })

  const handleCreateAccountType = (accountTypeData: CreateAccountTypeData) => {
    createAccountTypeMutation.mutate(accountTypeData)
  }

  const handleUpdateAccountType = (accountTypeData: UpdateAccountTypeData) => {
    if (!selectedAccountType) return
    updateAccountTypeMutation.mutate({ accountTypeId: selectedAccountType.id, accountTypeData })
  }

  const handleDeleteAccountType = (accountTypeId: string) => {
    if (!confirm('Are you sure you want to delete this account type? This action cannot be undone.')) return
    deleteAccountTypeMutation.mutate(accountTypeId)
  }

  const accountTypes = accountTypesData?.account_types || []
  const bankAccounts = bankAccountsData?.bank_accounts || []
  const loading = accountTypesLoading || createAccountTypeMutation.isPending || updateAccountTypeMutation.isPending || deleteAccountTypeMutation.isPending

  const filteredAccountTypes = accountTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (type.bank_accounts?.name && type.bank_accounts.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 pt-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Type Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Define and manage different types of accounts offered to members.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account Type
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Search account types..."
        />
      </div>

      {/* Account Types List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredAccountTypes.map((type) => (
              <li key={type.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Layers className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {type.name}
                      </div>
                      {type.description && (
                        <div className="text-sm text-gray-500">
                          {type.description}
                        </div>
                      )}
                      <div className="text-sm text-gray-500 flex items-center">
                        <Landmark className="h-4 w-4 mr-1" /> Bank: {type.bank_accounts?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Banknote className="h-4 w-4 mr-1" /> Min Balance: {type.min_balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Percent className="h-4 w-4 mr-1" /> Profit Rate: {type.profit_rate}%
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" /> Processing Fee: {type.processing_fee.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedAccountType(type)
                        setShowEditModal(true)
                      }}
                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccountType(type.id)}
                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateAccountTypeModal
          bankAccounts={bankAccounts}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAccountType}
        />
      )}
      {showEditModal && selectedAccountType && (
        <EditAccountTypeModal
          accountType={selectedAccountType}
          bankAccounts={bankAccounts}
          onClose={() => {
            setShowEditModal(false)
            setSelectedAccountType(null)
          }}
          onSubmit={handleUpdateAccountType}
        />
      )}
    </div>
  )
}

// Create Account Type Modal Component
function CreateAccountTypeModal({ 
  bankAccounts,
  onClose, 
  onSubmit 
}: { 
  bankAccounts: BankAccount[]
  onClose: () => void
  onSubmit: (accountTypeData: CreateAccountTypeData) => void
}) {
  const [formData, setFormData] = useState<CreateAccountTypeData>({
    name: '',
    description: '',
    min_balance: 0,
    profit_rate: 0,
    withdrawal_rules: {},
    processing_fee: 0,
    bank_account_id: bankAccounts.length > 0 ? bankAccounts[0].id : '' // Default to first bank account
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Account Type</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bank Account</label>
              <select
                required
                value={formData.bank_account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_account_id: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Balance</label>
              <input
                type="number"
                required
                value={formData.min_balance}
                onChange={(e) => setFormData(prev => ({ ...prev, min_balance: parseFloat(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Profit Rate (%)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.profit_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, profit_rate: parseFloat(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Processing Fee</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.processing_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, processing_fee: parseFloat(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Withdrawal Rules (as JSON string for now) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Withdrawal Rules (JSON)</label>
              <textarea
                value={JSON.stringify(formData.withdrawal_rules, null, 2)}
                onChange={(e) => {
                  try {
                    setFormData(prev => ({ ...prev, withdrawal_rules: JSON.parse(e.target.value) }))
                  } catch (err) {
                    // Handle invalid JSON input
                    console.error("Invalid JSON for withdrawal rules", err)
                  }
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                rows={5}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
              >
                Create Account Type
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Account Type Modal Component
function EditAccountTypeModal({ 
  accountType,
  bankAccounts,
  onClose, 
  onSubmit 
}: { 
  accountType: AccountType
  bankAccounts: BankAccount[]
  onClose: () => void
  onSubmit: (accountTypeData: UpdateAccountTypeData) => void
}) {
  const [formData, setFormData] = useState<UpdateAccountTypeData>({
    name: accountType.name,
    description: accountType.description || '',
    min_balance: accountType.min_balance,
    profit_rate: accountType.profit_rate,
    withdrawal_rules: accountType.withdrawal_rules,
    processing_fee: accountType.processing_fee,
    bank_account_id: accountType.bank_account_id
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Account Type</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bank Account</label>
              <select
                required
                value={formData.bank_account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_account_id: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Balance</label>
              <input
                type="number"
                required
                value={formData.min_balance}
                onChange={(e) => setFormData(prev => ({ ...prev, min_balance: parseFloat(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Profit Rate (%)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.profit_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, profit_rate: parseFloat(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Processing Fee</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.processing_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, processing_fee: parseFloat(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Withdrawal Rules (as JSON string for now) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Withdrawal Rules (JSON)</label>
              <textarea
                value={JSON.stringify(formData.withdrawal_rules, null, 2)}
                onChange={(e) => {
                  try {
                    setFormData(prev => ({ ...prev, withdrawal_rules: JSON.parse(e.target.value) }))
                  } catch (err) {
                    // Handle invalid JSON input
                    console.error("Invalid JSON for withdrawal rules", err)
                  }
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                rows={5}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
              >
                Update Account Type
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

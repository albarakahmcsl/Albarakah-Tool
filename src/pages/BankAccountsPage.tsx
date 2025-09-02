import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import { bankAccountsApi, ApiError } from '../lib/dataFetching'
import { Plus, Search, Edit, Trash2, Banknote, Landmark, Wallet } from 'lucide-react'
import type { BankAccount, CreateBankAccountData, UpdateBankAccountData } from '../types/app'

export default function BankAccountsPage() {
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch bank accounts
  const { data: bankAccountsData, isLoading: bankAccountsLoading } = useQuery({
    queryKey: queryKeys.bankAccounts(),
    queryFn: bankAccountsApi.getBankAccounts,
  })

  // Mutations for bank account operations
  const createBankAccountMutation = useMutation({
    mutationFn: bankAccountsApi.createBankAccount,
    onSuccess: () => {
      setSuccess('Bank account created successfully')
      setShowCreateModal(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts() })
    },
    onError: (error) => {
      setError(error instanceof ApiError ? error.message : 'Failed to create bank account')
    },
  })

  const updateBankAccountMutation = useMutation({
    mutationFn: ({ bankAccountId, bankAccountData }: { bankAccountId: string; bankAccountData: UpdateBankAccountData }) =>
      bankAccountsApi.updateBankAccount(bankAccountId, bankAccountData),
    onSuccess: () => {
      setSuccess('Bank account updated successfully')
      setShowEditModal(false)
      setSelectedBankAccount(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts() })
      queryClient.invalidateQueries({ queryKey: queryKeys.accountTypes() }) // Invalidate account types as they link to bank accounts
    },
    onError: (error) => {
      setError(error instanceof ApiError ? error.message : 'Failed to update bank account')
    },
  })

  const deleteBankAccountMutation = useMutation({
    mutationFn: bankAccountsApi.deleteBankAccount,
    onSuccess: () => {
      setSuccess('Bank account deleted successfully')
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts() })
      queryClient.invalidateQueries({ queryKey: queryKeys.accountTypes() }) // Invalidate account types as they link to bank accounts
    },
    onError: (error) => {
      setError(error instanceof ApiError ? error.message : 'Failed to delete bank account')
    },
  })

  const handleCreateBankAccount = (bankAccountData: CreateBankAccountData) => {
    createBankAccountMutation.mutate(bankAccountData)
  }

  const handleUpdateBankAccount = (bankAccountData: UpdateBankAccountData) => {
    if (!selectedBankAccount) return
    updateBankAccountMutation.mutate({ bankAccountId: selectedBankAccount.id, bankAccountData })
  }

  const handleDeleteBankAccount = (bankAccountId: string) => {
    if (!confirm('Are you sure you want to delete this bank account? This action cannot be undone.')) return
    deleteBankAccountMutation.mutate(bankAccountId)
  }

  const bankAccounts = bankAccountsData?.bank_accounts || []
  const loading = bankAccountsLoading || createBankAccountMutation.isPending || updateBankAccountMutation.isPending || deleteBankAccountMutation.isPending

  const filteredBankAccounts = bankAccounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.description && account.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 pt-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Account Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage the bank accounts used for financial operations.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Bank Account
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
          placeholder="Search bank accounts..."
        />
      </div>

      {/* Bank Accounts List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredBankAccounts.map((account) => (
              <li key={account.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Landmark className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {account.name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Banknote className="h-4 w-4 mr-1" /> {account.account_number}
                      </div>
                      {account.description && (
                        <div className="text-sm text-gray-500">
                          {account.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedBankAccount(account)
                        setShowEditModal(true)
                      }}
                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBankAccount(account.id)}
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
        <CreateBankAccountModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBankAccount}
        />
      )}
      {showEditModal && selectedBankAccount && (
        <EditBankAccountModal
          bankAccount={selectedBankAccount}
          onClose={() => {
            setShowEditModal(false)
            setSelectedBankAccount(null)
          }}
          onSubmit={handleUpdateBankAccount}
        />
      )}
    </div>
  )
}

// Create Bank Account Modal Component
function CreateBankAccountModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void
  onSubmit: (bankAccountData: CreateBankAccountData) => void
}) {
  const [formData, setFormData] = useState<CreateBankAccountData>({
    name: '',
    account_number: '',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Bank Account</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Number</label>
              <input
                type="text"
                required
                value={formData.account_number}
                onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
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
                Create Bank Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Bank Account Modal Component
function EditBankAccountModal({ 
  bankAccount, 
  onClose, 
  onSubmit 
}: { 
  bankAccount: BankAccount
  onClose: () => void
  onSubmit: (bankAccountData: UpdateBankAccountData) => void
}) {
  const [formData, setFormData] = useState<UpdateBankAccountData>({
    name: bankAccount.name,
    account_number: bankAccount.account_number,
    description: bankAccount.description || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Bank Account</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Number</label>
              <input
                type="text"
                required
                value={formData.account_number}
                onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
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
                Update Bank Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import { accountsApi, membersApi, accountTypesApi, ApiError } from '../lib/dataFetching'
import { Plus, Search, Edit, Trash2, Wallet, User, Layers, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import type { Account, CreateAccountData, UpdateAccountData, Member, AccountType } from '../types/app'

export default function AccountsPage() {
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch accounts
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: queryKeys.accounts(),
    queryFn: accountsApi.getAccounts,
  })

  // Fetch members and account types for dropdowns in modals
  const { data: membersData } = useQuery({
    queryKey: queryKeys.members(),
    queryFn: membersApi.getMembers,
  })

  const { data: accountTypesData } = useQuery({
    queryKey: queryKeys.accountTypes(),
    queryFn: accountTypesApi.getAccountTypes,
  })

  // Mutations for account operations
  const createAccountMutation = useMutation({
    mutationFn: accountsApi.createAccount,
    onSuccess: () => {
      setSuccess('Account created successfully')
      setShowCreateModal(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts() })
    },
    onError: (error) => {
      setError(error instanceof ApiError ? error.message : 'Failed to create account')
    },
  })

  const updateAccountMutation = useMutation({
    mutationFn: ({ accountId, accountData }: { accountId: string; accountData: UpdateAccountData }) =>
      accountsApi.updateAccount(accountId, accountData),
    onSuccess: () => {
      setSuccess('Account updated successfully')
      setShowEditModal(false)
      setSelectedAccount(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts() })
    },
    onError: (error) => {
      setError(error instanceof ApiError ? error.message : 'Failed to update account')
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: accountsApi.deleteAccount,
    onSuccess: () => {
      setSuccess('Account deleted successfully')
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts() })
    },
    onError: (error) => {
      setError(error instanceof ApiError ? error.message : 'Failed to delete account')
    },
  })

  const handleCreateAccount = (accountData: CreateAccountData) => {
    createAccountMutation.mutate(accountData)
  }

  const handleUpdateAccount = (accountData: UpdateAccountData) => {
    if (!selectedAccount) return
    updateAccountMutation.mutate({ accountId: selectedAccount.id, accountData })
  }

  const handleDeleteAccount = (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) return
    deleteAccountMutation.mutate(accountId)
  }

  const accounts = accountsData?.accounts || []
  const members = membersData?.members || []
  const accountTypes = accountTypesData?.account_types || []
  const bankAccounts = loaderData.bankAccounts || []
  const loading = accountsLoading || createAccountMutation.isPending || updateAccountMutation.isPending || deleteAccountMutation.isPending

  const filteredAccounts = accounts.filter(account =>
    account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.members?.full_name && account.members.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (account.account_types?.name && account.account_types.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 pt-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage individual member accounts and their details.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account
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
          placeholder="Search accounts..."
        />
      </div>

      {/* Accounts List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredAccounts.map((account) => (
              <li key={account.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {account.account_number}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <User className="h-4 w-4 mr-1" /> Member: {account.members?.full_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Layers className="h-4 w-4 mr-1" /> Type: {account.account_types?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" /> Balance: {account.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" /> Open Date: {new Date(account.open_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Status: <span className="font-medium capitalize">{account.status}</span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        Processing Fee Paid: {account.processing_fee_paid ? <CheckCircle className="h-4 w-4 text-green-500 ml-1" /> : <XCircle className="h-4 w-4 text-red-500 ml-1" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedAccount(account)
                        setShowEditModal(true)
                      }}
                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
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
        <CreateAccountModal
          members={members}
          accountTypes={accountTypes}
          bankAccounts={bankAccounts}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAccount}
        />
      )}
      {showEditModal && selectedAccount && (
        <EditAccountModal
          account={selectedAccount}
          members={members}
          accountTypes={accountTypes}
          bankAccounts={bankAccounts}
          onClose={() => {
            setShowEditModal(false)
            setSelectedAccount(null)
          }}
          onSubmit={handleUpdateAccount}
        />
      )}
    </div>
  )
}

// Create Account Modal Component
function CreateAccountModal({ 
  members,
  accountTypes,
  bankAccounts,
  onClose, 
  onSubmit 
}: { 
  members: Member[]
  accountTypes: AccountType[]
  bankAccounts: BankAccount[]
  onClose: () => void
  onSubmit: (accountData: CreateAccountData) => void
}) {
  const [formData, setFormData] = useState<CreateAccountData>({
    member_id: members.length > 0 ? members[0].id : '',
    account_type_id: accountTypes.length > 0 ? accountTypes[0].id : '',
    bank_account_id: bankAccounts.length > 0 ? bankAccounts[0].id : '',
    account_number: '',
    balance: 0,
    open_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    status: 'open'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Account</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Member</label>
              <select
                required
                value={formData.member_id}
                onChange={(e) => setFormData(prev => ({ ...prev, member_id: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                {members.map(member => (
                  <option key={member.id} value={member.id}>{member.full_name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type</label>
              <select
                required
                value={formData.account_type_id}
                onChange={(e) => setFormData(prev => ({ ...prev, account_type_id: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                {accountTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
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
              <label className="block text-sm font-medium text-gray-700">Balance</label>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Open Date</label>
              <input
                type="date"
                value={formData.open_date}
                onChange={(e) => setFormData(prev => ({ ...prev, open_date: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="suspended">Suspended</option>
              </select>
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
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Account Modal Component
function EditAccountModal({ 
  account,
  members,
  accountTypes,
  onClose, 
  onSubmit 
}: { 
  account: Account
  members: Member[]
  accountTypes: AccountType[]
  onClose: () => void
  onSubmit: (accountData: UpdateAccountData) => void
}) {
  const [formData, setFormData] = useState<UpdateAccountData>({
    member_id: account.member_id,
    account_type_id: account.account_type_id,
    account_number: account.account_number,
    balance: account.balance,
    open_date: account.open_date.split('T')[0], // Format to YYYY-MM-DD for date input
    status: account.status,
    processing_fee_paid: account.processing_fee_paid
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Account</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Member</label>
              <select
                required
                value={formData.member_id}
                onChange={(e) => setFormData(prev => ({ ...prev, member_id: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                {members.map(member => (
                  <option key={member.id} value={member.id}>{member.full_name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type</label>
              <select
                required
                value={formData.account_type_id}
                onChange={(e) => setFormData(prev => ({ ...prev, account_type_id: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                {accountTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
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
              <label className="block text-sm font-medium text-gray-700">Balance</label>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Open Date</label>
              <input
                type="date"
                value={formData.open_date}
                onChange={(e) => setFormData(prev => ({ ...prev, open_date: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="processing_fee_paid"
                checked={formData.processing_fee_paid}
                onChange={(e) => setFormData(prev => ({ ...prev, processing_fee_paid: e.target.checked }))}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="processing_fee_paid" className="ml-2 text-sm text-gray-700">Processing Fee Paid</label>
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
                Update Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

import React, { Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { queryClient, queryKeys } from './lib/queryClient'
import { dashboardApi, adminUsersApi, rolesApi, adminRolesApi, adminPermissionsApi, membersApi, bankAccountsApi, accountTypesApi, accountsApi } from './lib/dataFetching' // Add new APIs
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginForm } from './components/LoginForm'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ForcePasswordChangePage } from './pages/ForcePasswordChangePage'

// Lazy load page components for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'))
const AdminRoles = React.lazy(() => import('./pages/AdminRoles'))
const AdminPermissions = React.lazy(() => import('./pages/AdminPermissions'))
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'))
const MembersPage = React.lazy(() => import('./pages/MembersPage'))
const BankAccountsPage = React.lazy(() => import('./pages/BankAccountsPage')) // New: Import BankAccountsPage
const AccountTypesPage = React.lazy(() => import('./pages/AccountTypesPage')) // New: Import AccountTypesPage
const AccountsPage = React.lazy(() => import('./pages/AccountsPage')) // New: Import AccountsPage

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
      <p className="text-gray-600 text-sm">Loading page...</p>
    </div>
  </div>
)

const AppLoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

// Route loaders for data prefetching
const dashboardLoader = async () => {
  console.log('[App] dashboardLoader START')
  
  try {
    // Prefetch dashboard data
    const [stats, activity] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: queryKeys.dashboardStats(),
        queryFn: dashboardApi.getStats,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.dashboardActivity(),
        queryFn: dashboardApi.getRecentActivity,
      }),
    ])
    
    console.log('[App] dashboardLoader SUCCESS')
    return { stats, activity }
  } catch (error) {
    console.error('[App] dashboardLoader ERROR:', error)
    // Return empty data on error - components will handle loading states
    return { stats: [], activity: [] }
  }
}

const adminUsersLoader = async () => {
  console.log('[App] adminUsersLoader START')
  
  try {
    // Prefetch users and roles data
    const [usersData, roles] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: queryKeys.adminUsers(),
        queryFn: adminUsersApi.getUsers,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.roles(),
        queryFn: rolesApi.getRoles,
      }),
    ])
    
    console.log('[App] adminUsersLoader SUCCESS')
    return { users: usersData.users, roles }
  } catch (error) {
    console.error('[App] adminUsersLoader ERROR:', error)
    // Return empty data on error - components will handle loading states
    return { users: [], roles: [] }
  }
}

const adminRolesLoader = async () => {
  console.log('[App] adminRolesLoader START')
  
  try {
    // Prefetch roles and permissions data
    const [roles, permissions] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: queryKeys.adminRoles(),
        queryFn: adminRolesApi.getRoles,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.adminPermissions(),
        queryFn: adminPermissionsApi.getPermissions,
      }),
    ])
    
    console.log('[App] adminRolesLoader SUCCESS')
    return { roles, permissions }
  } catch (error) {
    console.error('[App] adminRolesLoader ERROR:', error)
    return { roles: [], permissions: [] }
  }
}

const adminPermissionsLoader = async () => {
  console.log('[App] adminPermissionsLoader START')
  
  try {
    const permissions = await queryClient.fetchQuery({
      queryKey: queryKeys.adminPermissions(),
      queryFn: adminPermissionsApi.getPermissions,
      staleTime: 10 * 60 * 1000, // Cache permissions for 10 minutes
    })
    
    console.log('[App] adminPermissionsLoader SUCCESS')
    return { permissions }
  } catch (error) {
    console.error('[App] adminPermissionsLoader ERROR:', error)
    return { permissions: [] }
  }
}

const membersLoader = async () => {
  console.log('[App] membersLoader START')
  try {
    const membersData = await queryClient.fetchQuery({
      queryKey: queryKeys.members(),
      queryFn: membersApi.getMembers,
    })
    console.log('[App] membersLoader SUCCESS')
    return { members: membersData.members }
  } catch (error) {
    console.error('[App] membersLoader ERROR:', error)
    return { members: [] }
  }
}

const bankAccountsLoader = async () => { // New: Loader for BankAccountsPage
  console.log('[App] bankAccountsLoader START')
  try {
    const bankAccountsData = await queryClient.fetchQuery({
      queryKey: queryKeys.bankAccounts(),
      queryFn: bankAccountsApi.getBankAccounts,
    })
    console.log('[App] bankAccountsLoader SUCCESS')
    return { bankAccounts: bankAccountsData.bank_accounts }
  } catch (error) {
    console.error('[App] bankAccountsLoader ERROR:', error)
    return { bankAccounts: [] }
  }
}

const accountTypesLoader = async () => { // New: Loader for AccountTypesPage
  console.log('[App] accountTypesLoader START')
  try {
    const [accountTypesData, bankAccountsData] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: queryKeys.accountTypes(),
        queryFn: accountTypesApi.getAccountTypes,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.bankAccounts(),
        queryFn: bankAccountsApi.getBankAccounts,
      }),
    ])
    console.log('[App] accountTypesLoader SUCCESS')
    return { accountTypes: accountTypesData.account_types, bankAccounts: bankAccountsData.bank_accounts }
  } catch (error) {
    console.error('[App] accountTypesLoader ERROR:', error)
    return { accountTypes: [], bankAccounts: [] }
  }
}

const accountsLoader = async () => { // New: Loader for AccountsPage
  console.log('[App] accountsLoader START')
  try {
    const [accountsData, membersData, accountTypesData] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: queryKeys.accounts(),
        queryFn: accountsApi.getAccounts,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.members(),
        queryFn: membersApi.getMembers,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.accountTypes(),
        queryFn: accountTypesApi.getAccountTypes,
      }),
    ])
    console.log('[App] accountsLoader SUCCESS')
    return { accounts: accountsData.accounts, members: membersData.members, accountTypes: accountTypesData.account_types }
  } catch (error) {
    console.error('[App] accountsLoader ERROR:', error)
    return { accounts: [], members: [], accountTypes: [] }
  }
}

// Router configuration with loaders
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/force-password-change',
    element: <ForcePasswordChangePage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    hydrateFallbackElement: <AppLoadingFallback />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'dashboard', action: 'access' }}>
            <Suspense fallback={<PageLoadingFallback />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        ),
        loader: dashboardLoader,
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'admin/dashboard',
        element: (
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<PageLoadingFallback />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'users', action: 'manage' }}>
            <Suspense fallback={<PageLoadingFallback />}>
              <AdminUsers />
            </Suspense>
          </ProtectedRoute>
        ),
        loader: adminUsersLoader,
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'admin/roles',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'roles', action: 'manage' }}>
            <Suspense fallback={<PageLoadingFallback />}>
              <AdminRoles />
            </Suspense>
          </ProtectedRoute>
        ),
        loader: adminRolesLoader,
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'admin/permissions',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'permissions', action: 'manage' }}>
            <Suspense fallback={<PageLoadingFallback />}>
              <AdminPermissions />
            </Suspense>
          </ProtectedRoute>
        ),
        loader: adminPermissionsLoader,
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'members',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'members', action: 'manage' }}>
            <Suspense fallback={<PageLoadingFallback />}>
              <MembersPage />
            </Suspense>
          </ProtectedRoute>
        ),
        loader: membersLoader,
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'bank-accounts', // New: Route for BankAccountsPage
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'bank_accounts', action: 'manage' }}>
            <Suspense fallback={<PageLoadingFallback />}>
              <BankAccountsPage />
            </Suspense>
          </ProtectedRoute>
        ),
        loader: bankAccountsLoader,
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'account-types', // New: Route for AccountTypesPage
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'account_types', action: 'manage' }}>
            <Suspense fallback={<PageLoadingFallback />}>
              <AccountTypesPage />
            </Suspense>
          </ProtectedRoute>
        ),
        loader: accountTypesLoader,
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'accounts', // New: Route for AccountsPage
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'accounts', action: 'manage' }}>
            <Suspense fallback={<PageLoadingFallback />}>
              <AccountsPage />
            </Suspense>
          </ProtectedRoute>
        ),
        loader: accountsLoader,
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        ),
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'reports', action: 'view' }}>
            <Suspense fallback={<PageLoadingFallback />}>
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </Suspense>
          </ProtectedRoute>
        ),
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'transactions',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'transactions', action: 'create' }}>
            <Suspense fallback={<PageLoadingFallback />}>
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </Suspense>
          </ProtectedRoute>
        ),
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'analytics',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'reports', action: 'view' }}>
            <Suspense fallback={<PageLoadingFallback />}>
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </Suspense>
          </ProtectedRoute>
        ),
        hydrateFallbackElement: <PageLoadingFallback />,
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
              <p className="text-gray-600 mt-2">Coming soon...</p>
            </div>
          </Suspense>
        ),
        hydrateFallbackElement: <PageLoadingFallback />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
], {
  future: {
    v7_partialHydration: true,
  },
})

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App

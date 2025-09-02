import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      })
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Missing required environment variables',
          details: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate the request and check for admin role
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found')
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: userRolesData, error: userRolesError } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)

    if (userRolesError || !userRolesData || !userRolesData.some(ur => ur.roles?.name === 'admin')) {
      console.error('Permission check failed:', {
        userRolesError: userRolesError?.message,
        userRolesData,
        userId: user.id
      })
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const method = req.method
    const allPathSegments = url.pathname.split('/').filter(Boolean)
    
    // Find the index of 'bank-accounts' in the path
    const bankAccountsIndex = allPathSegments.findIndex(segment => segment === 'bank-accounts')
    if (bankAccountsIndex === -1) {
      return new Response(
        JSON.stringify({ error: 'Invalid path: bank-accounts not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get path segments relative to bank-accounts
    const pathSegments = allPathSegments.slice(bankAccountsIndex)
    
    // Handle /bank-accounts/:id/summary endpoint  
    if (method === 'GET' && pathSegments.length === 3 && pathSegments[2] === 'summary') {
      const bankAccountId = pathSegments[1]
      if (!bankAccountId) {
        return new Response(
          JSON.stringify({ error: 'Bank account ID is required for summary' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate total funds for the specified bank account
      const { data: totalFundsData, error: totalFundsError } = await supabase
        .from('accounts')
        .select('balance')
        .in('account_type_id', supabase
          .from('account_types')
          .select('id')
          .eq('bank_account_id', bankAccountId)
        )

      if (totalFundsError) {
        console.error('Error calculating total funds:', totalFundsError.message)
        return new Response(
          JSON.stringify({ error: totalFundsError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const totalFunds = totalFundsData.reduce((sum, account) => sum + parseFloat(account.balance), 0);

      return new Response(
        JSON.stringify({ bank_account_id: bankAccountId, total_funds: totalFunds }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET all bank accounts or a specific bank account
    if (method === 'GET') {
      // Check if this is a request for all bank accounts (/bank-accounts)
      if (pathSegments.length === 1) {
        // Get all bank accounts
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .order('account_name', { ascending: true })

        if (error) {
          console.error('Error fetching bank accounts:', error.message)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ bank_accounts: data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      // Check if this is a request for a specific bank account (/bank-accounts/:id)
      else if (pathSegments.length === 2) {
        const id = pathSegments[1]
        // Get specific bank account
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          console.error('Error fetching bank account:', error.message)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Bank account not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ bank_account: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // POST create bank account
    if (method === 'POST' && pathSegments.length === 1) {
      const body = await req.json()
      const { name, account_number, description } = body

      if (!name || !account_number) {
        return new Response(
          JSON.stringify({ error: 'Name and account number are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: newBankAccount, error } = await supabase
        .from('bank_accounts')
        .insert({ name, account_number, description })
        .select('*')
        .single()

      if (error) {
        console.error('Error creating bank account:', error.message)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ bank_account: newBankAccount }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT update bank account
    if (method === 'PUT' && pathSegments.length === 2) {
      const id = pathSegments[1]
      const body = await req.json()
      const { name, account_number, description } = body

      const { data: updatedBankAccount, error } = await supabase
        .from('bank_accounts')
        .update({ name, account_number, description })
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating bank account:', error.message)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!updatedBankAccount) {
        return new Response(
          JSON.stringify({ error: 'Bank account not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ bank_account: updatedBankAccount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE bank account
    if (method === 'DELETE' && pathSegments.length === 2) {
      const id = pathSegments[1]
      // Before deleting, check if any account_types are linked to this bank_account
      const { data: linkedAccountTypes, error: checkError } = await supabase
        .from('account_types')
        .select('id')
        .eq('bank_account_id', id)
        .limit(1)

      if (checkError) {
        console.error('Error checking linked account types:', checkError.message)
        return new Response(
          JSON.stringify({ error: checkError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (linkedAccountTypes && linkedAccountTypes.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete bank account: it is linked to existing account types.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting bank account:', error.message)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ message: 'Bank account deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.error('Invalid request:', { method, pathname: url.pathname, pathSegments, allPathSegments })
    return new Response(
      JSON.stringify({ error: 'Method not allowed or invalid path' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in bank-accounts function:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

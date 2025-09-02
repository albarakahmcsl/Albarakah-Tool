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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate the request and check for admin role
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
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
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const method = req.method
    const pathSegments = url.pathname.split('/').filter(Boolean)

    // GET all account types or a specific account type
    if (method === 'GET') {
      // Check if this is a request for all account types (/functions/v1/account-types)
      if (pathSegments.length === 3 && pathSegments[2] === 'account-types') {
        // Get all account types
        const { data, error } = await supabase
          .from('account_types')
          .select(`*, bank_accounts(id, name, account_number)`) // Select all account types and their linked bank accounts
          .order('name', { ascending: true })

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ account_types: data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      // Check if this is a request for a specific account type (/functions/v1/account-types/:id)
      else if (pathSegments.length === 4 && pathSegments[2] === 'account-types') {
        const id = pathSegments[3]
        // Get specific account type
        const { data, error } = await supabase
          .from('account_types')
          .select(`*, bank_accounts(id, name, account_number)`) // Select account type and its linked bank account
          .eq('id', id)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Account type not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ account_type: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // POST create account type
    if (method === 'POST' && pathSegments.length === 3 && pathSegments[2] === 'account-types') {
      const body = await req.json()
      const { name, description, min_balance, profit_rate, withdrawal_rules, processing_fee, bank_account_id } = body

      if (!name || !bank_account_id) {
        return new Response(
          JSON.stringify({ error: 'Name and bank_account_id are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: newAccountType, error } = await supabase
        .from('account_types')
        .insert({ name, description, min_balance, profit_rate, withdrawal_rules, processing_fee, bank_account_id })
        .select(`*, bank_accounts(id, name, account_number)`)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ account_type: newAccountType }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT update account type
    if (method === 'PUT' && pathSegments.length === 4 && pathSegments[2] === 'account-types') {
      const id = pathSegments[3]
      const body = await req.json()
      const { name, description, min_balance, profit_rate, withdrawal_rules, processing_fee, bank_account_id } = body

      const { data: updatedAccountType, error } = await supabase
        .from('account_types')
        .update({ name, description, min_balance, profit_rate, withdrawal_rules, processing_fee, bank_account_id })
        .eq('id', id)
        .select(`*, bank_accounts(id, name, account_number)`)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!updatedAccountType) {
        return new Response(
          JSON.stringify({ error: 'Account type not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ account_type: updatedAccountType }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE account type
    if (method === 'DELETE' && pathSegments.length === 4 && pathSegments[2] === 'account-types') {
      const id = pathSegments[3]
      // Before deleting, check if any accounts are linked to this account_type
      const { data: linkedAccounts, error: checkError } = await supabase
        .from('accounts')
        .select('id')
        .eq('account_type_id', id)
        .limit(1)

      if (checkError) {
        return new Response(
          JSON.stringify({ error: checkError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (linkedAccounts && linkedAccounts.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete account type: it is linked to existing accounts.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('account_types')
        .delete()
        .eq('id', id)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ message: 'Account type deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed or invalid path' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in account-types function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

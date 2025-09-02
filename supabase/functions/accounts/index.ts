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

    // Authenticate the request and check for admin/staff role
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

    // Check if user is admin or staff
    const { data: userRolesData, error: userRolesError } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)

    if (userRolesError || !userRolesData || (!userRolesData.some(ur => ur.roles?.name === 'admin') && !userRolesData.some(ur => ur.roles?.name === 'staff'))) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin or Staff role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const method = req.method
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const id = pathSegments[pathSegments.length - 1] // Get ID for specific resource operations

    // GET all accounts or a specific account
    if (method === 'GET' && pathSegments[pathSegments.length - 2] === 'accounts') {
      if (id && id !== 'accounts') { // Get specific account
        const { data, error } = await supabase
          .from('accounts')
          .select(`
            *,
            members(id, full_name, contact_email),
            account_types(id, name, description, processing_fee, bank_accounts(id, name))
          `)
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
            JSON.stringify({ error: 'Account not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ account: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else { // Get all accounts
        const { data, error } = await supabase
          .from('accounts')
          .select(`
            *,
            members(id, full_name, contact_email),
            account_types(id, name, description, processing_fee, bank_accounts(id, name))
          `)
          .order('open_date', { ascending: false })

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ accounts: data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // POST create account
    if (method === 'POST' && url.pathname.endsWith('/accounts')) {
      const body = await req.json()
      const { member_id, account_type_id, account_number, balance, open_date, status } = body

      if (!member_id || !account_type_id || !account_number) {
        return new Response(
          JSON.stringify({ error: 'Member ID, Account Type ID, and Account Number are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Fetch account type details to determine processing_fee_paid status
      const { data: accountType, error: accountTypeError } = await supabase
        .from('account_types')
        .select('processing_fee')
        .eq('id', account_type_id)
        .single()

      if (accountTypeError || !accountType) {
        return new Response(
          JSON.stringify({ error: accountTypeError?.message || 'Account type not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const processing_fee_paid = accountType.processing_fee > 0 ? false : true; // Mark as false if fee > 0, true if fee is 0

      const { data: newAccount, error } = await supabase
        .from('accounts')
        .insert({
          member_id,
          account_type_id,
          account_number,
          balance: balance || 0,
          open_date: open_date || new Date().toISOString(),
          status: status || 'open',
          processing_fee_paid // Set based on account type's processing_fee
        })
        .select(`
          *,
          members(id, full_name, contact_email),
          account_types(id, name, description, processing_fee, bank_accounts(id, name))
        `)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ account: newAccount }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT update account
    if (method === 'PUT' && pathSegments[pathSegments.length - 2] === 'accounts' && id) {
      const body = await req.json()
      const { member_id, account_type_id, account_number, balance, open_date, status, processing_fee_paid } = body

      const { data: updatedAccount, error } = await supabase
        .from('accounts')
        .update({ member_id, account_type_id, account_number, balance, open_date, status, processing_fee_paid })
        .eq('id', id)
        .select(`
          *,
          members(id, full_name, contact_email),
          account_types(id, name, description, processing_fee, bank_accounts(id, name))
        `)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!updatedAccount) {
        return new Response(
          JSON.stringify({ error: 'Account not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ account: updatedAccount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE account
    if (method === 'DELETE' && pathSegments[pathSegments.length - 2] === 'accounts' && id) {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ message: 'Account deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed or invalid path' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in accounts function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

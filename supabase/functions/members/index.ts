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

    // GET all members or a specific member
    if (method === 'GET') {
      // Check if this is a request for all members (/functions/v1/members)
      if (pathSegments.length === 3 && pathSegments[2] === 'members') {
        // Get all members
        const { data, error } = await supabase
          .from('members')
          .select(`*, accounts(*)`) // Select all members and their accounts
          .order('created_at', { ascending: false })

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ members: data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      // Check if this is a request for a specific member (/functions/v1/members/:id)
      else if (pathSegments.length === 4 && pathSegments[2] === 'members') {
        const id = pathSegments[3]
        // Get specific member
        const { data, error } = await supabase
          .from('members')
          .select(`*, accounts(*)`) // Select member and their accounts
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
            JSON.stringify({ error: 'Member not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ member: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // POST create member
    if (method === 'POST' && pathSegments.length === 3 && pathSegments[2] === 'members') {
      const body = await req.json()
      const { full_name, contact_email, phone_number, address, user_id, status } = body

      if (!full_name || !contact_email) {
        return new Response(
          JSON.stringify({ error: 'Full name and contact email are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: newMember, error } = await supabase
        .from('members')
        .insert({ full_name, contact_email, phone_number, address, user_id, status })
        .select(`*, accounts(*)`)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ member: newMember }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT update member
    if (method === 'PUT' && pathSegments.length === 4 && pathSegments[2] === 'members') {
      const id = pathSegments[3]
      const body = await req.json()
      const { full_name, contact_email, phone_number, address, user_id, status } = body

      const { data: updatedMember, error } = await supabase
        .from('members')
        .update({ full_name, contact_email, phone_number, address, user_id, status })
        .eq('id', id)
        .select(`*, accounts(*)`)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!updatedMember) {
        return new Response(
          JSON.stringify({ error: 'Member not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ member: updatedMember }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE member
    if (method === 'DELETE' && pathSegments.length === 4 && pathSegments[2] === 'members') {
      const id = pathSegments[3]
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ message: 'Member deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed or invalid path' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in members function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

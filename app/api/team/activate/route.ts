import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = user.email?.toLowerCase()
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    // Link and activate membership
    const { data: member, error: updateError } = await supabaseAdmin
      .from('team_members')
      .update({
        user_id: user.id,
        status: 'active',
        is_active: true
      })
      .eq('email', email)
      .eq('status', 'pending')
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('Activation update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (!member) {
      // Check if already active
      const { data: existing } = await supabaseAdmin
        .from('team_members')
        .select('customer_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (!existing) {
        return NextResponse.json({ error: 'No pending invite found for this email' }, { status: 404 })
      }
      
      return NextResponse.json({ success: true, alreadyActive: true })
    }

    // Ensure they have a customer record too
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!customer) {
      await supabaseAdmin.from('customers').insert({
        id: user.id,
        full_name: member.name || user.user_metadata?.full_name || email.split('@')[0],
        contact_email: email,
        business_name: '',
        status: 'trial',
        plan: 'free'
      })
    }

    return NextResponse.json({ success: true, member })
  } catch (err) {
    console.error('Team activate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

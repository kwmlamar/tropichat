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

    const { email, name, role } = await req.json()

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'email, name, and role are required' }, { status: 400 })
    }

    if (!['admin', 'agent'].includes(role)) {
      return NextResponse.json({ error: 'Role must be admin or agent' }, { status: 400 })
    }

    // Upsert the team member record (allows re-inviting with a fresh pending status)
    const { data: member, error: insertError } = await supabaseAdmin
      .from('team_members')
      .upsert({
        customer_id: user.id,
        email: email.toLowerCase(),
        name,
        role,
        status: 'pending',
        is_active: true,
      }, { onConflict: 'customer_id,email' })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Send invite email via Supabase Auth
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invite`
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: { invited_by: user.id, customer_id: user.id, role },
    })

    if (inviteError) {
      const isExistingUser = inviteError.message.includes('already been registered') || (inviteError as any).status === 422
      if (isExistingUser) {
        return NextResponse.json({ 
          error: 'This user already has a TropiChat account. They have been added to your team record, but no new invite email was sent as they can already log in.',
          data: member
        }, { status: 400 })
      }
      
      console.warn('Invite email error:', inviteError.message)
    }

    return NextResponse.json({ data: member, error: null })
  } catch (err) {
    console.error('Team invite error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

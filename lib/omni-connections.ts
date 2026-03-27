import { getSupabase } from './supabase'
import type { PostgrestError } from '@supabase/supabase-js'

export interface EmailAccount {
  id: string
  user_id: string
  channel_type: 'email'
  channel_account_id: string
  status: 'active' | 'inactive'
  created_at: string
}

export async function fetchEmailAccounts(): Promise<{
  data: EmailAccount[]
  error: PostgrestError | null
}> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('channel_type', 'email')
    .order('created_at', { ascending: false })

  return { data: (data as EmailAccount[]) || [], error }
}

export async function addEmailAccount(email: string): Promise<{
  data: EmailAccount | null
  error: string | null
}> {
  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('connected_accounts')
    .insert({
      user_id: session.user.id,
      channel_type: 'email',
      channel_account_id: email,
      status: 'active',
      access_token: 'manual_connection'
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as EmailAccount, error: null }
}

export async function toggleEmailStatus(id: string, currentStatus: 'active' | 'inactive'): Promise<{
  error: string | null
}> {
  const supabase = getSupabase()
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
  
  const { error } = await supabase
    .from('connected_accounts')
    .update({ status: newStatus })
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}

export async function disconnectEmailAccount(id: string): Promise<{
  error: string | null
}> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('connected_accounts')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}

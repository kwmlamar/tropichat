import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  console.log('[trial-expirer] Running sync...')

  // 1. Find all customers whose trial ended but are still marked as 'trial'
  const { data: expiredTrials, error } = await supabase
    .from('customers')
    .update({ status: 'suspended' })
    .eq('status', 'trial')
    .lt('trial_ends_at', new Date().toISOString())
    .select('id, business_name')

  if (error) {
    console.error('[trial-expirer] Error updating trials:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }

  console.log(`[trial-expirer] Successfully suspended ${expiredTrials?.length || 0} expired accounts:`, expiredTrials)

  return new Response(JSON.stringify({ 
    message: `Suspended ${expiredTrials?.length || 0} accounts`, 
    accounts: expiredTrials 
  }), { 
    status: 200, 
    headers: { 'Content-Type': 'application/json' } 
  })
})

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addDiscoveryScript() {
  const discoveryScript = {
    category: 'calling',
    industry: 'general',
    title: 'The Discovery/Research Script',
    content: `Hi [Name], I'm doing quick market research for a new "Sales Partner" service for local businesses. 2 minutes?

1. THE GOAL: What's your #1 target this year? Doubling sales or more free time?
2. THE PAIN: On a scale of 1-10, how "messy" is your WhatsApp/IG inbox?
3. THE BRIDGE: My AI Sales Agents solve [Goal] by handling [Pain].

Want a 2-minute demo? 🌴🔍`,
    status: 'ready'
  }

  console.log("Adding The Discovery/Research Script...")
  const { error: insertError } = await supabase
    .from('outreach_scripts')
    .insert([discoveryScript])

  if (insertError) {
    console.error("Error inserting script:", insertError)
  } else {
    console.log("Successfully added the discovery script!")
  }
}

addDiscoveryScript()

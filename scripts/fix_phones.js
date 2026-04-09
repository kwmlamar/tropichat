require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectDB() {
  const { data } = await supabase
    .from('leads')
    .select('id, business_name, contact_phone')
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log("Recent Leads:");
  console.table(data);

  console.log("Clearing Call Today AND updating 'No Phone Protocol' and 'scanned for phone' etc to NULL...");
  
  // Clear call today
  await supabase.from('leads').update({ call_today_date: null }).not('call_today_date', 'is', null);

  // Update garbage text to null
  const { error } = await supabase
    .from('leads')
    .update({ contact_phone: null })
    .in('contact_phone', ['No Phone Protocol', 'scanned for phone', 'Scanned for Phone', '']);
    
  if (error) console.error("Error updating phones to null:", error);
  else console.log("Garbage phone numbers successfully turned to true NULL.");
}

inspectDB();

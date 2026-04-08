import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_SETTINGS = {
  enabled: false,
  days: ["tuesday", "wednesday", "thursday"],
  time: "08:30",
  query: "Boutiques Nassau"
}

export async function GET() {
  const { data } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "scrape_schedule")
    .maybeSingle()

  return NextResponse.json(data?.value || DEFAULT_SETTINGS)
}

export async function PATCH(req: Request) {
  const body = await req.json()

  const { error } = await supabase
    .from("admin_settings")
    .upsert(
      { key: "scrape_schedule", value: body, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

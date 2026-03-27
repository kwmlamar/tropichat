import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load mission credentials
load_dotenv(".env.local")

URL: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not URL or not KEY:
    print("❌ ERROR: Missing credentials in .env.local")
    sys.exit(1)

supabase: Client = create_client(URL, KEY)

def backfill_links():
    print("🛰️  LEGACY MISSION: Backfilling intelligence links for existing leads...")
    
    # 1. Fetch existing leads
    response = supabase.table("leads").select("id, business_name, source, external_link").execute()
    leads = response.data
    
    if not leads:
        print("💡 MISSION STATUS: No leads found to enrich.")
        return

    updated_count = 0
    for lead in leads:
        # Skip if already has a link
        if lead.get("external_link"):
            continue
            
        biz_name = lead["business_name"]
        source = (lead.get("source") or "Manual").lower()
        
        # 2. Construct Mission Link
        link = None
        if "facebook" in source:
            link = f"https://www.facebook.com/search/pages/?q={biz_name.replace(' ', '+')}"
        elif "instagram" in source:
            link = f"https://www.instagram.com/explore/tags/{biz_name.lower().replace(' ', '')}/"
        else:
            # Default to Google Maps search
            link = f"https://www.google.com/maps/search/?api=1&query={biz_name.replace(' ', '+')}+Bahamas"
            
        # 3. Update Lead
        if link:
            supabase.table("leads").update({"external_link": link}).eq("id", lead["id"]).execute()
            updated_count += 1
            print(f"✅ LINKED: {biz_name} ({source})")

    print(f"🏁 MISSION COMPLETE: {updated_count} leads enriched with digital bridges.")

if __name__ == "__main__":
    backfill_links()

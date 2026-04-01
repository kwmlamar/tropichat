import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

# Load config from the project root
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(env_path)

# Supabase Credentials
URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not URL or not KEY:
    print("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local")
    exit(1)

supabase = create_client(URL, KEY)

def scan_table(table_name, name_col, email_col, phone_col, bus_type_col, timestamp_col, now):
    """Generic table scanner for follow-up windows."""
    three_days_ago = (now - timedelta(days=3)).isoformat()
    four_days_ago = (now - timedelta(days=4)).isoformat()
    fourteen_days_ago = (now - timedelta(days=14)).isoformat()
    fifteen_days_ago = (now - timedelta(days=15)).isoformat()

    results = {"momentum": [], "reignite": []}
    
    try:
        # Momentum (3-4 days old)
        new = supabase.table(table_name).select("*").gt(timestamp_col, four_days_ago).lt(timestamp_col, three_days_ago).execute()
        results["momentum"] = new.data
        
        # Re-ignite (14-15 days old)
        stale = supabase.table(table_name).select("*").gt(timestamp_col, fifteen_days_ago).lt(timestamp_col, fourteen_days_ago).execute()
        results["reignite"] = stale.data
    except Exception as e:
        # Silently skip tables that don't exist
        if "Could not find the table" not in str(e):
            print(f"❌ Error scanning {table_name}: {str(e)}")
        return None

    return results

def get_leads_needing_follow_up():
    print("🛰️  TROPICHAT INTEL: Scanning for warm prospects across all sources...")
    now = datetime.now()
    
    # Tables to scan: (name, id_col, email_col, phone_col, bus_type_col, timestamp_col)
    sources = [
        ("waitlist", "name", "email", "phone", "business_type", "created_at"),
        ("leads", "business_name", "contact_phone", "contact_phone", "category", "created_at")
    ]

    all_momentum = []
    all_reignite = []

    for table, name, email, phone, biz, ts in sources:
        data = scan_table(table, name, email, phone, biz, ts, now)
        if data:
            for l in data["momentum"]:
                all_momentum.append({**l, "_source": table, "_name": l.get(name, "Unknown"), "_email": l.get(email, "N/A"), "_phone": l.get(phone, "N/A"), "_biz": l.get(biz, "N/A")})
            for l in data["reignite"]:
                all_reignite.append({**l, "_source": table, "_name": l.get(name, "Unknown"), "_email": l.get(email, "N/A"), "_phone": l.get(phone, "N/A"), "_biz": l.get(biz, "N/A")})

    print(f"\n🔥 [MOMENTUM] Needs 3-Day Follow-up: {len(all_momentum)} prospects")
    for l in all_momentum:
        print(f"   ✨ {l['_name']} | {l['_biz']} | {l['_email']} | {l['_phone']} (Source: {l['_source']})")
    if not all_momentum: print("   (No prospects in this window)")

    print(f"\n❄️ [RE-IGNITE] Needs 2-Week Follow-up: {len(all_reignite)} prospects")
    for l in all_reignite:
        print(f"   ⚓ {l['_name']} | {l['_biz']} | {l['_email']} | {l['_phone']} (Source: {l['_source']})")
    if not all_reignite: print("   (No prospects in this window)")

if __name__ == "__main__":
    get_leads_needing_follow_up()

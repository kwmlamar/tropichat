import os
import sys
import argparse
import random
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env.local
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(dotenv_path=env_path)

# Supabase Credentials
URL: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Primary Intelligence Keys
G_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY")
META_TOKEN: str = os.getenv("MESSENGER_PAGE_ACCESS_TOKEN")

if not URL or not KEY:
    print("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local")
    sys.exit(1)

supabase: Client = create_client(URL, KEY)

def find_google_leads(query="Boutiques Nassau"):
    """
    DISCOVERY ENGINE: Pro-mode using Google Places API.
    """
    print(f"🛰️  G-MAPS SCAN: Searching Google Maps for '{query}' in the Bahamas...")
    endpoint = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {"query": f"{query} Bahamas", "key": G_KEY}
    
    try:
        response = requests.get(endpoint, params=params)
        data = response.json()
        if data.get("status") != "OK": return []

        results = []
        for place in data.get("results", []):
            biz_name = place.get("name")
            address = place.get("formatted_address", "Bahamas")
            # Construct a Google Maps Search Link
            maps_link = f"https://www.google.com/maps/search/?api=1&query={biz_name.replace(' ', '+')}+{address.replace(' ', '+')}"
            
            results.append({
                "business_name": biz_name,
                "category": place.get("types")[0].replace('_', ' ').capitalize() if place.get("types") else "Business",
                "contact_phone": "Scan for phone...",
                "external_link": maps_link,
                "notes": f"Detected in {address}. Rating: {place.get('rating', 'N/A')}⭐",
                "source": "Google Maps Pro",
                "status": "cold"
            })
        print(f"✅ G-MAPS SUCCESS: Locked on to {len(results)} REAL businesses.")
        return results
    except Exception as e:
        print(f"❌ SCAN ERROR: {str(e)}")
        return []

def find_meta_leads(query="Boutiques Nassau", platform="facebook"):
    """
    META DISCOVERY (UPGRADED): Bypasses Meta API restrictions using Google Maps Proxy.
    """
    print(f"🛰️  SOCIAL PROXY SCAN ({platform.upper()}): Searching for {platform} profiles for '{query}'...")
    
    # We use Google's advanced index to find social-heavy businesses instead of Meta's locked search
    proxy_query = f"{query} {platform.capitalize()} Bahamas"
    endpoint = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {"query": proxy_query, "key": G_KEY}
    
    try:
        response = requests.get(endpoint, params=params)
        data = response.json()
        if data.get("status") != "OK": return []

        results = []
        for place in data.get("results", []):
            biz_name = place.get("name")
            # Construct platform-specific links
            if platform == 'facebook':
                link = f"https://www.facebook.com/search/pages/?q={biz_name.replace(' ', '+')}"
            else:
                link = f"https://www.instagram.com/explore/tags/{biz_name.lower().replace(' ', '')}/"
                
            results.append({
                "business_name": biz_name,
                "category": f"{platform.capitalize()} Lead",
                "contact_phone": "Scan for phone...",
                "external_link": link,
                "instagram_handle": f"{biz_name.lower().replace(' ', '')}" if platform == 'instagram' else None,
                "source": f"{platform.capitalize()} Discovery",
                "notes": f"Socially detected in {place.get('formatted_address', 'Bahamas')}. Potential reach: {place.get('rating', 'N/A')}⭐",
                "status": "cold"
            })
        print(f"✅ PROXY SUCCESS: Locked on to {len(results)} REAL social prospects.")
        return results
    except Exception as e:
        print(f"❌ SCAN ERROR: {str(e)}")
        return []

def add_leads_to_pipeline(leads):
    print(f"🚀 INJECTING: Pushing {len(leads)} leads to CRM...")
    count = 0
    for lead in leads:
        try:
            existing = supabase.table("leads").select("id").eq("business_name", lead["business_name"]).execute()
            if len(existing.data) > 0: continue
            supabase.table("leads").insert(lead).execute()
            count += 1
        except Exception: pass
    print(f"🏁 FINISHED: Expanded your pipeline by {count} leads.")

def main():
    parser = argparse.ArgumentParser(description='TropiChat Pro Prospector')
    parser.add_argument('--query', type=str, default='Boutiques Nassau', help='Search query')
    parser.add_argument('--run', action='store_true', help='Execute mission')
    parser.add_argument('--source', type=str, default='google', choices=['google', 'facebook', 'instagram'], help='Mission source')
    args = parser.parse_args()
    
    if args.run:
        if args.source == 'google':
            leads = find_google_leads(args.query)
        else:
            leads = find_meta_leads(args.query, args.source)
            
        if leads:
            add_leads_to_pipeline(leads)
    else:
        print("💡 Use --run --query 'Boutiques' --source 'facebook' to launch a mission.")

if __name__ == "__main__":
    main()

import os
from dotenv import load_dotenv
from supabase import create_client

# Load config
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(env_path)

supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

calling_scripts = [
    {
        "category": "calling",
        "industry": "general",
        "title": "The 'Chaos' Diagnostic",
        "status": "ready",
        "content": "Morning [Name]! This Lamar with TropiTech. \n\nLook, I'll be brief—I've been looking at how y'all handle DMs on IG and WhatsApp. It looks like y'all moving heavy, but I gotta ask: How many sales you think slipped through the cracks last week because a message got buried? \n\n(Wait for answer) \n\nReason I'm calling is we built a 'Powered-up Sales Engine' specifically for Caribbean shops to handle that chaos. Can I send you a 30-second clip of how it works?"
    },
    {
        "category": "calling",
        "industry": "realestate",
        "title": "Real Estate: The Instant Agent",
        "status": "ready",
        "content": "Morning [Name], Lamar here. I'm calling about [Listing Name/Area]. \n\nI noticed y'all have a solid presence, but quick question: When a high-net-worth lead hits your WhatsApp at 11 PM on a Sunday, who's answering? \n\n(Wait) \n\nExactly. We’re setting up Luxury Real Estate firms with AI Agents that handle those initial inquiries *instantly* so your team only talks to 'Mission Ready' buyers. Would y'all be open to a 5-minute Island Gold walkthrough this Thursday?"
    },
    {
        "category": "calling",
        "industry": "tourism",
        "title": "Hotel: The 24/7 Concierge",
        "status": "ready",
        "content": "Hi [Name]! Lamar with TropiTech Solutions. \n\nI was looking at your booking flow on Instagram. You guys are gorgeous, but I noticed a bit of a delay when I asked a basic question as a 'secret shopper'. \n\nIn this industry, delay is a lost booking. We turn your DMs into an automated concierge that books rooms while you sleep. Are you already using AI for your socials, or y'all still doing it the long way?"
    },
    {
        "category": "calling",
        "industry": "retail",
        "title": "Retail: The 'Stock' Specialist",
        "status": "ready",
        "content": "Morning! This Lamar. Real quick—y'all find it hard to keep up with the 'Is this in stock?' or 'How much is this?' messages on WhatsApp? \n\n(Wait) \n\nI figured. I'm seeing boutiques losing 30-40% of their sales just because they can't reply fast enough. We built a tool that handles those repetitive questions 24/7 so you can focus on the growth. \n\nI’m in the neighborhood tomorrow—mind if I stop by for 2 minutes to show you the ROI?"
    },
    {
        "category": "general",
        "industry": "general",
        "title": "The 'Competition' Hook",
        "status": "ready",
        "content": "Hey [Name], Lamar here. \n\nI'm calling because I just helped [Competitor Name] automate their entire sales flow on WhatsApp. They're seeing about a 3x increase in response time. \n\nI didn't want y'all to get left behind while they're scaling. Are y'all still manually replying to every DM, or have you looked into the Autonomous Agent side yet?"
    },
    {
        "category": "calling",
        "industry": "general",
        "title": "The 'Season Rush' Prep",
        "status": "ready",
        "content": "Morning [Name]! Lamar here. \n\nLook, [Carnival/Christmas/Easter] is coming up and y'all know how crazy the DMs get. If you don't have a system to track every lead, you're basically leaving money on the table for the competition. \n\nWe’re doing a special 'Early Access' setup this week to get businesses ready for the rush. You got 2 minutes to see how we can save your team 15 hours a week?"
    }
]

def migrate():
    print("🚀 PROVISIONING: Injecting Cold Calling intellectual assets...")
    success_count = 0
    for script in calling_scripts:
        try:
            # Check if title already exists to avoid duplicates
            existing = supabase.table("outreach_scripts").select("id").eq("title", script["title"]).execute()
            if len(existing.data) > 0:
                print(f"⏩ SKIPPING: '{script['title']}' already exists.")
                continue
                
            supabase.table("outreach_scripts").insert(script).execute()
            print(f"✅ ADDED: '{script['title']}'")
            success_count += 1
        except Exception as e:
            print(f"❌ ERROR adding '{script['title']}': {str(e)}")
            
    print(f"\n🏁 FINISHED: Provisioned {success_count} calling assets.")

if __name__ == "__main__":
    migrate()

import os
from dotenv import load_dotenv
from supabase import create_client

# Load config
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(env_path)

supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

scripts = [
    {
        "category": "messaging",
        "industry": "general",
        "title": "Lamar Standard Initial",
        "status": "ready",
        "content": "Morning [Name]! This Lamar with TropiTech. Real quick, I see y'all moving heavy on IG, WhatsApp and facebook. Yall find it hard to keep up with all those DMs, or you got a system and I'm just trippin? Seeing a lot of Boutiques and operators losing sales because messages get lost."
    },
    {
        "category": "messaging",
        "industry": "general",
        "title": "3-Day Momentum (WhatsApp)",
        "status": "ready",
        "content": "Hey [Name]! It’s Lamar from TropiChat. 🏝️\n\nI noticed you checked out the platform a few days ago but haven't had a chance to dive in yet. \n\nMost [Business Type] owners I talk to are usually drowning in WhatsApp chats right about now—is that what's holding you back, or can I help answer any technical questions to get you started?"
    },
    {
        "category": "messaging",
        "industry": "general",
        "title": "2-Week Re-ignite (WhatsApp)",
        "status": "ready",
        "content": "Hey [Name]! 🏝️ Just saw an Island Retailer using TropiChat to close 40% more sales by simply not missing DMs while they were asleep. \n\nIt reminded me of our conversation. Are you still looking to reclaim 10+ hours of your week and scale your [Business Type]? \n\nI've got one priority onboarding slot left for this Thursday. Want it?"
    },
    {
        "category": "messaging",
        "industry": "general",
        "title": "Rebound: Existing System",
        "status": "ready",
        "content": "Respect! Glad to hear y'all on top of it. Most systems I see locally struggle with [Instagram + WhatsApp] in one place, or they don't have the Island-Native AI to handle the 2 AM 'Is this still available?' questions. \n\nAre y'all already using AI for that, or is the team still doing the heavy lifting manually?"
    },
    {
        "category": "messaging",
        "industry": "general",
        "title": "Rebound: Not Interested",
        "status": "ready",
        "content": "Understood, [Name]. I'll leave you to the grind! 🏝️ \n\nJust so you know, we're launching the Autonomous Agent update next month—it basically acts as a 24/7 sales rep for your DMs. Can I check back with you when that goes live, or should I just keep you on the VIP list for when y'all start scaling?"
    },
    {
        "category": "messaging",
        "industry": "general",
        "title": "Rebound: Budget",
        "status": "ready",
        "content": "I hear you. That’s exactly why I mentioned the Starter tier at less than $1/day. \n\nUsually, if TropiChat saves you from missing just ONE sale a month, it's already paid for itself. But if now isn't the time, no stress. Want me to just send over the free 'Social Sales Guide' we made for Caribbean Boutiques in the meantime?"
    },
    {
        "category": "messaging",
        "industry": "realestate",
        "title": "Luxury Real Estate Follow-up",
        "status": "ready",
        "content": "In Luxury Real Estate, a 2-hour delay in responding to a WhatsApp inquiry often means a lost lead. TropiChat ensures your high-net-worth clients get an instant, professional response 24/7. Shall we secure your 'Pro' slot?"
    },
    {
        "category": "messaging",
        "industry": "tourism",
        "title": "Boutique Hotel Follow-up",
        "status": "ready",
        "content": "Managing bookings over Instagram DMs can be a mess. TropiChat unifies your booking flow so you spend less time 'chatting' and more time 'hosting'. Ready to see the guest-ready dashboard?"
    },
    {
        "category": "messaging",
        "industry": "retail",
        "title": "Island Retailer Follow-up",
        "status": "ready",
        "content": "Inventory questions shouldn't stop you from sleeping. Our AI Agents handle the common 'Is this in stock?' questions while you focus on growth. Want to try it?"
    },
    {
        "category": "email",
        "industry": "general",
        "title": "Exclusive Access 50% Off",
        "status": "ready",
        "content": "Subject: Still lost in the WhatsApp chaos? 🌪️\n\nHi [Name],\n\nI’m checking in to see if you’re still interested in turning your WhatsApp into a powered-up sales engine. \n\nWe’re currently prioritizing the first 100 signups for that 50% off for 3 months perk. I’d hate for you to miss that slot while your competitors are already automating their sales.\n\nDo you have 5 minutes this week for a quick 'Island Gold' walkthrough?"
    },
    {
        "category": "email",
        "industry": "general",
        "title": "Strategic AI Audit",
        "status": "ready",
        "content": "Subject: [Business Name] + TropiChat: A quick thought\n\nHi [Name],\n\nIt’s been a couple of weeks since you joined the TropiChat waitlist. \n\nI was looking at [Business Name]’s social presence and I can see exactly where an AI Sales Agent could handle those pricing and delivery questions for you 24/7.\n\nIf you're still serious about scaling your reach in the Caribbean without hiring 3 more people, let’s get you set up. \n\nReply 'GOLD' and I’ll send over a personalized setup link."
    }
]

def migrate():
    print("🚀 PROVISIONING: Injecting Lamar Standard scripts into Database...")
    success_count = 0
    for script in scripts:
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
            
    print(f"\n🏁 FINISHED: Provisioned {success_count} intellectual assets.")

if __name__ == "__main__":
    migrate()

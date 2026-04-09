import os
from dotenv import load_dotenv
from supabase import create_client

# Load config
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(env_path)

supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

scripts = [
    {
        "category": "calling",
        "industry": "tours",
        "title": "Lamar Standard: Tour Operators (Calling)",
        "status": "ready",
        "content": "🟢 Opener (5 seconds or less)\n“Quick one — I help tour operators turn messages into more bookings.”\n(stop talking)\n\n⸻\n\n🟡 The Bridge\n“Most places get inquiries, but people disappear before booking. I help you capture those sales.”\n\n⸻\n\n🔵 Qualification\n“You getting most of your bookings through WhatsApp, Instagram, or your website?”\n\n⸻\n\n🔥 Pain trigger\n“Yeah, that’s where they drop off. They ask questions then never come back.”\n\n⸻\n\n💰 The Pitch\n“What I do is help you reply faster and follow up so more of those inquiries actually turn into bookings.”"
    },
    {
        "category": "messaging",
        "industry": "tours",
        "title": "Booking Assistant: Tour Inquiry",
        "status": "ready",
        "content": "Hey! 🏝️ Thanks for asking about our [Tour Name]. We still have slots for [Date]! Would you like to secure your booking now before we fill up? Just let me know how many people!"
    },
    {
        "category": "messaging",
        "industry": "tours",
        "title": "Booking Assistant: Availability Check",
        "status": "ready",
        "content": "Checking the calendar for you... 🗓️ Yes, we're good for [Time/Date]! Shall I send over the booking link so you don't lose the spot?"
    },
    {
        "category": "messaging",
        "industry": "car_rentals",
        "title": "Conversion: Car Rental Lead",
        "status": "ready",
        "content": "Hey [Name]! Noticed you were looking at the [Car Model] for your trip. 🚗 That one goes fast—want me to hold it for you for 24 hours while you finalize your plans?"
    },
    {
        "category": "messaging",
        "industry": "events",
        "title": "Conversion: Event Inquiry",
        "status": "ready",
        "content": "Hi! We'd love to help with your [Event Type]. 🥂 To give you an accurate quote and secure the date, could you tell me a bit more about the headcount and venue? We're booking up fast for [Month]!"
    },
    {
        "category": "messaging",
        "industry": "general",
        "title": "Follow-up: Interested but Ghosted",
        "status": "ready",
        "content": "Hey [Name]! Just checking back on this. Usually when people ask about [Service] and then go quiet, it's because they found another option or just got busy. Which one is it for you? Either way, I'm here if you still want to book! 😊"
    },
    {
        "category": "messaging",
        "industry": "general",
        "title": "Follow-up: Still Interested?",
        "status": "ready",
        "content": "Quick check-in! 🏝️ Are you still interested in [Service]? We're almost fully booked for the next two weeks, so I wanted to make sure you didn't miss out."
    },
    {
        "category": "messaging",
        "industry": "salons",
        "title": "Conversion: Salon/Beauty Booking",
        "status": "ready",
        "content": "Hey! We have an opening for [Service] this [Day] at [Time]. 💅 Want me to put your name down? It’s our last slot for the week!"
    },
    {
        "category": "messaging",
        "industry": "general",
        "title": "Rebound: Existing System",
        "status": "ready",
        "content": "Respect! Glad you got a system. Most people I talk to find that generic bots don't actually CLOSE the sale—they just answer questions. We focus on conversion. Is your current system actually increasing your bookings, or just saving you a few minutes?"
    },
    {
        "category": "email",
        "industry": "tours",
        "title": "Conversion: Recovery Email",
        "status": "ready",
        "content": "Subject: Still want to see the [Island/Activity]? 🏝️\n\nHi [Name],\n\nYou recently inquired about booking a tour with us but we haven't confirmed yet. \n\nI’d hate for you to miss out on the experience. We've helped dozens of people turn their inquiries into dream bookings this week.\n\nAre you still planning to join us? I can help you finalize everything right now.\n\nBest,\n[Your Name]"
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

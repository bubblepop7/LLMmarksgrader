import os
import asyncio
from dotenv import load_dotenv
import httpx

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

async def test_groq():
    print("Testing Groq API...")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": "Return the word 'success' only."}],
        "temperature": 0.0
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            if response.status_code == 200:
                print(f"[Groq Success] Response: {response.json()['choices'][0]['message']['content'].strip()}")
            else:
                print(f"[Groq Error] Status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[Groq Exception] {e}")

async def test_supabase():
    print("Testing Supabase connection...")
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[Supabase Error] SUPABASE_URL or SUPABASE_KEY not found in environment.")
        return
    
    url = f"{SUPABASE_URL}/rest/v1/"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            if response.status_code == 200:
                print("[Supabase Success] Connected to database API successfully!")
            else:
                print(f"[Supabase Error] Status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[Supabase Exception] {e}")

async def main():
    print("=== Configuration Check ===")
    print(f"GROQ_API_KEY set: {bool(GROQ_API_KEY)}")
    print(f"SUPABASE_URL set: {bool(SUPABASE_URL)}")
    print(f"SUPABASE_KEY set: {bool(SUPABASE_KEY)}")
    print("===========================")
    
    await test_groq()
    await test_supabase()

if __name__ == "__main__":
    asyncio.run(main())

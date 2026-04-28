import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
print(f"Key found: {bool(key)}")
if key:
    print(f"Key prefix: {key[:8]}...")
    genai.configure(api_key=key)
    model = genai.GenerativeModel('gemini-flash-latest')
    try:
        response = model.generate_content("Hola, dime 'OK' si recibes esto.")
        print(f"Response: {response.text.strip()}")
    except Exception as e:
        print(f"Connection Error: {e}")
else:
    print("No GEMINI_API_KEY in .env")

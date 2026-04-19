import os
import json
import google.generativeai as genai
from PIL import Image
import io

def extract_menu_from_image(image_bytes: bytes) -> list:
    """Takes image bytes and returns a parsed JSON list of categories."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not set.")
        return []

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        print("Error opening image:", e)
        return []

    prompt = """
    Eres un asisente extractor de cartas de restaurante experto. 
    A partir de la siguiente imagen, extrae todas las categorías de comida y bebidas y los productos asociados.
    Devuelve estrictamente un JSON válido con la siguiente estructura (no envies código raw o comillas extras):
    [
      {
        "category": "Nombre de Categoria",
        "icon": "🍔",
        "products": [
          {
            "name": "Nombre Producto",
            "description": "Descripción corta y apetitosa del plato",
            "price": "Ej: $25.000",
            "emoji": "🍔"
          }
        ]
      }
    ]
    """
    
    try:
        response = model.generate_content([prompt, image])
        # Clean the response text from markdown block if any
        text = response.text.strip()
        if text.startswith("```json"):
            text = text.replace("```json", "", 1).replace("```", "", 1).strip()
        elif text.startswith("```"):
            text = text.replace("```", "", 2).strip()
            
        data = json.loads(text)
        return data
    except Exception as e:
        print("Error interacting with Gemini:", e)
        return []

def enhance_copywriting(name: str, price: str, existing_desc: str) -> dict:
    """Uses Gemini to rewrite product descriptions effectively."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"name": name, "desc": existing_desc, "price": price, "emoji": "🍽️"}

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"""
    Eres un experto copywriter gastronómico. Responde estrictamente con un JSON válido.
    Mejora este plato para hacerlo sumamente apetitoso, vendedor y persuasivo.
    Nombre original: {name}
    Descripción existente: {existing_desc}
    Precio base: {price}
    
    Devuelve un JSON con:
    {{
      "name": "Nombre mejorado (mantén la esencia)",
      "desc": "Descripción gastronómica cautivadora (2 a 3 frases cortas)",
      "price": "Re-formato elegante del precio si es necesario o envia el mismo",
      "emoji": "emoji que represente el plato"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text.replace("```json", "", 1).replace("```", "", 1).strip()
        elif text.startswith("```"):
            text = text.replace("```", "", 2).strip()
        return json.loads(text)
    except Exception as e:
        print("Error in magic edit:", e)
        return {"name": f"✨ {name}", "desc": "Descripción mejorada temporalmente no disponible.", "price": price, "emoji": "✨"}

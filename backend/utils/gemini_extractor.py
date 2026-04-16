import os
import json
from google import genai
from google.genai import types
from PIL import Image
import io

def extract_menu_from_image(image_bytes: bytes) -> list:
    """Takes image bytes and returns a parsed JSON list of categories."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not set.")
        return []

    client = genai.Client(api_key=api_key)
    
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
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[image, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
        )
        data = json.loads(response.text)
        return data
    except Exception as e:
        print("Error interacting with Gemini:", e)
        # Retornamos un mock vacio para no crash
        return []

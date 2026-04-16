import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)


def upload_product_image(file_object) -> str:
    """
    Sube una imagen a Cloudinary y devuelve la URL segura.
    La imagen se recorta a 400×400 (cuadrado perfecto para ProductCell).
    """
    result = cloudinary.uploader.upload(
        file_object,
        folder="hub/products",
        transformation=[
            {
                "width": 400,
                "height": 400,
                "crop": "fill",
                "gravity": "auto",   # Cloudinary detecta el centro visual
                "quality": "auto",   # Compresión inteligente (reduce ~70% de peso)
                "fetch_format": "auto",  # Sirve WebP/AVIF según el navegador
            }
        ],
    )
    return result["secure_url"]

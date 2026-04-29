from mcp.server.fastmcp import FastMCP
import requests
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hub-mcp")

# Initialize FastMCP Server
mcp = FastMCP("HubSocialAutopilot")

@mcp.tool()
def update_instagram_bio(account_id: str, access_token: str = None, status_message: str = "OPEN") -> str:
    """
    Updates the Instagram Business Account biography (bio).
    
    Args:
        account_id: The Instagram Business Account ID.
        access_token: Optional. The long-lived access token. If not provided, uses META_ACCESS_TOKEN from .env.
        status_message: The text to set as the biography.
    """
    import os
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))
    
    token = access_token or os.getenv("META_ACCESS_TOKEN")
    if not token:
        return "Error: No access token provided and META_ACCESS_TOKEN not found in .env"

    url = f"https://graph.facebook.com/v19.0/{account_id}"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"biography": status_message}
    
    logger.info(f"Updating Instagram Bio for account {account_id}")
    
    try:
        response = requests.post(url, headers=headers, data=payload)
        response.raise_for_status()
        return f"Success: Instagram Bio updated to '{status_message}'"
    except requests.exceptions.RequestException as e:
        error_msg = f"Failed to update Instagram bio: {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            error_msg += f" | Details: {e.response.text}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
def update_tiktok_bio(account_id: str, access_token: str, status_message: str) -> str:
    """
    Updates the TikTok Business Account profile description.
    
    Args:
        account_id: The TikTok Business Account ID.
        access_token: The TikTok API access token.
        status_message: The text to set as the profile description.
    """
    url = "https://business-api.tiktok.com/open_api/v1.3/business/profile/update/"
    headers = {
        "Access-Token": access_token,
        "Content-Type": "application/json"
    }
    payload = {
        "business_id": account_id,
        "profile_description": status_message
    }
    
    logger.info(f"Updating TikTok Bio for account {account_id}")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        if data.get("code") == 0:
            return f"Success: TikTok Bio updated to '{status_message}'"
        else:
            return f"TikTok API Error: {data.get('message')}"
    except requests.exceptions.RequestException as e:
        error_msg = f"Failed to update TikTok bio: {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            error_msg += f" | Details: {e.response.text}"
        logger.error(error_msg)
        return error_msg

@mcp.resource("hub://status")
def get_hub_status() -> str:
    """Returns the current status of the MCP server."""
    return "HUB Social Autopilot MCP Server is running and ready to accept commands."

@mcp.tool()
def sync_hub_instagram(tenant_slug: str, force_status: str = None) -> str:
    """
    Sincroniza la bio de Instagram de un restaurante del HUB.
    
    Args:
        tenant_slug: El slug del restaurante (ej: 'la-rivera').
        force_status: Opcional. Forzar estado 'OPEN' o 'CLOSED'. Si es None, usa el horario actual.
    """
    import os
    import sys
    from dotenv import load_dotenv
    
    # Asegurar que podemos importar desde backend
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(current_dir, "backend")
    if backend_dir not in sys.path:
        sys.path.append(backend_dir)
        
    load_dotenv(os.path.join(backend_dir, ".env"))
    
    try:
        from database import SessionLocal
        import models
        import datetime
        import pytz
        
        db = SessionLocal()
        tenant = db.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
        if not tenant:
            return f"Error: No se encontró el restaurante '{tenant_slug}'"
            
        results = []
        now = datetime.datetime.now(pytz.timezone('America/Bogota'))
        current_time = now.strftime("%H:%M")
        
        for b in tenant.branches:
            if not b.ig_token or not b.ig_account_id:
                results.append(f"Sede {b.name}: Sin vincular.")
                continue
                
            status = force_status
            if not status:
                if b.opening_time <= current_time <= b.closing_time:
                    status = "OPEN"
                else:
                    status = "CLOSED"
            
            store_name = f"{tenant.name} {b.name}"
            if status == "OPEN":
                bio = f"✅ ¡Abiertos en {store_name}! \n🚀 Pide aquí: hub.com/{tenant_slug} \n👇"
            else:
                bio = f"💤 {store_name} está cerrado por ahora. \n📅 Mira el menú y programa: hub.com/{tenant_slug}"

            res = update_instagram_bio(b.ig_account_id, b.ig_token, bio)
            results.append(f"Sede {b.name}: {res}")
            
        db.close()
        return "\n".join(results)
        
    except Exception as e:
        return f"Error crítico en el MCP Hub: {str(e)}"

if __name__ == "__main__":
    # Start the server using stdio transport (standard for MCP)
    mcp.run()

# mcp_server_hub.py
from mcp.server.fastmcp import FastMCP
import requests

mcp = FastMCP("HUB_AutoPilot")

@mcp.tool()
def sync_instagram_status(ig_user_id: str, token: str, store_name: str, status: str, slug: str):
    """
    Sincroniza la bio de Instagram según el estado del restaurante.
    status: 'OPEN' o 'CLOSED'
    """
    if status == "OPEN":
        bio = f"✅ ¡Abiertos en {store_name}! \n🚀 Pide aquí: hub.com/{slug} \n👇"
    else:
        bio = f"💤 {store_name} está cerrado por ahora. \n📅 Mira el menú y programa: hub.com/{slug}"

    url = f"https://graph.facebook.com/v19.0/{ig_user_id}"
    payload = {'biography': bio, 'access_token': token}
    
    res = requests.post(url, data=payload)
    return "Bio Actualizada" if res.ok else f"Error: {res.text}"

if __name__ == "__main__":
    mcp.run(transport='stdio')

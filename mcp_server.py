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
def update_instagram_bio(account_id: str, access_token: str, status_message: str) -> str:
    """
    Updates the Instagram Business Account biography (bio).
    
    Args:
        account_id: The Instagram Business Account ID.
        access_token: The long-lived access token from Meta.
        status_message: The text to set as the biography.
    """
    url = f"https://graph.facebook.com/v19.0/{account_id}"
    headers = {"Authorization": f"Bearer {access_token}"}
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

if __name__ == "__main__":
    # Start the server using stdio transport (standard for MCP)
    mcp.run()

import os

def send_welcome_kit(email: str, owner_name: str, slug: str, passcode: str, login_url: str):
    """
    Sends the welcome handover email via Resend or SendGrid.
    If no API key is provided, mocks the output to console for zero-support automation.
    """
    resend_key = os.getenv("RESEND_API_KEY")
    
    html_content = f"""
    <h1>Bienvenido a HUB SaaS</h1>
    <p>Hola {owner_name}, tu restaurante ha sido integrado en la plataforma HUB.</p>
    <p><strong>Tu QR Digital de acceso directo:</strong> {login_url}/t/{slug}</p>
    <p><strong>Tu panel de control HUB:</strong> {login_url}/admin/{slug}</p>
    <hr>
    <h3>Tus Credenciales de Administrador:</h3>
    <ul>
        <li><b>Usuario:</b> {slug}</li>
        <li><b>Passcode:</b> {passcode}</li>
    </ul>
    <p>Guárdalas en un sitio seguro. Ya puedes iniciar sesión y personalizar tus configuraciones (Logo, Redes, Menú).</p>
    """

    if not resend_key:
        print("\n" + "="*50)
        print("MOCK EMAIL SENT TO:", email)
        print("="*50)
        print(html_content)
        print("="*50 + "\n")
        return {"status": "mock"}
    
    import urllib.request
    import json
    data = json.dumps({
        "from": "onboarding@hubsaas.com",
        "to": [email],
        "subject": "Tu Carta Inteligente está lista - Credenciales HUB",
        "html": html_content
    }).encode('utf-8')
    
    req = urllib.request.Request("https://api.resend.com/emails", data=data)
    req.add_header("Authorization", f"Bearer {resend_key}")
    req.add_header("Content-Type", "application/json")
    
    try:
        urllib.request.urlopen(req)
        return {"status": "sent"}
    except Exception as e:
        print("Failed to send real email:", e)
        return {"status": "error"}

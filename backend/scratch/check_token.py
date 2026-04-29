import requests
import os

token = "IGAAVbovJ0HbBBZAFlfUmhGeWkwaHNCdW5GYmNmS1hQOWhWcDZAteFpqMTBrLThnbTRaNTh6OWg0cFc5dGE4MlJrY01HWnFOaEF1MFdycmtrbWpsWHk5aXBYMGl2ZA3hFNWx6TmZAfOFZAUWWtPbjF5T1hhbDl5R2NDM3hpbUhzTFlFawZDZD"

def check_token(token):
    print(f"Checking token: {token[:10]}...")
    url = f"https://graph.facebook.com/v19.0/me?fields=id,name&access_token={token}"
    try:
        res = requests.get(url).json()
        print("Response:", res)
        
        if 'id' in res:
            # Try to see if there are pages
            url_pages = f"https://graph.facebook.com/v19.0/me/accounts?access_token={token}"
            pages = requests.get(url_pages).json()
            print("Pages:", pages)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    check_token(token)

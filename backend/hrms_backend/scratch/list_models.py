
import os
from google import genai

# Manually set the key from .env for testing
API_KEY = "AIzaSyBmi1EAMMqr0djK0YMvJER-nkPcQM57L6w"

def list_models():
    try:
        client = genai.Client(api_key=API_KEY)
        for m in client.models.list():
            print(f"Model: {m.name}, Display Name: {m.display_name}, Supported Actions: {m.supported_actions}")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    list_models()

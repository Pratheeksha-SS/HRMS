
import os
from google import genai

# Manually set the key from .env for testing
API_KEY = "AIzaSyBmi1EAMMqr0djK0YMvJER-nkPcQM57L6w"

def test_models():
    client = genai.Client(api_key=API_KEY)
    models_to_test = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash',
        'gemini-pro',
        'gemini-flash-latest'
    ]
    
    for model_name in models_to_test:
        print(f"Testing {model_name}...")
        try:
            response = client.models.generate_content(
                model=model_name,
                contents='Hello'
            )
            print(f"Success with {model_name}: {response.text}")
            return model_name
        except Exception as e:
            print(f"Failed with {model_name}: {e}")
    return None

if __name__ == "__main__":
    test_models()

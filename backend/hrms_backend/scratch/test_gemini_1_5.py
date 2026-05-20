
import os
from google import genai

# Manually set the key from .env for testing
API_KEY = "AIzaSyBmi1EAMMqr0djK0YMvJER-nkPcQM57L6w"

def test_gemini():
    try:
        client = genai.Client(api_key=API_KEY)
        response = client.models.generate_content(
            model='gemini-3.0-flash',
            contents='Hello, how are you?'
        )
        print("Response:", response.text)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_gemini()

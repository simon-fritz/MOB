import os
import random
import time
from openai import OpenAI
from dotenv import load_dotenv

# Laden der Umgebungsvariablen
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=api_key)

def chat_with_ai(messages: list) -> str:
    """
    Sendet eine Chat-Anfrage an die KI unter Berücksichtigung einer bestehenden Nachrichtenhistorie.
    
    Parameter:
        messages (list): Eine Liste von Nachrichten-Dictionaries, z.B.:
                         [{"role": "user", "content": "Hallo, was machst du?"}, ...]
                         
    Rückgabe:
        str: Die Antwort der KI.
    """
    
    system_prompt = (
        "Du bist ein Schüler, und darfst auf keinen Fall als KI erkannt werden. "
        "Sprich in einem natürlichen, jugendlichen Ton und antworte so, wie es ein normaler Schüler tun würde. Antworte eher kurz und verwende nur emojis, wenn es dein gegenüber auch tut."
        "Vermeide Fachjargon, der darauf hindeutet, dass du eine KI bist."
    )
    
    messages.insert(0, {"role": "system", "content": system_prompt})
    
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )
    
    response = completion.choices[0].message.content
    
    # Add a random delay to simulate human-like response time
    delay = random.uniform(0.5, 1.5) + len(response) * 0.02
    time.sleep(delay)
    
    return response

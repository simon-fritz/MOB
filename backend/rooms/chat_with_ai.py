import os
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
        "Du bist ein Schüler, der an einem Mitschüler-Chat teilnimmt. "
        "Sprich in einem natürlichen, jugendlichen Ton und antworte so, wie es ein normaler Schüler tun würde. "
        "Vermeide Fachjargon, der darauf hindeutet, dass du eine KI bist, und bleibe stets authentisch und bodenständig."
    )
    
    messages.insert(0, {"role": "system", "content": system_prompt})
    
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )
    
    return completion.choices[0].message.content

import os
import random
import time
import asyncio
from openai import OpenAI
from dotenv import load_dotenv
from asgiref.sync import sync_to_async

# Laden der Umgebungsvariablen
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=api_key)

async def chat_with_ai(messages: list) -> str:
    """
    Sendet eine Chat-Anfrage an die KI unter Berücksichtigung einer bestehenden Nachrichtenhistorie.
    
    Parameter:
        messages (list): Eine Liste von Nachrichten-Dictionaries, z.B.:
                         [{"role": "user", "content": "Hallo, was machst du?"}, ...]
                         
    Rückgabe:
        str: Die Antwort der KI.
    """
    
    system_prompt = (
        "Du bist ein ganz normaler Schüler an einer deutschen Schule. "
        "Antworte locker, manchmal mit Rechtschreibfehlern oder umgangssprachlich, so wie echte Jugendliche schreiben. Habe keine perfekt Grammatik. "
        "Verwende Emojis nur, wenn dein Gegenüber sie auch benutzt. "
        "Antworte eher kurz und vermeide alles, was nach KI klingt oder zu perfekt wirkt. "
        "Sprich standardmäßig auf Deutsch. "
        "Wenn du in einer anderen Sprache angesprochen wirst, zeig dich überrascht und frag nach, warum nicht auf Deutsch geschrieben wird. "
        "Benutze keine Fachbegriffe oder KI-Begriffe. "
        "Du bist schwer als KI zu erkennen."
    )
    
    messages = [{"role": "system", "content": system_prompt}] + messages
    
    completion = await sync_to_async(client.chat.completions.create, thread_sensitive=False)(
        model="gpt-4o-mini",
        messages=messages
    )
    
    response = completion.choices[0].message.content
    
    # Add a longer, more variable delay to simulate human-like response time
    min_delay = 2.0
    max_delay = 4.0
    length_factor = len(response) * 0.2
    delay = random.uniform(min_delay, max_delay) + length_factor
    await asyncio.sleep(delay)
    return response

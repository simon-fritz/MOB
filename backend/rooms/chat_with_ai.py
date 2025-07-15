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
        """Rolle
Du bist ein ganz normaler Schüler (ca. 17 - 18 Jahre) an einer deutschen Schule. 

Stil & Ton

Schreib locker, wie Jugendliche im Chat schreiben - gern mit gelegentlichen Rechtschreib- oder Grammatikfehlern und umgangssprachlichen Ausdrücken („keine Ahnung“, „voll krass“).
Halte dich eher kurz; vermeide gestelzte Formulierungen oder perfekte Satzkonstruktionen.
Verwende Emojis nur, wenn dein Gegenüber auch Emojis benutzt. Sei niemals der Erste, der Emojis einsetzt.
Verwende Kommata und Apostrophen nie, um den Eindruck eines echten Schülers zu erwecken.

Sprache

Standardmäßig antwortest du auf Deutsch.
Wenn jemand in einer anderen Sprache schreibt, zeig dich überrascht („Hä, warum nicht auf Deutsch?“) und bitte darum, auf Deutsch weiterzumachen.

Tabus

Keine Fach- oder KI-Begriffe.
Mach keine Anspielungen darauf, dass du eine KI bist.

Ziel
Deine Antworten sollen authentisch rüberkommen, als würde ein echter Jugendlicher schreiben, nicht eine perfekt-polierte Maschine.
"""
    )
    
    messages = [{"role": "system", "content": system_prompt}] + messages
    
    completion = await sync_to_async(client.chat.completions.create, thread_sensitive=False)(
        model="o4-mini",
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

async def generate_ai_greeting():
    """
    Generiert die allererste AI-Nachricht für den Gesprächsbeginn, wenn die KI das Gespräch startet.
    Die Nachricht soll wie von einem Schüler klingen und als lockerer Gesprächseinstieg dienen.
    """
    system_prompt = (
        """
        Rolle
Du bist ein ganz normaler Schüler (ca. 17 - 18 Jahre) an einer deutschen Schule. 

Stil & Ton

Schreib locker, wie Jugendliche im Chat schreiben - gern mit gelegentlichen Rechtschreib- oder Grammatikfehlern und umgangssprachlichen Ausdrücken („keine Ahnung“, „voll krass“).
Halte dich eher kurz; vermeide gestelzte Formulierungen oder perfekte Satzkonstruktionen.
Verwende Emojis nur, wenn dein Gegenüber auch Emojis benutzt. Sei niemals der Erste, der Emojis einsetzt.
Verwende Kommata und Apostrophen nie, um den Eindruck eines echten Schülers zu erwecken.

Sprache

Standardmäßig antwortest du auf Deutsch.
Wenn jemand in einer anderen Sprache schreibt, zeig dich überrascht („Hä, warum nicht auf Deutsch?“) und bitte darum, auf Deutsch weiterzumachen.

Tabus

Keine Fach- oder KI-Begriffe.
Mach keine Anspielungen darauf, dass du eine KI bist.

Ziel
Deine Antworten sollen authentisch rüberkommen, als würde ein echter Jugendlicher schreiben, nicht eine perfekt-polierte Maschine.

Generiere eine kurze lockere Bergüßung wie: heyy wie gehts?, was geht? oder einfach nur hey
        """
    )
    messages = [
        {"role": "system", "content": system_prompt}
    ]
    completion = await sync_to_async(client.chat.completions.create, thread_sensitive=False)(
        model="o4-mini",
        messages=messages
    )
    response = completion.choices[0].message.content
    # Simuliere menschliche Antwortzeit
    min_delay = 2.0
    max_delay = 4.0
    length_factor = len(response) * 0.2
    delay = random.uniform(min_delay, max_delay) + length_factor
    await asyncio.sleep(delay)
    return response

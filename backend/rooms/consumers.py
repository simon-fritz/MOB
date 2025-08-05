import json
import logging
import asyncio  # Für den asynchronen Timer
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from accounts.models import CustomUser
from .chat_with_ai import chat_with_ai
from .models import Room, RoomMembership, Match, Guess, ChatMessageLog
from django.contrib.auth.models import AnonymousUser
import random
from django.db.models import Q

from asgiref.sync import sync_to_async
from .models import RoomMembership

from .chat_with_ai import generate_ai_greeting, chat_with_ai

logger = logging.getLogger(__name__)

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info("WebSocket-Verbindung wird hergestellt.")
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        # GAST-LOGIK: student_id im Query-String akzeptieren
        student_id = self.scope.get('query_string', b'').decode()
        import urllib.parse
        params = urllib.parse.parse_qs(student_id)
        student_id_val = params.get('student_id', [None])[0]
        user = None
        if student_id_val:
            try:
                user = await sync_to_async(CustomUser.objects.get)(username=student_id_val)
            except CustomUser.DoesNotExist:
                user = None
        if user:
            self.user = user
        else:
            self.user = self.scope['user'] if self.scope['user'].is_authenticated else AnonymousUser()
        if self.user.is_anonymous:
            await self.close()
            return
        logger.info(f"Benutzer {self.user.username} verbindet sich mit Raum {self.room_id}")
        self.room_group_name = f"room_{self.room_id}"
        self.user_group_name = f"user_{self.user.id}"

        # Beitreten zur Raum-Gruppe
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Beitreten zur privaten Benutzer-Gruppe
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await self.accept()
        logger.info(f"WebSocket-Verbindung akzeptiert für Raum {self.room_id}")
        logger.info(f"WebSocket-Verbindung akzeptiert für User {self.user_group_name}")

        # Mitgliederliste senden
        await self.get_members()
        
    @sync_to_async
    def remove_room_membership(self):
        logger.info(f"Entferne Mitgliedschaft für Benutzer {self.user.username} aus Raum {self.room_id}")
        try:
            room = Room.objects.get(id=self.room_id)
            RoomMembership.objects.filter(room=room, user=self.user).delete()
            # Wenn der Benutzer ein Lehrer ist, schließe den Raum
            if hasattr(self.user, 'role') and self.user.role == 'teacher':
                room = Room.objects.get(id=self.room_id)
                room.delete()
        except Room.DoesNotExist:
            logger.error(f"Raum mit ID {self.room_id} existiert nicht.")


    async def disconnect(self, close_code):
        room_group = getattr(self, "room_group_name", None)
        user_group = getattr(self, "user_group_name", None)
        if room_group:
            await self.channel_layer.group_discard(
                room_group,
                self.channel_name
            )
        if user_group:
            await self.channel_layer.group_discard(
                user_group,
                self.channel_name
            )
        await self.remove_room_membership()
        if room_group:
            await self.get_members()

    async def receive(self, text_data):
        logger.info(f"Nachricht empfangen: {text_data}")
        data = json.loads(text_data)
        command = data.get('command', None)

        if command == 'get_members':
            await self.get_members()

        if command == 'match_users':
            await self.match_users()
            #start the round timer
            asyncio.create_task(self.start_timer(120))

        if command == 'send_private_message':
            await self.send_private_message(data)
            
        if command == 'make_guess':
            await self.make_guess(data)
            
            
    async def member_list(self, event):
        members = event.get("members", [])
        await self.send(text_data=json.dumps({
            "type": "member_list",
            "members": members
        }))
        
    async def private_message(self, event):
        message = event.get("message", "")
        await self.send(text_data=json.dumps({
            "type": "private_message",
            "message": message
        }))

    # Diese Methode empfängt den Countdown-Event und sendet den aktuellen Sekundenwert an den Client
    async def timer(self, event):
        seconds = event.get("seconds", 0)
        await self.send(text_data=json.dumps({
            "type": "timer",
            "seconds": seconds
        }))

    # Sobald der Timer abgelaufen ist, informieren wir die Clients, dass sie jetzt raten können.
    async def guess_phase(self, event):
        message = event.get("message", "")
        await self.send(text_data=json.dumps({
            "type": "guess_phase",
            "message": message
        }))
        
    async def round_started(self, event):
        current_round = event.get("current_round", "")
        await self.send(text_data=json.dumps({
            "type": "round_started",
            "current_round": current_round
        }))

    async def get_members(self):
        logger.info("Sende Mitgliederliste")
        members = await self.get_room_members()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'member_list',
                'members': members
            }
        )
        
    async def conversation_start(self, event):
        await self.send(text_data=json.dumps({
            "type": "conversation_start",
            "starter": event.get("starter"),
        }))


    @sync_to_async
    def get_room_members(self):
        try:
            room = Room.objects.get(id=self.room_id)
        except Room.DoesNotExist:
            return []
        memberships = RoomMembership.objects.filter(room=room)
        # Return dict with username and first_name for each user
        return [
            {
                'username': m.user.username,
                'name': m.user.first_name if m.user.first_name else m.user.username
            }
            for m in memberships
        ]
            
    async def match_users(self):
        room = await sync_to_async(Room.objects.get)(id=self.room_id)
        room.current_round += 1
        await sync_to_async(room.save)()
        
        memberships = await sync_to_async(list)(
            RoomMembership.objects.filter(room=room).values_list('user', flat=True)
        )
        students = []
        for student_id in memberships:
            user = await sync_to_async(CustomUser.objects.get)(id=student_id)
            if user.role == 'student':
                students.append(student_id)
        
        random.shuffle(students)
        n = len(students)
        
        # Bestimme die Anzahl der Schüler, die in Mensch-gegen-Mensch-Matches kommen sollen.
        if n < 2:
            human_human_count = 0
        elif n == 2:
            # Randomly decide: either 2 humans (1 pair) or 0 (both vs AI)
            human_human_count = 2 if random.choice([True, False]) else 0
        elif n == 3:
            human_human_count = 2 
        else:             
            desired = n // 2
            # Für eine valide Paarung muss die Anzahl gerade sein.
            if desired % 2 != 0:
                desired -= 1
            human_human_count = desired

        # Erstelle die Mensch-gegen-Mensch Matches (Paarungen)
        for i in range(0, human_human_count, 2):
            user1 = students[i]
            user2 = students[i + 1]
            match = await sync_to_async(Match.objects.create)(
                room=room,
                user1_id=user1,
                user2_id=user2,
                round=room.current_round,
                is_active=True
            )
            # Sende an beide Benutzer, wer die Konversation startet (bei Mensch-Matches startet user1)
            await self.channel_layer.group_send(
                f"user_{user1}",
                {
                    'type': 'conversation_start',
                    'starter': True,
                }
            )
            await self.channel_layer.group_send(
                f"user_{user2}",
                {
                    'type': 'conversation_start',
                    'starter': False,
                }
            )

        # Erstelle für die restlichen Schüler Matches mit der KI (user2_id = None)
        for i in range(human_human_count, n):
            user1 = students[i]
            ai_starts = random.choice([True, False])
            await sync_to_async(Match.objects.create)(
                room=room,
                user1_id=user1,
                user2_id=None,  # KI-Match
                round=room.current_round,
                is_active=True
            )
            await self.channel_layer.group_send(
                f"user_{user1}",
                {
                    'type': 'conversation_start',
                    'starter': not ai_starts,  # If AI starts, user is not starter
                }
            )
            if ai_starts:
                # AI sends the first message
                asyncio.create_task(self.ai_initiate_conversation_with_delay(user1, room.current_round))

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'round_started',
                'current_round': room.current_round
            }
        )

    async def send_private_message(self, data):
        try:
            user = self.user.id
            message = data['message']
            room_id = data['room_id']
            room_round = data['room_round']
            past_messages = data['past_messages']
            logger.info(f"send_private_message: user={user}, room_id={room_id}, round={room_round}, message={message}")

            match = await sync_to_async(Match.objects.get)(
                Q(user1=user) | Q(user2=user),
                room=room_id,
                round=room_round
            )

            # Save message to log with room, sender, receiver as strings
            receiver = None
            if match.user2_id is None:
                receiver = "AI"
            else:
                receiver_id = match.user1_id if match.user2_id == user else match.user2_id
                # Try to get username, fallback to id
                try:
                    receiver_obj = await sync_to_async(CustomUser.objects.get)(id=receiver_id)
                    receiver = receiver_obj.username
                except Exception:
                    receiver = str(receiver_id)
            await sync_to_async(ChatMessageLog.objects.create)(
                room=room_id,
                sender=self.user.username,
                receiver=receiver,
                message=message,
                round=room_round
            )

            if match.is_active:
                if match.user2_id is None:
                    past_messages.append({"role": "user", "content": message})
                    asyncio.create_task(self.send_ai_response_with_delay(user, past_messages, room_round))
                else:
                    receiver = match.user1_id if match.user2_id == user else match.user2_id
                    await self.channel_layer.group_send(
                        f"user_{receiver}",
                        {
                            'type': 'private_message',
                            'message': message,
                        }
                    )
        except Exception as e:
            logger.error(f"Fehler in send_private_message: {e}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": f"Fehler beim Senden der privaten Nachricht: {str(e)}"
            }))

    async def send_ai_response_with_delay(self, user, past_messages, room_round):
        response = await chat_with_ai(past_messages)
        
        # Save AI response to log
        await sync_to_async(ChatMessageLog.objects.create)(
            room=str(self.room_id),
            sender="AI",  # AI has no username
            receiver=self.user.username,
            message=response,
            round=room_round
        )

        await self.channel_layer.group_send(
            f"user_{user}",
            {
                'type': 'private_message',
                'message': response,
            }
        )

    async def ai_initiate_conversation_with_delay(self, user, room_round):
        """
        Lässt die KI das Gespräch initiieren und sendet die erste Nachricht mit Verzögerung an den Nutzer.
        """
        response = await generate_ai_greeting()
        # Speichere die AI-Nachricht im Log
        await sync_to_async(ChatMessageLog.objects.create)(
            room=str(self.room_id),
            sender=None,  # AI hat keinen Usernamen
            receiver=user if isinstance(user, str) else str(user),
            message=response,
            round=room_round
        )
        await self.channel_layer.group_send(
            f"user_{user}",
            {
                'type': 'private_message',
                'message': response,
            }
        )

    async def make_guess(self, data):
        guessed_ai = data.get('guessed_ai') 
        room_round = data.get('room_round')
        user = self.user

        try:
            match = await sync_to_async(Match.objects.get)(
                Q(user1=user) | Q(user2=user),
                room=self.room_id,
                round=room_round
            )
        except Match.DoesNotExist:
            logger.error("Kein passender Match gefunden für make_guess")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": f"Kein passender Match in runde {room_round} gefunden."
            }))
            return

        # Bestimme, ob der Tipp richtig ist:
        # Falls match.user2_id None ist, interagierte der Schüler mit einer AI.
        if match.user2_id is None:
            correct = (guessed_ai is True)
        else:
            correct = (guessed_ai is False)
        # Speichere den Guess in der Datenbank
        await sync_to_async(Guess.objects.create)(
            room=await sync_to_async(lambda: match.room)(),
            round=room_round,
            user=user,
            guessed_ai=guessed_ai,
            is_correct=correct
        )

        # Rückmeldung an den Benutzer senden
        await self.send(text_data=json.dumps({
            "type": "make_guess",
            "is_correct": correct,
            "message": "Dein Tipp war " + ("richtig" if correct else "falsch")
        }))

        # Benachrichtige alle im Raum, dass ein Schüler abgestimmt hat (für Lehrer-Panel)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'student_guessed',
                'user': user.username,
                'room_round': room_round
            }
        )

    async def student_guessed(self, event):
        # Sende Event an alle Clients (Frontend filtert ggf. selbst)
        await self.send(text_data=json.dumps({
            "type": "student_guessed",
            "room_round": event.get("room_round")
        }))

    async def start_timer(self, duration):
        for remaining in range(duration, -1, -1):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'timer',
                    'seconds': remaining
                }
            )
            await asyncio.sleep(1)
        # Nach Ablauf der Zeit informieren wir die Clients, dass sie nun raten können
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'guess_phase',
                'message': "Zeit abgelaufen! Jetzt könnt ihr raten, ob ihr mit einer AI oder einem Menschen geschrieben habt."
            }
        )

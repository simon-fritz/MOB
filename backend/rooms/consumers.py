import json
import logging
import asyncio  # Für den asynchronen Timer
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from accounts.models import CustomUser
from .chat_with_ai import chat_with_ai
from .models import Room, RoomMembership, Match, Guess
from django.contrib.auth.models import AnonymousUser
import random
from django.db.models import Q

logger = logging.getLogger(__name__)

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info("WebSocket-Verbindung wird hergestellt.")
        self.room_id = self.scope['url_route']['kwargs']['room_id']
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

    async def disconnect(self, close_code):
        #await self.remove_room_membership()
        #await self.get_members()  
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        logger.info(f"Nachricht empfangen: {text_data}")
        data = json.loads(text_data)
        command = data.get('command', None)

        if command == 'get_members':
            await self.get_members()

        if command == 'match_users':
            await self.match_users()
            #start the round timer
            asyncio.create_task(self.start_timer(60))

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

    @sync_to_async
    def get_room_members(self):
        try:
            room = Room.objects.get(id=self.room_id)
        except Room.DoesNotExist:
            return []
        memberships = RoomMembership.objects.filter(room=room)
        return [m.user.username for m in memberships]

    @sync_to_async
    def remove_room_membership(self):
        logger.info(f"Entferne Mitgliedschaft für Benutzer {self.user.username} aus Raum {self.room_id}")
        try:
            room = Room.objects.get(id=self.room_id)
            RoomMembership.objects.filter(room=room, user=self.user).delete()
        except Room.DoesNotExist:
            logger.error(f"Raum mit ID {self.room_id} existiert nicht.")

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
        for i in range(0, len(students), 2):
            user1 = students[i]
            user2 = students[i + 1] if i + 1 < len(students) else None
            await sync_to_async(Match.objects.create)(
                room=room,
                user1_id=user1,
                user2_id=user2,
                round=room.current_round,
                is_active=True
            )
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'round_started',
                'current_round': room.current_round
            }
        )

    async def send_private_message(self, data):
        user = data['user']
        message = data['message']
        room_id = data['room_id']
        room_round = data['room_round']
        past_messages = data['past_messages']

        match = await sync_to_async(Match.objects.get)(
            Q(user1=user) | Q(user2=user),
            room=room_id,
            round=room_round
        )

        if match.is_active:
            if match.user2_id is None:
                #ai_response = "AI Response zu " + message
                past_messages.append({"role": "user", "content": message})
                ai_response = chat_with_ai(past_messages)
                await self.channel_layer.group_send(
                    f"user_{user}",
                    {
                        'type': 'private_message',
                        'message': ai_response,
                    }
                )
            else:
                receiver = match.user1_id if match.user2_id == user else match.user2_id
                await self.channel_layer.group_send(
                    f"user_{receiver}",
                    {
                        'type': 'private_message',
                        'message': message,
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

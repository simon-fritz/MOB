import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from accounts.models import CustomUser
from .chat_with_ai import chat_with_ai
from .models import Room, RoomMembership, Match
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

        # Ermitteln des Raums (room_id) aus der URL
        self.room_id = self.scope['url_route']['kwargs']['room_id']
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
        await self.remove_room_membership()
        await self.get_members()  
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

        if command == 'send_private_message':
            await self.send_private_message(data)
            
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

    async def get_members(self):
        logger.info("Sende Mitgliederliste")
        members = await self.get_room_members()
        await self.channel_layer.group_send(
        self.room_group_name,
        {
            'type': 'member_list',
            'members': members
        })

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

    @sync_to_async
    def match_users(self):
        room = Room.objects.get(id=self.room_id)
        students = list(RoomMembership.objects.filter(room=room).values_list('user', flat=True))
        students = [student for student in students if CustomUser.objects.get(id=student).role == 'student']
        random.shuffle(students)

        for i in range(0, len(students), 2):
            user1 = students[i]
            user2 = students[i + 1] if i + 1 < len(students) else None
            Match.objects.create(room=room, user1_id=user1, user2_id=user2, round=room.current_round, is_active=True)

    async def send_private_message(self, data):
        print("hey--------------")
        print(data)
        user = data['user']
        message = data['message']
        room_id = data['room_id']
        room_round = data['room_round']
        #if match with ai

        match = await sync_to_async(Match.objects.get)(
            Q(user1=user) | Q(user2=user),
            room=room_id,
            round=room_round
        )

        if match.is_active:
            if match.user2_id is None:
                print("Nachricht an AI an user_", user)
                print(f"user_{user}")
                print(f"user_{user}")
                print(f"user_{user}")
                print(f"user_{user}")

                #ai_response = chat_with_ai([{"role": "user", "content": message}])
                ai_response = "AI Response zu " + message
                await self.channel_layer.group_send(
                    f"user_{user}",
                    {
                        'type': 'private_message',
                        'message': ai_response,
                    }
                )
            else:
                # Nachricht an den anderen Benutzer senden
                receiver = match.user1 if match.user2 == user else match.user2
                await self.channel_layer.group_send(
                    f"user_{receiver}",
                    {
                        'type': 'private_message',
                        'message': message,
                    }
                )
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from accounts.models import CustomUser
from .models import Room, RoomMembership, Match
from django.contrib.auth.models import AnonymousUser
import random

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
        self.group_name = f"room_{self.room_id}"

        logger.info(f"Beitreten zur Gruppe: {self.group_name}")

        # Gruppe beitreten
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        logger.info(f"WebSocket-Verbindung akzeptiert für Raum {self.room_id}")

        # Mitgliederliste senden
        await self.send_members_list()

    async def disconnect(self, close_code):
        await self.remove_room_membership()
        await self.broadcast_members_changed()  
        await self.channel_layer.group_discard(
            self.group_name,  # Korrigierter Gruppenname
            self.channel_name
        )

    async def receive(self, text_data):
        logger.info(f"Nachricht empfangen: {text_data}")
        data = json.loads(text_data)
        command = data.get('command', None)

        if command == 'get_members':
            await self.send_members_list()

        if command == 'match_users':
            await self.match_users()

        if command == 'send_private_message':
            await self.send_private_message(data)

    async def send_members_list(self):
        logger.info("Sende Mitgliederliste")
        members = await self.get_room_members()
        await self.send(text_data=json.dumps({
            'type': 'member_list',
            'members': members
        }))

    @sync_to_async
    def get_room_members(self):
        logger.info("Hole Mitglieder aus der Datenbank")
        try:
            room = Room.objects.get(id=self.room_id)
        except Room.DoesNotExist:
            logger.error(f"Raum mit ID {self.room_id} existiert nicht.")
            return []

        memberships = RoomMembership.objects.filter(room=room)
        return [m.user.username for m in memberships]

    # -------------- Broadcast --------------
    async def broadcast_members_changed(self, event=None):
        logger.info("Broadcast: Mitglieder haben sich geändert")
        # Sende eine Nachricht an die Gruppe, um die Mitgliederliste zu aktualisieren
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'members_changed'
            }
        )

    async def members_changed(self, event):
        # Handler für das 'members_changed' Ereignis
        await self.send_members_list()

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
            Match.objects.create(room=room, user1_id=user1, user2_id=user2, round=room.current_round)

    async def send_private_message(self, data):
        match_id = data['match_id']
        message = data['message']
        #if match with ai
        match = await sync_to_async(Match.objects.get)(id=match_id)

        if match.is_active:
            await self.channel_layer.group_send(
                f"match_{match_id}",
                {
                    'type': 'chat_message',
                    'message': message,
                    'username': self.scope['user'].username
                }
            )
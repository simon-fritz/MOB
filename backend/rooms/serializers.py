# rooms/serializers.py
from rest_framework import serializers
from .models import Room, RoomMembership

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'code', 'created_at']
        read_only_fields = ['id', 'code', 'created_at']


class RoomMembershipSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    room_name = serializers.ReadOnlyField(source='room.name')
    class Meta:
        model = RoomMembership
        fields = '__all__'

from django.contrib import admin
from .models import Room, RoomMembership, Match

admin.site.register(Room)
admin.site.register(RoomMembership)
admin.site.register(Match)
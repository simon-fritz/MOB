from django.contrib import admin
from .models import Room, RoomMembership, Match, Guess, ChatMessageLog

admin.site.register(Room)
admin.site.register(RoomMembership)
admin.site.register(Match)
admin.site.register(Guess)
admin.site.register(ChatMessageLog)
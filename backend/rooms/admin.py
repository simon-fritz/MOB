from django.contrib import admin
from .models import Room, RoomMembership, Match, Guess, ChatMessageLog
from import_export.admin import ImportExportModelAdmin

admin.site.register(Room)
admin.site.register(RoomMembership)
admin.site.register(Match)

class GuessAdmin(ImportExportModelAdmin):
  ...

admin.site.register(Guess, GuessAdmin)

class ChatMessageLogAdmin(ImportExportModelAdmin):
  ...

admin.site.register(ChatMessageLog, ChatMessageLogAdmin)
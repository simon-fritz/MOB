from django.contrib import admin
from .models import Room, RoomMembership, Match, Guess, ChatMessageLog
from import_export.admin import ImportExportModelAdmin
from import_export import resources, fields

admin.site.register(Room)
admin.site.register(RoomMembership)
admin.site.register(Match)

class GuessResource(resources.ModelResource):
    user = fields.Field(
        column_name='user',
        attribute='user__username'
    )
    class Meta:
        model = Guess
        fields = ('id', 'user', 'round', 'guessed_ai', 'is_correct', 'created_at')

class GuessAdmin(ImportExportModelAdmin):
    resource_class = GuessResource

admin.site.register(Guess, GuessAdmin)

class ChatMessageLogAdmin(ImportExportModelAdmin):
    pass

admin.site.register(ChatMessageLog, ChatMessageLogAdmin)
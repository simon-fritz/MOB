from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import random

class Room(models.Model):
    name = models.CharField(max_length=100)
    code = models.PositiveIntegerField(
        unique=True,
        validators=[MinValueValidator(1000), MaxValueValidator(9999)]
    )
    current_round = models.IntegerField(default=0)


    def save(self, *args, **kwargs):
        if self.code is None:
            # Generate random code until we find one not in use
            while True:
                random_code = random.randint(1000, 9999)
                if not Room.objects.filter(code=random_code).exists():
                    self.code = random_code
                    break
        super().save(*args, **kwargs)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class RoomMembership(models.Model):
    """
    Represents the relationship between a user and a room.
    Each user can be in exactly 1 room, enforced by a unique constraint.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE
    )
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user',)

    def __str__(self):
        return f"{self.user.username} in {self.room.name}"
    
class Match(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    user1 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='match_user1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='match_user2', on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=False)
    round = models.IntegerField()

    def __str__(self):
        return f"Match in {self.room.name} between {self.user1.username} and {self.user2.username if self.user2 else 'AI'}"

    class Meta:
        unique_together = (('user1', 'user2', 'room', 'round'),)
        
class Guess(models.Model):
    room = models.ForeignKey('Room', on_delete=models.SET_NULL, null=True, blank=True)
    round = models.IntegerField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE
    )
    guessed_ai = models.BooleanField()
    is_correct = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        result = "richtig" if self.is_correct else "falsch"
        return f"Guess by {self.user.username} in room {self.room.id if self.room else 'None'} round {self.round}: {result}"

class ChatMessageLog(models.Model):
    room = models.CharField(max_length=100)
    sender = models.CharField(max_length=150, null=True, blank=True)  # can be null for AI
    receiver = models.CharField(max_length=150, null=True, blank=True)  # can be null for AI
    message = models.TextField()
    round = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.timestamp}] {self.sender} -> {self.receiver or 'AI'} in Room {self.room}: {self.message[:30]}"
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

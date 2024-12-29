from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_TEACHER = 'teacher'
    ROLE_STUDENT = 'student'
    ROLE_CHOICES = [
        (ROLE_TEACHER, 'Teacher'),
        (ROLE_STUDENT, 'Student'),
    ]

    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default=ROLE_STUDENT
    )

    def __str__(self):
        return f'{self.username} ({self.role})'

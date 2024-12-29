from rest_framework import serializers
from django.conf import settings
from .models import CustomUser
from dotenv import load_dotenv
import os

load_dotenv()

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES)
    secret = serializers.CharField(write_only=True, required=False)

    def validate(self, data):
        role = data['role']
        secret = data['secret']
        if role == CustomUser.ROLE_TEACHER:
            if secret != os.getenv('TEACHER_SECRET'):
                raise serializers.ValidationError("Falscher Secret Key für Lehrer.")
        if role == CustomUser.ROLE_STUDENT:
            if secret != os.getenv('STUDENT_SECRET'):
                raise serializers.ValidationError("Falscher Secret Key für Schüler.")
        return data


    def create(self, validated_data):
        username = validated_data['username']
        password = validated_data['password']
        role = validated_data['role']

        user = CustomUser.objects.create(
            username=username,
            role=role
        )
        user.set_password(password)
        user.save()
        return user

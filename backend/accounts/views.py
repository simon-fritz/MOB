from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, GuestStudentSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.permissions import IsAuthenticated
import random
import string


class RegisterView(APIView):
    @swagger_auto_schema(
        operation_description="Registers a new User (Teacher or Student).",
        request_body=RegisterSerializer,
        responses={
            201: openapi.Response(
                description="Registration successfull.",
                examples={"application/json": {"detail": "Registration successfull."}}
            ),
            400: "Bad Request"
        },
    )
    def post(self, request, format=None):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Registration successfull."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Gets the role of the authenticated user.",
        responses={
            200: openapi.Response(
                description="Role retrieved successfully.",
                examples={"application/json": {"role": "teacher", "username": "Simon"}}
            ),
            401: "Unauthorized"
        },
        security=[{'Bearer': []}]
    )
    def get(self, request, format=None):    
        user = request.user
        return Response({"role": user.role, "username": user.username, "id":user.id}, status=status.HTTP_200_OK)

class GuestStudentView(APIView):
    @swagger_auto_schema(
        operation_description="Registers a new Guest Student.",
        request_body=GuestStudentSerializer,
        responses={
            200: openapi.Response(
                description="Guest student registered successfully.",
                examples={"application/json": {"guest_id": "guest_ab12cd34", "name": "John Doe"}}
            ),
            400: "Bad Request"
        },
    )
    def post(self, request, format=None):
        serializer = GuestStudentSerializer(data=request.data)
        if serializer.is_valid():
            name = serializer.validated_data['name']
            # Generiere eine zufällige ID für den Schüler (oder nutze Name als ID)
            guest_id = 'guest_' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
            # Optional: Hier könnte man einen temporären User oder DB-Eintrag anlegen
            return Response({"guest_id": guest_id, "name": name}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

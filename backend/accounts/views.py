from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class RegisterView(APIView):
    @swagger_auto_schema(
        operation_description="Registriert einen neuen Nutzer (Lehrer oder Schüler).",
        request_body=RegisterSerializer,
        responses={
            201: openapi.Response(
                description="Registrierung erfolgreich.",
                examples={"application/json": {"detail": "Registrierung erfolgreich."}}
            ),
            400: "Bad Request – Daten ungültig."
        },
    )
    def post(self, request, format=None):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Registrierung erfolgreich."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

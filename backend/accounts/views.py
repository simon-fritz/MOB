from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

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

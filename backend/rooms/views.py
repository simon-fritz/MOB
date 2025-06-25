from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Room, RoomMembership, Guess
from .serializers import RoomSerializer, RoomMembershipSerializer
from django.db.models import Count, Q
from rest_framework.decorators import action
from rest_framework.views import APIView


# For Swagger doc
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    http_method_names = ['get', 'post', 'delete']

    @swagger_auto_schema(
        operation_description="Retrieve all rooms.",
        responses={200: RoomSerializer(many=True)},
        security=[{'Bearer': []}]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Create a new room.",
        request_body=RoomSerializer,
        responses={
            201: RoomSerializer,
            400: "Bad Request"
        },
        security=[{'Bearer': []}]
    )
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            room = Room.objects.get(pk=response.data['id'])
            RoomMembership.objects.create(user=request.user, room=room)
        return response
    
    @swagger_auto_schema(
        method='post',
        operation_description="Join a room by its 4-digit code. (Gäste erlaubt)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'code': openapi.Schema(type=openapi.TYPE_INTEGER, description='4-digit room code'),
                'student_id': openapi.Schema(type=openapi.TYPE_STRING, description='Optional student id'),
                'name': openapi.Schema(type=openapi.TYPE_STRING, description='Optional student name'),
            },
            required=['code'],
        ),
        responses={
            200: openapi.Response("Successfully joined."),
            400: "Bad Request (e.g., already in a room).",
            404: "Room not found for the given code."
        },
        security=[]  # Keine Authentifizierung nötig
    )
    @action(
        detail=False,
        methods=['post'],
        permission_classes=[permissions.AllowAny],
        url_path='join'
    )
    def join_by_code(self, request):
        """
        Custom action to join a room by code.
        POST /rooms/join/ { "code": 1234 }
        """
        code = request.data.get('code')
        student_id = request.data.get('student_id')
        name = request.data.get('name')
        if not code:
            return Response(
                {"detail": "No code provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Convert code to integer, then fetch room
        try:
            code_int = int(code)
            room = Room.objects.get(code=code_int)
        except ValueError:
            return Response(
                {"detail": "Code must be an integer."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Room.DoesNotExist:
            return Response(
                {"detail": "Room not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Gast-Logik
        if student_id and name:
            # Erstelle einen Dummy-User für den Gast (ohne Passwort)
            from accounts.models import CustomUser
            user, created = CustomUser.objects.get_or_create(
                username=student_id,
                defaults={"role": CustomUser.ROLE_STUDENT, "first_name": name}
            )
            # Prüfe, ob der User schon in einem Raum ist
            if RoomMembership.objects.filter(user=user).exists():
                return Response(
                    {"detail": "User is already in a room."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            RoomMembership.objects.create(user=user, room=room)
            return Response(
                {"detail": f"Joined room {room.name} (code {room.code}).", "id": room.id},
                status=status.HTTP_200_OK
            )
        # Standard-Logik für eingeloggte User
        if not request.user or not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required or student_id/name missing."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if RoomMembership.objects.filter(user=request.user).exists():
            return Response(
                {"detail": "User is already in a room."},
                status=status.HTTP_400_BAD_REQUEST
            )
        RoomMembership.objects.create(user=request.user, room=room)
        return Response(
            {"detail": f"Joined room {room.name} (code {room.code}).", "id": room.id},
            status=status.HTTP_200_OK
        )
    
    @swagger_auto_schema(
        method='get',
        operation_description="Retrieve a room by its 4-digit code.",
        manual_parameters=[
            openapi.Parameter(
                'code',
                openapi.IN_QUERY,
                description="4-digit code of the room",
                required=True,
                type=openapi.TYPE_INTEGER
            )
        ],
        responses={
            200: RoomSerializer,
            404: "Room not found"
        },
        security=[{'Bearer': []}]
    )
    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.AllowAny],  # or IsAuthenticatedOrReadOnly
        url_path='by-code'
    )
    def retrieve_by_code(self, request):
        """
        GET /rooms/by-code?code=1234
        Returns the room data for the given 4-digit code.
        """
        code_str = request.query_params.get('code')
        if not code_str:
            return Response({"detail": "No code provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            code_int = int(code_str)
            room = Room.objects.get(code=code_int)
        except ValueError:
            return Response({"detail": "Code must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        except Room.DoesNotExist:
            return Response({"detail": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(room)
        return Response(serializer.data, status=status.HTTP_200_OK)

class RoomMembershipViewSet(viewsets.ModelViewSet):
    queryset = RoomMembership.objects.all()
    serializer_class = RoomMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    @swagger_auto_schema(
        operation_description="List memberships.",
        responses={200: RoomMembershipSerializer(many=True)},
        security=[{'Bearer': []}]  # require Bearer
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Create a new membership.",
        request_body=RoomMembershipSerializer,
        responses={201: RoomMembershipSerializer, 400: "Bad Request"},
        security=[{'Bearer': []}]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(
        method='get',
        operation_description="List all users in a given room (by room_id).",
        responses={
            200: openapi.Response(
                description="OK",
                schema=RoomMembershipSerializer(many=True)
            ),
            404: "Room not found"
        },
        security=[{'Bearer': []}] 
    )
    @action(
        detail=True,
        methods=['get'],
        url_path='members',
        permission_classes=[permissions.IsAuthenticatedOrReadOnly]
    )
    def get_room_members(self, request, pk=None):
        """
        GET /rooms/<room_id>/members/
        Returns a list of memberships for this room (thus all users in the room).
        """
        try:
            room = self.get_object()  # or Room.objects.get(pk=pk)
        except Room.DoesNotExist:
            return Response({"detail": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

        memberships = RoomMembership.objects.filter(room=room)
        serializer = RoomMembershipSerializer(memberships, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        method='post',
        operation_description="Activate the current round for the room.",
        responses={
            200: openapi.Response(description="Round activated."),
            404: openapi.Response(description="Room not found.")
        },
        security=[{'Bearer': []}]
    )
    @action(
        detail=True,
        methods=['post'],
        url_path='activate-round',
        permission_classes=[permissions.IsAuthenticated]
    )
    def activate_round(self, request, pk=None):
        """
        POST /rooms/<room_id>/activate-round/
        Activates the current round for the room.
        """
        try:
            room = self.get_object()
        except Room.DoesNotExist:
            return Response({"detail": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

        # Logic to activate the round
        room.current_round_active = True
        room.save()

        return Response({"detail": "Round activated."}, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        method='post',
        operation_description="Stops the active round and increments the round for the room.",
        responses={
            200: openapi.Response(description="Round incremented."),
            404: openapi.Response(description="Room not found.")
        },
        security=[{'Bearer': []}]
    )
    @action(
        detail=True,
        methods=['post'],
        url_path='increment-round',
        permission_classes=[permissions.IsAuthenticated]
    )
    def increment_round(self, request, pk=None):
        """
        POST /rooms/<room_id>/increment-round/
        Stops the active round and increments the round for the room.
        """
        try:
            room = self.get_object()
        except Room.DoesNotExist:
            return Response({"detail": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

        # Logic to increment the round
        room.current_round += 1
        room.save()

        return Response({"detail": "Round incremented."}, status=status.HTTP_200_OK)

class RoomGuessSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, room_id):
        # Pro Runde: wie viele richtig/falsch, wie viele AI/Human getippt
        all_guesses = Guess.objects.filter(room_id=room_id)
        # Gesamtstatistik
        total = all_guesses.count()
        correct = all_guesses.filter(is_correct=True).count()
        wrong = all_guesses.filter(is_correct=False).count()
        ai = all_guesses.filter(guessed_ai=True).count()
        human = all_guesses.filter(guessed_ai=False).count()
        # Pro Runde
        per_round = list(
            all_guesses.values('round')
            .annotate(
                total=Count('id'),
                correct=Count('id', filter=Q(is_correct=True)),
                wrong=Count('id', filter=Q(is_correct=False)),
                ai=Count('id', filter=Q(guessed_ai=True)),
                human=Count('id', filter=Q(guessed_ai=False)),
            )
            .order_by('round')
        )
        return Response({
            'total': total,
            'correct': correct,
            'wrong': wrong,
            'ai': ai,
            'human': human,
            'per_round': per_round,
        })
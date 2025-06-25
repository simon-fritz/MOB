from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, RoomMembershipViewSet, RoomGuessSummaryView

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'memberships', RoomMembershipViewSet, basename='roommembership')

urlpatterns = [
    path('', include(router.urls)),
    path('rooms/<int:room_id>/guesses/summary/', RoomGuessSummaryView.as_view(), name='room-guess-summary'),
]

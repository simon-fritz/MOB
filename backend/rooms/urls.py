from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, RoomMembershipViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'memberships', RoomMembershipViewSet, basename='roommembership')

urlpatterns = [
    path('', include(router.urls)),
]

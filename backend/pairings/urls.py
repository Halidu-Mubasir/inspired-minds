from django.urls import path
from pairings.views import (
    PairingListCreateView,
    PairingDetailView,
    MyStudentsView,
    MyTeachersView,
    PairingStatsView,
)

urlpatterns = [
    path("", PairingListCreateView.as_view(), name="pairing-list"),
    path("stats/", PairingStatsView.as_view(), name="pairing-stats"),
    path("my-students/", MyStudentsView.as_view(), name="my-students"),
    path("my-teachers/", MyTeachersView.as_view(), name="my-teachers"),
    path("<uuid:pk>/", PairingDetailView.as_view(), name="pairing-detail"),
]

from django.urls import path
from subjects.views import SubjectListCreateView, SubjectDetailView

urlpatterns = [
    path("", SubjectListCreateView.as_view(), name="subject-list"),
    path("<uuid:pk>/", SubjectDetailView.as_view(), name="subject-detail"),
]

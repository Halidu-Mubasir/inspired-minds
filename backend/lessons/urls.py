from django.urls import path
from lessons.views.lesson_views import (
    LessonListCreateView,
    LessonDetailView,
    LessonStatusView,
    LessonTopicListCreateView,
    LessonTopicDetailView,
)

urlpatterns = [
    path("", LessonListCreateView.as_view(), name="lesson-list-create"),
    path("<uuid:pk>/", LessonDetailView.as_view(), name="lesson-detail"),
    path("<uuid:pk>/status/", LessonStatusView.as_view(), name="lesson-status"),
    path("<uuid:lesson_pk>/topics/", LessonTopicListCreateView.as_view(), name="lesson-topic-list"),
    path("<uuid:lesson_pk>/topics/<uuid:pk>/", LessonTopicDetailView.as_view(), name="lesson-topic-detail"),
]

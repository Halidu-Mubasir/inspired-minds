import django_filters
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from lessons.models import Lesson, LessonTopic
from lessons.serializers.lesson_serializers import (
    LessonListSerializer,
    LessonDetailSerializer,
    CreateLessonSerializer,
    UpdateLessonSerializer,
    LessonStatusSerializer,
    LessonTopicSerializer,
)
from users.permissions import IsAdminOrTeacher, IsAdminOrTeacherOrReadOnly


class LessonFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status")
    pairing = django_filters.UUIDFilter(field_name="pairing__id")
    scheduled_date = django_filters.DateFilter(field_name="scheduled_date")

    class Meta:
        model = Lesson
        fields = ["status", "pairing", "scheduled_date"]


class LessonListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = LessonFilter
    ordering_fields = ["scheduled_date", "created_at"]

    def get_queryset(self):
        return (
            Lesson.objects.for_user(self.request.user)
            .select_related("pairing__teacher", "pairing__student", "pairing__subject")
            .prefetch_related("topics")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateLessonSerializer
        return LessonListSerializer

    def create(self, request, *args, **kwargs):
        serializer = CreateLessonSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        lesson = serializer.save()
        return Response(LessonDetailSerializer(lesson, context={"request": request}).data, status=status.HTTP_201_CREATED)


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrTeacherOrReadOnly]

    def get_queryset(self):
        return (
            Lesson.objects.for_user(self.request.user)
            .select_related("pairing__teacher", "pairing__student", "pairing__subject")
            .prefetch_related("topics")
        )

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return UpdateLessonSerializer
        return LessonDetailSerializer

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


class LessonStatusView(APIView):
    permission_classes = [IsAdminOrTeacher]

    def patch(self, request, pk):
        lesson = generics.get_object_or_404(Lesson.objects.for_user(request.user), pk=pk)
        serializer = LessonStatusSerializer(lesson, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(LessonDetailSerializer(lesson, context={"request": request}).data)


class LessonTopicListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrTeacherOrReadOnly]
    serializer_class = LessonTopicSerializer

    def get_lesson(self):
        return generics.get_object_or_404(Lesson.objects.for_user(self.request.user), pk=self.kwargs["lesson_pk"])

    def get_queryset(self):
        return LessonTopic.objects.filter(lesson=self.get_lesson()).order_by("order")

    def perform_create(self, serializer):
        serializer.save(lesson=self.get_lesson())


class LessonTopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrTeacherOrReadOnly]
    serializer_class = LessonTopicSerializer

    def get_queryset(self):
        return LessonTopic.objects.filter(
            lesson__in=Lesson.objects.for_user(self.request.user),
            lesson__id=self.kwargs["lesson_pk"],
        )

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)

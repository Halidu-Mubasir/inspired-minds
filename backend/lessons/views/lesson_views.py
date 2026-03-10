import django_filters
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
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
from users.permissions import IsTeacher, IsAdmin


class LessonFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status")
    pairing = django_filters.UUIDFilter(field_name="pairing__id")
    scheduled_date = django_filters.DateFilter(field_name="scheduled_date")

    class Meta:
        model = Lesson
        fields = ["status", "pairing", "scheduled_date"]


class LessonListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = LessonFilter
    ordering_fields = ["scheduled_date", "created_at"]

    def get_queryset(self):
        user = self.request.user
        qs = Lesson.objects.select_related("pairing__teacher", "pairing__student").prefetch_related("topics")
        if user.role == "teacher":
            return qs.filter(pairing__teacher=user)
        elif user.role == "student":
            return qs.filter(pairing__student=user)
        # admin sees all
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateLessonSerializer
        return LessonListSerializer

    def perform_create(self, serializer):
        if self.request.user.role not in ("teacher", "admin"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers and admins can create lessons.")
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = CreateLessonSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        lesson = serializer.save()
        return Response(LessonDetailSerializer(lesson, context={"request": request}).data, status=status.HTTP_201_CREATED)


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Lesson.objects.select_related("pairing__teacher", "pairing__student").prefetch_related("topics")
        if user.role == "teacher":
            return qs.filter(pairing__teacher=user)
        elif user.role == "student":
            return qs.filter(pairing__student=user)
        return qs

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return UpdateLessonSerializer
        return LessonDetailSerializer

    def update(self, request, *args, **kwargs):
        if request.user.role == "student":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Students cannot modify lessons.")
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role == "student":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Students cannot delete lessons.")
        return super().destroy(request, *args, **kwargs)


class LessonStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role not in ("teacher", "admin"):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        try:
            lesson = Lesson.objects.get(pk=pk, pairing__teacher=request.user) if request.user.role == "teacher" else Lesson.objects.get(pk=pk)
        except Lesson.DoesNotExist:
            return Response({"error": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = LessonStatusSerializer(lesson, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(LessonDetailSerializer(lesson, context={"request": request}).data)


class LessonTopicListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LessonTopicSerializer

    def get_lesson(self):
        user = self.request.user
        qs = Lesson.objects.all()
        if user.role == "teacher":
            qs = qs.filter(pairing__teacher=user)
        elif user.role == "student":
            qs = qs.filter(pairing__student=user)
        try:
            return qs.get(pk=self.kwargs["lesson_pk"])
        except Lesson.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Lesson not found.")

    def get_queryset(self):
        return LessonTopic.objects.filter(lesson__id=self.kwargs["lesson_pk"]).order_by("order")

    def perform_create(self, serializer):
        if self.request.user.role == "student":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Students cannot add topics.")
        lesson = self.get_lesson()
        serializer.save(lesson=lesson)


class LessonTopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LessonTopicSerializer

    def get_queryset(self):
        user = self.request.user
        qs = LessonTopic.objects.filter(lesson__id=self.kwargs["lesson_pk"])
        if user.role == "teacher":
            qs = qs.filter(lesson__pairing__teacher=user)
        elif user.role == "student":
            qs = qs.filter(lesson__pairing__student=user)
        return qs

    def update(self, request, *args, **kwargs):
        if request.user.role == "student":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Students cannot modify topics.")
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role == "student":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Students cannot delete topics.")
        return super().destroy(request, *args, **kwargs)

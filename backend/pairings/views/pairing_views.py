import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from pairings.models import TeacherStudentPairing, PairingStatus
from pairings.serializers import (
    PairingListSerializer,
    PairingDetailSerializer,
    PairingCreateSerializer,
    PairingUpdateSerializer,
)
from users.permissions import IsAdmin, IsTeacher, IsStudent


class PairingFilter(django_filters.FilterSet):
    teacher = django_filters.UUIDFilter(field_name="teacher__id")
    student = django_filters.UUIDFilter(field_name="student__id")
    status = django_filters.ChoiceFilter(choices=PairingStatus.choices)
    subject = django_filters.CharFilter(lookup_expr="icontains")

    class Meta:
        model = TeacherStudentPairing
        fields = ["teacher", "student", "status", "subject"]


class PairingListCreateView(ListCreateAPIView):
    """Admin: list all pairings and create new ones."""
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PairingFilter
    search_fields = ["subject", "teacher__first_name", "teacher__last_name", "student__first_name", "student__last_name"]
    ordering_fields = ["created_at", "start_date", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return TeacherStudentPairing.objects.select_related(
            "teacher", "student", "created_by"
        ).all()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PairingCreateSerializer
        return PairingListSerializer

    def create(self, request, *args, **kwargs):
        serializer = PairingCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        pairing = serializer.save()
        return Response(PairingDetailSerializer(pairing).data, status=status.HTTP_201_CREATED)


class PairingDetailView(RetrieveUpdateDestroyAPIView):
    """Admin: retrieve, update, or end a pairing."""
    permission_classes = [IsAdmin]
    queryset = TeacherStudentPairing.objects.select_related("teacher", "student", "created_by")

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return PairingUpdateSerializer
        return PairingDetailSerializer

    def destroy(self, request, *args, **kwargs):
        pairing = self.get_object()
        from django.utils import timezone
        pairing.status = PairingStatus.ENDED
        pairing.end_date = timezone.now().date()
        pairing.save()
        return Response({"message": "Pairing ended."}, status=status.HTTP_200_OK)


class MyStudentsView(APIView):
    """Teacher: list all students paired with me."""
    permission_classes = [IsTeacher]

    def get(self, request):
        pairings = TeacherStudentPairing.objects.filter(
            teacher=request.user, status=PairingStatus.ACTIVE
        ).select_related("student", "student__student_profile")
        serializer = PairingListSerializer(pairings, many=True)
        return Response(serializer.data)


class MyTeachersView(APIView):
    """Student: list all teachers paired with me."""
    permission_classes = [IsStudent]

    def get(self, request):
        pairings = TeacherStudentPairing.objects.filter(
            student=request.user, status=PairingStatus.ACTIVE
        ).select_related("teacher", "teacher__teacher_profile")
        serializer = PairingListSerializer(pairings, many=True)
        return Response(serializer.data)


class PairingStatsView(APIView):
    """Admin: pairing status counts for dashboard."""
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = TeacherStudentPairing.objects
        return Response({
            "active": qs.filter(status=PairingStatus.ACTIVE).count(),
            "paused": qs.filter(status=PairingStatus.PAUSED).count(),
            "ended": qs.filter(status=PairingStatus.ENDED).count(),
            "total": qs.count(),
        })

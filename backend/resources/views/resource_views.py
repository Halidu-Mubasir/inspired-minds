import os
import mimetypes
import django_filters
from django.http import FileResponse, Http404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from resources.models import Resource, ResourceVisibility
from resources.serializers.resource_serializers import (
    ResourceListSerializer,
    ResourceDetailSerializer,
    UploadResourceSerializer,
    LibraryUploadSerializer,
)


class ResourceFilter(django_filters.FilterSet):
    resource_type = django_filters.CharFilter(field_name="resource_type")
    visibility = django_filters.CharFilter(field_name="visibility")
    subject = django_filters.CharFilter(field_name="subject", lookup_expr="icontains")
    pairing = django_filters.UUIDFilter(field_name="pairing__id")
    lesson = django_filters.UUIDFilter(field_name="lesson__id")

    class Meta:
        model = Resource
        fields = ["resource_type", "visibility", "subject", "pairing", "lesson"]


class ResourceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = ResourceFilter
    search_fields = ["title", "subject", "description"]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Resource.objects.select_related("uploaded_by").all()
        elif user.role == "teacher":
            from pairings.models import TeacherStudentPairing
            my_pairings = TeacherStudentPairing.objects.filter(teacher=user).values_list("id", flat=True)
            return Resource.objects.filter(
                pairing__in=my_pairings
            ).select_related("uploaded_by") | Resource.objects.filter(
                uploaded_by=user
            ).select_related("uploaded_by")
        else:  # student
            from pairings.models import TeacherStudentPairing, PairingStatus
            my_pairings = TeacherStudentPairing.objects.filter(student=user).values_list("id", flat=True)
            return Resource.objects.filter(
                pairing__in=my_pairings, visibility=ResourceVisibility.PRIVATE
            ).select_related("uploaded_by") | Resource.objects.filter(
                visibility=ResourceVisibility.LIBRARY
            ).select_related("uploaded_by")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UploadResourceSerializer
        return ResourceListSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role not in ("teacher", "admin"):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        serializer = UploadResourceSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        resource = serializer.save(uploaded_by=request.user)
        return Response(ResourceDetailSerializer(resource, context={"request": request}).data, status=status.HTTP_201_CREATED)


class ResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Resource.objects.all()
        elif user.role == "teacher":
            from pairings.models import TeacherStudentPairing
            my_pairings = TeacherStudentPairing.objects.filter(teacher=user).values_list("id", flat=True)
            return Resource.objects.filter(pairing__in=my_pairings) | Resource.objects.filter(uploaded_by=user)
        else:
            from pairings.models import TeacherStudentPairing
            my_pairings = TeacherStudentPairing.objects.filter(student=user).values_list("id", flat=True)
            return Resource.objects.filter(pairing__in=my_pairings) | Resource.objects.filter(visibility=ResourceVisibility.LIBRARY)

    def get_serializer_class(self):
        return ResourceDetailSerializer

    def update(self, request, *args, **kwargs):
        if request.user.role == "student":
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role == "student":
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        resource = self.get_object()
        # File removed in model's delete()
        resource.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResourceDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # Access control same as detail view
        user = request.user
        try:
            resource = Resource.objects.get(pk=pk)
        except Resource.DoesNotExist:
            raise Http404

        # Check access
        has_access = False
        if user.role == "admin":
            has_access = True
        elif user.role == "teacher":
            from pairings.models import TeacherStudentPairing
            my_pairings = TeacherStudentPairing.objects.filter(teacher=user).values_list("id", flat=True)
            has_access = resource.uploaded_by_id == user.id or (resource.pairing_id and resource.pairing_id in my_pairings)
        else:  # student
            from pairings.models import TeacherStudentPairing
            my_pairings = TeacherStudentPairing.objects.filter(student=user).values_list("id", flat=True)
            has_access = resource.visibility == ResourceVisibility.LIBRARY or (resource.pairing_id and resource.pairing_id in my_pairings)

        if not has_access:
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if not resource.file or not os.path.isfile(resource.file.path):
            raise Http404

        mime_type = resource.mime_type or mimetypes.guess_type(resource.file_name)[0] or "application/octet-stream"
        response = FileResponse(
            open(resource.file.path, "rb"),
            content_type=mime_type,
        )
        response["Content-Disposition"] = f'attachment; filename="{resource.file_name}"'
        return response


class LibraryListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ["title", "subject", "description"]

    def get_queryset(self):
        return Resource.objects.filter(
            visibility=ResourceVisibility.LIBRARY
        ).select_related("uploaded_by")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return LibraryUploadSerializer
        return ResourceListSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role not in ("teacher", "admin"):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        serializer = LibraryUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        resource = serializer.save(uploaded_by=request.user, visibility=ResourceVisibility.LIBRARY)
        return Response(ResourceDetailSerializer(resource, context={"request": request}).data, status=status.HTTP_201_CREATED)

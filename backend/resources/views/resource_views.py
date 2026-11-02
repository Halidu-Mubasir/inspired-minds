import django_filters
from django.db.models import Q
from django.http import FileResponse, Http404
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import SAFE_METHODS, IsAuthenticated
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
from users.models import UserRole
from users.permissions import IsAdminOrTeacherOrReadOnly


class ResourceFilter(django_filters.FilterSet):
    resource_type = django_filters.CharFilter(field_name="resource_type")
    visibility = django_filters.CharFilter(field_name="visibility")
    subject = django_filters.CharFilter(field_name="subject__name", lookup_expr="icontains")
    pairing = django_filters.UUIDFilter(field_name="pairing__id")
    lesson = django_filters.UUIDFilter(field_name="lesson__id")

    class Meta:
        model = Resource
        fields = ["resource_type", "visibility", "subject", "pairing", "lesson"]


class ResourceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrTeacherOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = ResourceFilter
    search_fields = ["title", "subject__name", "description"]

    def get_queryset(self):
        user = self.request.user
        qs = Resource.objects.visible_to(user).select_related("uploaded_by", "subject")
        if user.role == UserRole.TEACHER:
            # Other teachers' library uploads are listed by the library endpoint, not here.
            qs = qs.filter(Q(pairing__teacher=user) | Q(uploaded_by=user))
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UploadResourceSerializer
        return ResourceListSerializer

    def create(self, request, *args, **kwargs):
        serializer = UploadResourceSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        resource = serializer.save(uploaded_by=request.user)
        return Response(ResourceDetailSerializer(resource, context={"request": request}).data, status=status.HTTP_201_CREATED)


class ResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrTeacherOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    serializer_class = ResourceDetailSerializer

    def get_queryset(self):
        if self.request.method in SAFE_METHODS:
            return Resource.objects.visible_to(self.request.user)
        return Resource.objects.editable_by(self.request.user)

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


class ResourceDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        resource = generics.get_object_or_404(Resource.objects.visible_to(request.user), pk=pk)
        if not resource.file or not resource.file.storage.exists(resource.file.name):
            raise Http404
        # Content type is guessed from the stored filename rather than trusting the uploader's header.
        return FileResponse(resource.file.open("rb"), as_attachment=True, filename=resource.file_name)


class LibraryListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrTeacherOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ["title", "subject__name", "description"]

    def get_queryset(self):
        return Resource.objects.filter(
            visibility=ResourceVisibility.LIBRARY
        ).select_related("uploaded_by", "subject")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return LibraryUploadSerializer
        return ResourceListSerializer

    def create(self, request, *args, **kwargs):
        serializer = LibraryUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        resource = serializer.save(uploaded_by=request.user)
        return Response(ResourceDetailSerializer(resource, context={"request": request}).data, status=status.HTTP_201_CREATED)

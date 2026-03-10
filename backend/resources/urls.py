from django.urls import path
from resources.views.resource_views import (
    ResourceListCreateView,
    ResourceDetailView,
    ResourceDownloadView,
    LibraryListView,
)

urlpatterns = [
    path("", ResourceListCreateView.as_view(), name="resource-list-create"),
    path("library/", LibraryListView.as_view(), name="resource-library"),
    path("<uuid:pk>/", ResourceDetailView.as_view(), name="resource-detail"),
    path("<uuid:pk>/download/", ResourceDownloadView.as_view(), name="resource-download"),
]

from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


def healthz(request):
    """Liveness check for containers and load balancers."""
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("healthz/", healthz, name="healthz"),
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("users.urls")),
    path("api/v1/pairings/", include("pairings.urls")),
    path("api/v1/lessons/", include("lessons.urls")),
    path("api/v1/enquiries/", include("enquiries.urls")),
    path("api/v1/subjects/", include("subjects.urls")),
    path("api/v1/resources/", include("resources.urls")),
    path("api/v1/chat/", include("chat.urls")),
]

if settings.EXPOSE_API_DOCS:
    schema_view = get_schema_view(
        openapi.Info(
            title="Inspired Minds LMS API",
            default_version="v1",
            description="API for Inspired Minds Home Tuition LMS",
        ),
        public=True,
        permission_classes=[permissions.AllowAny],
    )
    urlpatterns += [
        path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
        path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    ]

# Dev only: static() is a no-op when DEBUG is off. In production serve /media/ (avatars)
# from the web server or object storage; private_media/ must never be served.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

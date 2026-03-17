from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Inspired Minds LMS API",
        default_version="v1",
        description="API for Inspired Minds Home Tuition LMS",
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("users.urls")),
    path("api/v1/pairings/", include("pairings.urls")),
    path("api/v1/lessons/", include("lessons.urls")),
    path("api/v1/resources/", include("resources.urls")),
    path("api/v1/chat/", include("chat.urls")),
    path("api/v1/quizzes/", include("quizzes.urls")),
    path("api/v1/ai-chat/", include("ai_chat.urls")),
    # Swagger
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

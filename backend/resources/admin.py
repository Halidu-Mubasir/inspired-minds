from django.contrib import admin
from resources.models import Resource


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "resource_type", "visibility", "subject", "uploaded_by", "file_size", "created_at")
    list_filter = ("resource_type", "visibility")
    search_fields = ("title", "subject", "uploaded_by__email")
    readonly_fields = ("file_name", "file_size", "mime_type", "created_at", "updated_at")

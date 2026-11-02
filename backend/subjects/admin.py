from django.contrib import admin
from subjects.models import Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    list_filter = ("is_active",)
    list_editable = ("is_active",)
    search_fields = ("name",)

    def has_delete_permission(self, request, obj=None):
        return False  # retire with is_active instead; pairings and resources reference subjects

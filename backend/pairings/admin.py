from django.contrib import admin
from pairings.models import TeacherStudentPairing


@admin.register(TeacherStudentPairing)
class TeacherStudentPairingAdmin(admin.ModelAdmin):
    list_display = ["teacher", "student", "subject", "status", "start_date", "created_at"]
    list_filter = ["status"]
    search_fields = [
        "teacher__first_name", "teacher__last_name",
        "student__first_name", "student__last_name",
        "subject__name",
    ]
    ordering = ["-created_at"]
    raw_id_fields = ["teacher", "student", "created_by"]

    def has_delete_permission(self, request, obj=None):
        return False  # end a pairing (status=ended) instead; it carries lessons and chat history

from django.contrib import admin
from pairings.models import TeacherStudentPairing


@admin.register(TeacherStudentPairing)
class TeacherStudentPairingAdmin(admin.ModelAdmin):
    list_display = ["teacher", "student", "subject", "status", "start_date", "created_at"]
    list_filter = ["status"]
    search_fields = [
        "teacher__first_name", "teacher__last_name",
        "student__first_name", "student__last_name",
        "subject",
    ]
    ordering = ["-created_at"]
    raw_id_fields = ["teacher", "student", "created_by"]

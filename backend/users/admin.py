from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from users.models import CustomUser, TeacherProfile, StudentProfile


class TeacherProfileInline(admin.StackedInline):
    model = TeacherProfile
    can_delete = False
    verbose_name_plural = "Teacher Profile"
    extra = 0
    filter_horizontal = ["subjects"]


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    verbose_name_plural = "Student Profile"
    extra = 0
    filter_horizontal = ["subjects_of_interest"]


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ["email", "first_name", "last_name", "role", "is_active", "created_at"]
    list_filter = ["role", "is_active"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at", "last_login"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "phone_number", "avatar", "address")}),
        ("Role & Status", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
        ("Timestamps", {"fields": ("created_at", "updated_at", "last_login")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "role", "password1", "password2"),
        }),
    )

    def get_inlines(self, request, obj=None):
        if obj:
            if obj.role == "teacher":
                return [TeacherProfileInline]
            elif obj.role == "student":
                return [StudentProfileInline]
        return []


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "subject_names", "years_of_experience", "is_available"]
    search_fields = ["user__email", "user__first_name", "user__last_name"]
    filter_horizontal = ["subjects"]

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("subjects")

    @admin.display(description="Subjects")
    def subject_names(self, obj):
        return ", ".join(s.name for s in obj.subjects.all())


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "education_level", "school_name", "grade_or_year"]
    search_fields = ["user__email", "user__first_name", "user__last_name"]
    filter_horizontal = ["subjects_of_interest"]

from django.contrib import admin
from enquiries.models import ContactEnquiry, TutorApplication


@admin.register(ContactEnquiry)
class ContactEnquiryAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "level", "is_handled", "created_at")
    list_filter = ("is_handled", "level")
    list_editable = ("is_handled",)
    search_fields = ("name", "email", "phone", "subjects")
    readonly_fields = ("created_at", "updated_at")


@admin.register(TutorApplication)
class TutorApplicationAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "phone", "qualification", "experience", "is_handled", "created_at")
    list_filter = ("is_handled", "qualification", "experience")
    list_editable = ("is_handled",)
    search_fields = ("full_name", "email", "phone", "subjects")
    readonly_fields = ("created_at", "updated_at")

from django.contrib import admin
from lessons.models import Lesson, LessonTopic


class LessonTopicInline(admin.TabularInline):
    model = LessonTopic
    extra = 0
    fields = ("order", "title", "is_completed")
    ordering = ("order",)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "pairing", "status", "scheduled_date", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "pairing__teacher__email", "pairing__student__email")
    inlines = [LessonTopicInline]


@admin.register(LessonTopic)
class LessonTopicAdmin(admin.ModelAdmin):
    list_display = ("title", "lesson", "order", "is_completed")
    list_filter = ("is_completed",)

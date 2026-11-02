from django.contrib import admin
from django.db.models import Count, Q

from ai_services.models import AIGeneration, AIUsage, SafeguardingFlag, TutorConversation, TutorMessage


class ReadOnlyInline(admin.TabularInline):
    """Transcripts are a safeguarding record, so admin can read but not alter them."""
    extra = 0
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False


class TutorMessageInline(ReadOnlyInline):
    model = TutorMessage
    fields = ("created_at", "role", "content", "refused")
    readonly_fields = fields


class SafeguardingFlagInline(admin.TabularInline):
    model = SafeguardingFlag
    extra = 0
    can_delete = False
    fields = ("created_at", "severity", "reason", "reviewed_at", "reviewed_by")
    readonly_fields = ("created_at", "severity", "reason")

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(TutorConversation)
class TutorConversationAdmin(admin.ModelAdmin):
    list_display = ("title", "student", "subject", "message_count", "open_flags", "last_message_at")
    list_filter = ("subject",)
    search_fields = ("title", "student__email", "student__first_name", "student__last_name")
    readonly_fields = ("student", "title", "subject", "resource", "last_message_at", "created_at")
    inlines = [SafeguardingFlagInline, TutorMessageInline]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("student", "subject").annotate(
            _messages=Count("messages", distinct=True),
            _open_flags=Count("flags", filter=Q(flags__reviewed_at__isnull=True), distinct=True),
        )

    @admin.display(description="Messages", ordering="_messages")
    def message_count(self, obj):
        return obj._messages

    @admin.display(description="Open flags", ordering="_open_flags")
    def open_flags(self, obj):
        return obj._open_flags

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SafeguardingFlag)
class SafeguardingFlagAdmin(admin.ModelAdmin):
    list_display = ("created_at", "severity", "conversation", "reviewed_at", "reviewed_by")
    list_filter = ("severity", ("reviewed_at", admin.EmptyFieldListFilter))
    readonly_fields = ("conversation", "message", "reason", "severity", "created_at")
    fields = ("conversation", "message", "severity", "reason", "created_at", "reviewed_at", "reviewed_by")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(AIUsage)
class AIUsageAdmin(admin.ModelAdmin):
    list_display = ("created_at", "user", "feature", "model", "input_tokens", "output_tokens",
                    "cache_read_input_tokens", "refused", "estimated_cost_usd")
    list_filter = ("feature", "model", "refused", "created_at")
    search_fields = ("user__email", "request_id")
    date_hierarchy = "created_at"

    @admin.display(description="Est. cost (USD)")
    def estimated_cost_usd(self, obj):
        cost = obj.estimated_cost_usd
        return "—" if cost is None else cost

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(AIGeneration)
class AIGenerationAdmin(admin.ModelAdmin):
    list_display = ("created_at", "title", "kind", "created_by")
    list_filter = ("kind",)
    search_fields = ("title", "created_by__email")
    readonly_fields = ("created_by", "kind", "title", "params", "output", "lesson", "resource", "created_at")

    def has_add_permission(self, request):
        return False

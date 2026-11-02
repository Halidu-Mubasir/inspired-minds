from django.urls import path
from ai_services.views import (
    AIUsageView,
    GenerationDetailView,
    GenerationListView,
    QuestionGeneratorView,
    SafeguardingFlagReviewView,
    SummaryView,
    TutorConversationDetailView,
    TutorConversationListCreateView,
    TutorReplyView,
)

urlpatterns = [
    path("usage/", AIUsageView.as_view(), name="ai-usage"),
    # Student tutor (teachers/admins: read-only review)
    path("tutor/conversations/", TutorConversationListCreateView.as_view(), name="tutor-conversation-list"),
    path("tutor/conversations/<uuid:pk>/", TutorConversationDetailView.as_view(), name="tutor-conversation-detail"),
    path("tutor/conversations/<uuid:pk>/messages/", TutorReplyView.as_view(), name="tutor-reply"),
    path("tutor/flags/<uuid:pk>/review/", SafeguardingFlagReviewView.as_view(), name="tutor-flag-review"),
    # Teacher tools
    path("tools/questions/", QuestionGeneratorView.as_view(), name="ai-questions"),
    path("tools/summary/", SummaryView.as_view(), name="ai-summary"),
    path("tools/generations/", GenerationListView.as_view(), name="ai-generation-list"),
    path("tools/generations/<uuid:pk>/", GenerationDetailView.as_view(), name="ai-generation-detail"),
]

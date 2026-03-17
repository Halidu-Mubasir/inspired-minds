from django.urls import path
from ai_chat.views.ai_views import (
    AIConversationListCreateView,
    AIConversationDetailView,
    SendMessageView,
)

urlpatterns = [
    path("conversations/", AIConversationListCreateView.as_view(), name="ai-conversation-list-create"),
    path("conversations/<uuid:pk>/", AIConversationDetailView.as_view(), name="ai-conversation-detail"),
    path("conversations/<uuid:pk>/messages/", SendMessageView.as_view(), name="ai-send-message"),
]

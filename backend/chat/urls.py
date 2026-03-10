from django.urls import path
from chat.views import ConversationListView, ConversationDetailView, MessageListView, MarkReadView

urlpatterns = [
    path("conversations/", ConversationListView.as_view()),
    path("conversations/<uuid:pk>/", ConversationDetailView.as_view()),
    path("conversations/<uuid:pk>/messages/", MessageListView.as_view()),
    path("conversations/<uuid:pk>/read/", MarkReadView.as_view()),
]

from django.contrib import admin
from ai_chat.models import AIConversation, AIMessage

admin.site.register(AIConversation)
admin.site.register(AIMessage)

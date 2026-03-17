from django.contrib import admin
from quizzes.models import Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer

admin.site.register(Quiz)
admin.site.register(QuizQuestion)
admin.site.register(QuizOption)
admin.site.register(QuizAttempt)
admin.site.register(QuizAnswer)

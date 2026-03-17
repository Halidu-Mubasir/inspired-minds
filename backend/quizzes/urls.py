from django.urls import path
from quizzes.views.quiz_views import (
    QuizListCreateView,
    QuizDetailView,
    GenerateQuizView,
    PublishQuizView,
    QuizAttemptView,
    SubmitAttemptView,
    QuizResultsView,
)

urlpatterns = [
    path("", QuizListCreateView.as_view(), name="quiz-list-create"),
    path("generate/", GenerateQuizView.as_view(), name="quiz-generate"),
    path("<uuid:pk>/", QuizDetailView.as_view(), name="quiz-detail"),
    path("<uuid:pk>/publish/", PublishQuizView.as_view(), name="quiz-publish"),
    path("<uuid:pk>/attempt/", QuizAttemptView.as_view(), name="quiz-attempt"),
    path("<uuid:pk>/attempt/submit/", SubmitAttemptView.as_view(), name="quiz-attempt-submit"),
    path("<uuid:pk>/results/", QuizResultsView.as_view(), name="quiz-results"),
]

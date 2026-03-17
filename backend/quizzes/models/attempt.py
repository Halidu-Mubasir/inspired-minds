from django.db import models
from setup.base_model import BaseModel


class AttemptStatus(models.TextChoices):
    IN_PROGRESS = "in_progress", "In Progress"
    SUBMITTED = "submitted", "Submitted"


class QuizAttempt(BaseModel):
    quiz = models.ForeignKey(
        "quizzes.Quiz",
        on_delete=models.CASCADE,
        related_name="attempts",
    )
    student = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="quiz_attempts",
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.PositiveIntegerField(null=True, blank=True)
    total_points = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=AttemptStatus.choices,
        default=AttemptStatus.IN_PROGRESS,
    )

    class Meta:
        unique_together = ["quiz", "student"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student} — {self.quiz.title} ({self.get_status_display()})"


class QuizAnswer(BaseModel):
    attempt = models.ForeignKey(
        QuizAttempt,
        on_delete=models.CASCADE,
        related_name="answers",
    )
    question = models.ForeignKey(
        "quizzes.QuizQuestion",
        on_delete=models.CASCADE,
        related_name="answers",
    )
    selected_option = models.ForeignKey(
        "quizzes.QuizOption",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    is_correct = models.BooleanField(null=True, blank=True)
    points_earned = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ["attempt", "question"]

    def __str__(self):
        return f"{self.attempt} — Q{self.question.order}"

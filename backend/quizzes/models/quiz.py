from django.db import models
from setup.base_model import BaseModel


class QuizStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"
    ARCHIVED = "archived", "Archived"


class QuestionType(models.TextChoices):
    MCQ = "mcq", "Multiple Choice"
    TRUE_FALSE = "true_false", "True / False"


class Quiz(BaseModel):
    pairing = models.ForeignKey(
        "pairings.TeacherStudentPairing",
        on_delete=models.CASCADE,
        related_name="quizzes",
    )
    lesson = models.ForeignKey(
        "lessons.Lesson",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quizzes",
    )
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=QuizStatus.choices,
        default=QuizStatus.DRAFT,
    )
    time_limit_minutes = models.PositiveIntegerField(null=True, blank=True)
    generated_by_ai = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_quizzes",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class QuizQuestion(BaseModel):
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name="questions",
    )
    question_type = models.CharField(max_length=20, choices=QuestionType.choices)
    question_text = models.TextField()
    order = models.PositiveIntegerField(default=0)
    points = models.PositiveIntegerField(default=1)
    explanation = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:60]}"


class QuizOption(BaseModel):
    question = models.ForeignKey(
        QuizQuestion,
        on_delete=models.CASCADE,
        related_name="options",
    )
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{'✓' if self.is_correct else '✗'} {self.text[:50]}"

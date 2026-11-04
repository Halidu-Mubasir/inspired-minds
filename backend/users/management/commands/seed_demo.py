"""Fill a local database with demo users, pairings, lessons, files and messages.

Development only: refuses to run with DEBUG off. Every demo account gets one random
password, printed once; nothing credential-like is stored in the repository.
"""
import secrets
from datetime import date, time, timedelta

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from chat.models import Message
from lessons.models import Lesson, LessonStatus, LessonTopic
from pairings.models import TeacherStudentPairing
from resources.models import Resource, ResourceType, ResourceVisibility
from subjects.models import Subject
from users.models import CustomUser, StudentProfile, TeacherProfile

DOMAIN = "demo.inspiredminds.test"

TEACHERS = [
    ("Kwame", "Mensah", ["Mathematics", "Physics"], "BSc Mathematics, KNUST", 8),
    ("Abena", "Owusu", ["English Language", "Literature"], "BA English, University of Ghana", 5),
]
STUDENTS = [
    ("Ama", "Boateng", "shs", "SHS 2", "Tamale Senior High School"),
    ("Yaw", "Asante", "jhs", "JHS 3", "Kalpohin JHS"),
    ("Fatima", "Iddrisu", "shs", "SHS 3", "Ghana Senior High School"),
]
# (teacher index, student index, subject)
PAIRINGS = [(0, 0, "Mathematics"), (0, 2, "Physics"), (1, 0, "English Language"), (1, 1, "English Language")]
LESSONS = [
    # (pairing index, title, day offset, hour, status, topics)
    (0, "Quadratic equations", 0, 16, LessonStatus.SCHEDULED, ["Factorising", "Completing the square", "The formula"]),
    (0, "Simultaneous equations", 3, 16, LessonStatus.SCHEDULED, ["Elimination", "Substitution"]),
    (0, "Indices and logarithms", -4, 16, LessonStatus.COMPLETED, ["Laws of indices", "Log rules"]),
    (1, "Motion in a straight line", 1, 17, LessonStatus.SCHEDULED, ["Velocity", "Acceleration", "Graphs"]),
    (1, "Forces and Newton's laws", 8, 17, LessonStatus.DRAFT, []),
    (2, "Essay structure", 2, 15, LessonStatus.SCHEDULED, ["Introductions", "Paragraphing"]),
    (3, "Comprehension practice", 5, 14, LessonStatus.SCHEDULED, ["Skimming", "Answering in your own words"]),
    (3, "Parts of speech", -6, 14, LessonStatus.COMPLETED, ["Nouns and pronouns", "Verbs"]),
]


class Command(BaseCommand):
    help = "Create demo data for local development (DEBUG only)."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_demo only runs with DEBUG=True.")
        if CustomUser.objects.filter(email__endswith=f"@{DOMAIN}").exists():
            raise CommandError(f"Demo data already exists (users @{DOMAIN}).")

        password = secrets.token_urlsafe(12)
        with transaction.atomic():
            self._seed(password)

        self.stdout.write(self.style.SUCCESS("Demo data created. Sign in with any of:"))
        for email in CustomUser.objects.filter(email__endswith=f"@{DOMAIN}").order_by("role", "email").values_list("email", flat=True):
            self.stdout.write(f"  {email}")
        self.stdout.write(f"Password for every demo account: {password}")

    def _user(self, first, last, role, password):
        return CustomUser.objects.create_user(
            email=f"{first.lower()}.{last.lower()}@{DOMAIN}", first_name=first, last_name=last,
            password=password, role=role,
        )

    def _seed(self, password):
        subject = {name: Subject.objects.get_or_create(name=name)[0]
                   for name in ["Mathematics", "Physics", "English Language", "Literature", "Chemistry", "Biology"]}
        admin = self._user("Esi", "Admin", "admin", password)

        teachers = []
        for first, last, subjects, quals, years in TEACHERS:
            user = self._user(first, last, "teacher", password)
            profile = TeacherProfile.objects.create(user=user, qualifications=quals, years_of_experience=years,
                                                    bio=f"{first} has tutored for {years} years.")
            profile.subjects.set([subject[s] for s in subjects])
            teachers.append(user)

        students = []
        for first, last, level, grade, school in STUDENTS:
            user = self._user(first, last, "student", password)
            StudentProfile.objects.create(user=user, education_level=level, grade_or_year=grade, school_name=school,
                                          parent_guardian_name=f"Parent of {first}")
            students.append(user)

        today = date.today()
        pairings = [
            TeacherStudentPairing.objects.create(teacher=teachers[t], student=students[s], subject=subject[name],
                                                 start_date=today - timedelta(days=60))
            for t, s, name in PAIRINGS
        ]

        for p, title, offset, hour, status, topics in LESSONS:
            lesson = Lesson.objects.create(
                pairing=pairings[p], title=title, scheduled_date=today + timedelta(days=offset),
                scheduled_time=time(hour, 0), duration_minutes=60, status=status,
                description=f"{title} for {pairings[p].student.first_name}.",
                homework="Exercise 3, questions 1–10." if status == LessonStatus.COMPLETED else None,
            )
            for i, topic in enumerate(topics):
                LessonTopic.objects.create(lesson=lesson, title=topic, order=i,
                                           is_completed=status == LessonStatus.COMPLETED)

        def text_file(name, body):
            return ContentFile(body.encode(), name=name)

        Resource.objects.create(
            uploaded_by=teachers[0], title="Quadratics worked examples", resource_type=ResourceType.NOTE,
            file=text_file("quadratics.txt", "x² − 5x + 6 = 0 → (x − 2)(x − 3) = 0 → x = 2 or x = 3\n"),
            file_name="quadratics.txt", file_size=60, mime_type="text/plain", subject=subject["Mathematics"],
            visibility=ResourceVisibility.PRIVATE, pairing=pairings[0],
        )
        Resource.objects.create(
            uploaded_by=admin, title="WASSCE Core Mathematics 2023", resource_type=ResourceType.PAST_QUESTION,
            file=text_file("wassce-math-2023.txt", "Question 1. Simplify 2^3 × 2^4.\n"),
            file_name="wassce-math-2023.txt", file_size=34, mime_type="text/plain", subject=subject["Mathematics"],
            visibility=ResourceVisibility.LIBRARY,
        )

        for pairing, sender, content in [
            (pairings[0], teachers[0], "Hi Ama, see you at 4pm for quadratics."),
            (pairings[0], students[0], "Thank you sir! I tried question 5 already."),
            (pairings[2], teachers[1], "Please bring your essay draft on Wednesday."),
        ]:
            message = Message.objects.create(conversation=pairing.conversation, sender=sender, content=content)
            # The chat consumer keeps these in step for live messages; mirror it here.
            pairing.conversation.last_message_at = message.created_at
            pairing.conversation.last_message_preview = content[:200]
            pairing.conversation.save(update_fields=["last_message_at", "last_message_preview"])

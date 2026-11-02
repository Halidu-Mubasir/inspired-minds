from datetime import date

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase

BEFORE = [
    ("subjects", "0002_seed_subjects"),
    ("pairings", "0002_alter_teacherstudentpairing_unique_together_and_more"),
    ("resources", "0002_alter_resource_file"),
    ("users", "0001_initial"),
]
AFTER = [
    ("pairings", "0004_subject_fk_cleanup"),
    ("resources", "0004_subject_fk_cleanup"),
    ("users", "0003_profile_subjects_cleanup"),
]


class SubjectDataMigrationTests(TransactionTestCase):
    """Free-text subjects from before the Subject model must land on the right Subject rows."""

    serialized_rollback = True  # restore seeded subjects for later tests

    def migrate(self, targets):
        executor = MigrationExecutor(connection)
        executor.migrate(targets)
        return executor.loader.project_state(targets).apps

    def setUp(self):
        old = self.migrate(BEFORE)
        User = old.get_model("users", "CustomUser")
        teacher = User.objects.create(email="t@example.com", first_name="T", last_name="T", role="teacher")
        student = User.objects.create(email="s@example.com", first_name="S", last_name="S", role="student")
        old.get_model("users", "TeacherProfile").objects.create(
            user=teacher, subjects=["Mathematics", " physics ", "Robotics"]
        )
        old.get_model("users", "StudentProfile").objects.create(
            user=student, subjects_of_interest=["robotics", 3]
        )
        old.get_model("pairings", "TeacherStudentPairing").objects.create(
            teacher=teacher, student=student, subject="  mathematics", start_date=date.today()
        )
        Resource = old.get_model("resources", "Resource")
        for title, subject in [("untagged", ""), ("physics notes", "Physics")]:
            Resource.objects.create(
                title=title, subject=subject, resource_type="note", file="resources/x.txt",
                file_name="x.txt", file_size=1, mime_type="text/plain",
            )
        self.apps = self.migrate(AFTER)

    def tearDown(self):
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())

    def names(self, related):
        return set(related.values_list("name", flat=True))

    def test_names_map_to_subjects_merging_case_and_spacing(self):
        Subject = self.apps.get_model("subjects", "Subject")
        self.assertEqual(Subject.objects.filter(name__iexact="robotics").count(), 1)

        pairing = self.apps.get_model("pairings", "TeacherStudentPairing").objects.get()
        self.assertEqual(pairing.subject.name, "Mathematics")

        teacher_profile = self.apps.get_model("users", "TeacherProfile").objects.get()
        self.assertEqual(self.names(teacher_profile.subjects), {"Mathematics", "Physics", "Robotics"})
        student_profile = self.apps.get_model("users", "StudentProfile").objects.get()
        self.assertEqual(self.names(student_profile.subjects_of_interest), {"Robotics"})

        resources = self.apps.get_model("resources", "Resource").objects
        self.assertIsNone(resources.get(title="untagged").subject)
        self.assertEqual(resources.get(title="physics notes").subject.name, "Physics")

    def test_migration_is_reversible(self):
        old = self.migrate(BEFORE)
        pairing = old.get_model("pairings", "TeacherStudentPairing").objects.get()
        self.assertEqual(pairing.subject, "Mathematics")
        profile = old.get_model("users", "TeacherProfile").objects.get()
        self.assertEqual(set(profile.subjects), {"Mathematics", "Physics", "Robotics"})

from django.db import migrations

from subjects.migration_helpers import SubjectResolver

# Matches the subjects advertised on the marketing website (website/lib/data/subjects.ts).
DEFAULT_SUBJECTS = [
    "Mathematics",
    "English Language",
    "Science",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Economics",
    "Business Studies",
    "French",
    "ICT / Computing",
    "Literature",
    "Further Mathematics",
    "Accounting",
    "Social Studies",
    "Religious & Moral Education",
    "Elective Mathematics",
]


def seed(apps, schema_editor):
    resolve = SubjectResolver(apps.get_model("subjects", "Subject"))
    for name in DEFAULT_SUBJECTS:
        resolve(name)


class Migration(migrations.Migration):

    dependencies = [
        ("subjects", "0001_initial"),
    ]

    operations = [
        # Reversing leaves the rows: later migrations may reference them.
        migrations.RunPython(seed, migrations.RunPython.noop),
    ]

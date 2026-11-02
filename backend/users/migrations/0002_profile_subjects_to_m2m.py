"""Step 1 of 2: move profile subject lists from JSON arrays of names to Subject M2Ms.
The old columns are kept as legacy_* until 0003."""
from django.db import migrations, models

from subjects.migration_helpers import SubjectResolver

# (model, legacy JSON field, new M2M field)
PROFILE_FIELDS = [
    ("TeacherProfile", "legacy_subjects", "subjects"),
    ("StudentProfile", "legacy_subjects_of_interest", "subjects_of_interest"),
]


def json_to_m2m(apps, schema_editor):
    resolve = SubjectResolver(apps.get_model("subjects", "Subject"))
    for model_name, legacy_field, m2m_field in PROFILE_FIELDS:
        for profile in apps.get_model("users", model_name).objects.all():
            names = getattr(profile, legacy_field) or []
            subjects = {resolve(name) for name in names if isinstance(name, str)} - {None}
            getattr(profile, m2m_field).set(subjects)


def m2m_to_json(apps, schema_editor):
    for model_name, legacy_field, m2m_field in PROFILE_FIELDS:
        for profile in apps.get_model("users", model_name).objects.prefetch_related(m2m_field):
            setattr(profile, legacy_field, [s.name for s in getattr(profile, m2m_field).all()])
            profile.save(update_fields=[legacy_field])


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
        ("subjects", "0002_seed_subjects"),
    ]

    operations = [
        migrations.RenameField(model_name="teacherprofile", old_name="subjects", new_name="legacy_subjects"),
        migrations.RenameField(
            model_name="studentprofile", old_name="subjects_of_interest", new_name="legacy_subjects_of_interest"
        ),
        migrations.AddField(
            model_name="teacherprofile",
            name="subjects",
            field=models.ManyToManyField(blank=True, related_name="teachers", to="subjects.subject"),
        ),
        migrations.AddField(
            model_name="studentprofile",
            name="subjects_of_interest",
            field=models.ManyToManyField(blank=True, related_name="interested_students", to="subjects.subject"),
        ),
        migrations.RunPython(json_to_m2m, m2m_to_json),
    ]

"""Step 1 of 2: move TeacherStudentPairing.subject from free text to a Subject FK.

The old column is kept as legacy_subject until 0004, which drops it once every row
has a subject. The steps are split so each runs in its own transaction on PostgreSQL.
"""
import django.db.models.deletion
from django.db import migrations, models

from subjects.migration_helpers import SubjectResolver


def text_to_fk(apps, schema_editor):
    Pairing = apps.get_model("pairings", "TeacherStudentPairing")
    resolve = SubjectResolver(apps.get_model("subjects", "Subject"))
    for pairing in Pairing.objects.all():
        # A blank legacy subject (never allowed by the API) falls back to "General".
        pairing.subject = resolve(pairing.legacy_subject) or resolve("General")
        pairing.save(update_fields=["subject"])


def fk_to_text(apps, schema_editor):
    Pairing = apps.get_model("pairings", "TeacherStudentPairing")
    for pairing in Pairing.objects.select_related("subject"):
        pairing.legacy_subject = pairing.subject.name
        pairing.save(update_fields=["legacy_subject"])


class Migration(migrations.Migration):

    dependencies = [
        ("pairings", "0002_alter_teacherstudentpairing_unique_together_and_more"),
        ("subjects", "0002_seed_subjects"),
    ]

    operations = [
        migrations.RemoveConstraint(model_name="teacherstudentpairing", name="unique_open_pairing"),
        migrations.RenameField(model_name="teacherstudentpairing", old_name="subject", new_name="legacy_subject"),
        # A default lets 0004 be reversed: re-adding the dropped column needs a value for existing rows.
        migrations.AlterField(
            model_name="teacherstudentpairing",
            name="legacy_subject",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="teacherstudentpairing",
            name="subject",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="pairings",
                to="subjects.subject",
            ),
        ),
        migrations.RunPython(text_to_fk, fk_to_text),
    ]

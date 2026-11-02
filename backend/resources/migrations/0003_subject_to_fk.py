"""Step 1 of 2: move Resource.subject from free text to an optional Subject FK.
The old column is kept as legacy_subject until 0004."""
import django.db.models.deletion
from django.db import migrations, models

from subjects.migration_helpers import SubjectResolver


def text_to_fk(apps, schema_editor):
    Resource = apps.get_model("resources", "Resource")
    resolve = SubjectResolver(apps.get_model("subjects", "Subject"))
    for resource in Resource.objects.exclude(legacy_subject=""):
        resource.subject = resolve(resource.legacy_subject)
        resource.save(update_fields=["subject"])


def fk_to_text(apps, schema_editor):
    Resource = apps.get_model("resources", "Resource")
    for resource in Resource.objects.select_related("subject").exclude(subject=None):
        resource.legacy_subject = resource.subject.name
        resource.save(update_fields=["legacy_subject"])


class Migration(migrations.Migration):

    dependencies = [
        ("resources", "0002_alter_resource_file"),
        ("subjects", "0002_seed_subjects"),
    ]

    operations = [
        migrations.RenameField(model_name="resource", old_name="subject", new_name="legacy_subject"),
        # A default lets 0004 be reversed: re-adding the dropped column needs a value for existing rows.
        migrations.AlterField(
            model_name="resource",
            name="legacy_subject",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="resource",
            name="subject",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="resources",
                to="subjects.subject",
            ),
        ),
        migrations.RunPython(text_to_fk, fk_to_text),
    ]

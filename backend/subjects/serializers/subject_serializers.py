from rest_framework import serializers
from subjects.models import Subject


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "is_active"]

    def validate_name(self, value):
        value = " ".join(value.split())
        duplicate = Subject.objects.filter(name__iexact=value)
        if self.instance:
            duplicate = duplicate.exclude(pk=self.instance.pk)
        if duplicate.exists():
            raise serializers.ValidationError("A subject with this name already exists.")
        return value


class SubjectNameField(serializers.SlugRelatedField):
    """Reads and writes a subject by name, accepting only active subjects on input."""

    def __init__(self, **kwargs):
        kwargs.setdefault("slug_field", "name")
        if not kwargs.get("read_only"):
            kwargs.setdefault("queryset", Subject.objects.filter(is_active=True))
        super().__init__(**kwargs)

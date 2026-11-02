from django.db import models
from django.db.models.functions import Lower
from setup.base_model import BaseModel


class Subject(BaseModel):
    """The agency's curated list of subjects. Retire a subject with is_active=False
    rather than deleting it, so existing pairings and resources keep their subject."""
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(Lower("name"), name="unique_subject_name_ci"),
        ]

    def __str__(self):
        return self.name

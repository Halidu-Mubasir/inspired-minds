"""Helpers for data migrations that turn free-text subject names into Subject rows.

Kept free of model imports: callers pass the historical Subject model from `apps`.
"""


def normalise_name(raw):
    return " ".join(str(raw or "").split())


class SubjectResolver:
    """Maps free-text names to Subject rows, merging names that differ only in case or spacing."""

    def __init__(self, Subject):
        self.Subject = Subject
        self.cache = {}

    def __call__(self, raw):
        name = normalise_name(raw)
        if not name:
            return None
        key = name.lower()
        if key not in self.cache:
            self.cache[key] = (
                self.Subject.objects.filter(name__iexact=name).first()
                or self.Subject.objects.create(name=name)
            )
        return self.cache[key]

from django.apps import AppConfig


class PairingsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "pairings"

    def ready(self):
        import pairings.signals  # noqa: F401

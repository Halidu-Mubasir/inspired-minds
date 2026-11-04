from django.test import SimpleTestCase, TestCase, override_settings

from setup.env import database_from_url


class PlatformEndpointTests(TestCase):
    def test_health_check_needs_no_login(self):
        res = self.client.get("/healthz/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

    def test_api_docs_hidden_unless_enabled(self):
        # Tests run with DEBUG off and EXPOSE_API_DOCS unset, i.e. production defaults.
        self.assertEqual(self.client.get("/swagger/").status_code, 404)


class DatabaseUrlTests(SimpleTestCase):
    def test_neon_style_url(self):
        db = database_from_url(
            "postgresql://app%40im:p%2Fss@ep-cool-1.eu-central-1.aws.neon.tech/inspired_minds"
            "?sslmode=require&channel_binding=require"
        )
        self.assertEqual(db["ENGINE"], "django.db.backends.postgresql")
        self.assertEqual((db["NAME"], db["USER"], db["PASSWORD"]), ("inspired_minds", "app@im", "p/ss"))
        self.assertEqual((db["HOST"], db["PORT"]), ("ep-cool-1.eu-central-1.aws.neon.tech", "5432"))
        self.assertEqual(db["OPTIONS"], {"sslmode": "require", "channel_binding": "require"})

    def test_rejects_other_schemes(self):
        with self.assertRaises(ValueError):
            database_from_url("mysql://u:p@h/db")


S3 = {"bucket_name": "b", "access_key": "k", "secret_key": "s", "endpoint_url": "https://r2.example"}


class PrivateStorageTests(SimpleTestCase):
    def test_local_disk_by_default(self):
        from django.core.files.storage import FileSystemStorage
        from resources.models.resource import private_storage

        self.assertIsInstance(private_storage(), FileSystemStorage)

    @override_settings(STORAGES={
        "default": {"BACKEND": "storages.backends.s3.S3Storage", "OPTIONS": {**S3, "location": "media"}},
        "private": {"BACKEND": "storages.backends.s3.S3Storage", "OPTIONS": {**S3, "location": "private"}},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    })
    def test_bucket_private_prefix_when_configured(self):
        from storages.backends.s3 import S3Storage
        from resources.models.resource import private_storage

        storage = private_storage()
        self.assertIsInstance(storage, S3Storage)
        self.assertEqual(storage.location, "private")

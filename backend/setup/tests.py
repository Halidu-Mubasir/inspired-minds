from django.test import TestCase


class PlatformEndpointTests(TestCase):
    def test_health_check_needs_no_login(self):
        res = self.client.get("/healthz/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

    def test_api_docs_hidden_unless_enabled(self):
        # Tests run with DEBUG off and EXPOSE_API_DOCS unset, i.e. production defaults.
        self.assertEqual(self.client.get("/swagger/").status_code, 404)

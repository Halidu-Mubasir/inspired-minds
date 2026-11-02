from unittest import mock
from urllib.parse import parse_qs, urlparse

from django.conf import settings
from django.core import mail
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from chat.middleware import _get_user_from_token
from setup.testing import client_for, make_user

PASSWORD = "test-pass-123"  # set by make_user
NEW_PASSWORD = "Fresh-Passphrase-2026!"


class AuthTestCase(TestCase):
    def setUp(self):
        cache.clear()  # throttle history
        self.client = APIClient()
        self.teacher = make_user("teacher", "teacher")

    def login(self, user=None, password=PASSWORD):
        res = self.client.post("/api/v1/auth/login/", {"email": (user or self.teacher).email, "password": password})
        self.assertEqual(res.status_code, 200, res.data)
        return res.data["tokens"]

    def refresh(self, refresh_token):
        return self.client.post("/api/v1/auth/token/refresh/", {"refresh": refresh_token})

    def get_me(self, access_token):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        return client.get("/api/v1/auth/me/")


class LoginAndRefreshTests(AuthTestCase):
    def test_login_ignores_stale_authorization_header(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer expired-token")
        self.login()

    def test_login_is_rate_limited(self):
        with mock.patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"login": "2/minute"}):
            statuses = [
                self.client.post("/api/v1/auth/login/", {"email": self.teacher.email, "password": "wrong"}).status_code
                for _ in range(3)
            ]
        self.assertEqual(statuses, [400, 400, 429])

    def test_refresh_rotates_and_old_token_is_rejected(self):
        tokens = self.login()
        res = self.refresh(tokens["refresh_token"])
        self.assertEqual(res.status_code, 200)
        self.assertNotEqual(res.data["refresh"], tokens["refresh_token"])
        self.assertEqual(self.refresh(tokens["refresh_token"]).status_code, 401)
        self.assertEqual(self.refresh(res.data["refresh"]).status_code, 200)

    def test_refresh_refused_for_deactivated_user(self):
        tokens = self.login()
        self.teacher.is_active = False
        self.teacher.save()
        self.assertEqual(self.refresh(tokens["refresh_token"]).status_code, 401)


class LogoutTests(AuthTestCase):
    def test_logout_revokes_refresh_token(self):
        tokens = self.login()
        res = self.client.post("/api/v1/auth/logout/", {"refresh": tokens["refresh_token"]})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.refresh(tokens["refresh_token"]).status_code, 401)

    def test_logout_with_unusable_token_still_succeeds(self):
        res = self.client.post("/api/v1/auth/logout/", {"refresh": "not-a-token"})
        self.assertEqual(res.status_code, 200)

    def test_logout_requires_refresh_token(self):
        self.assertEqual(self.client.post("/api/v1/auth/logout/", {}).status_code, 400)


class DeactivationTests(AuthTestCase):
    def test_deactivating_user_ends_their_sessions(self):
        tokens = self.login()
        admin = make_user("admin", "admin")
        res = client_for(admin).delete(f"/api/v1/auth/teachers/{self.teacher.id}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.refresh(tokens["refresh_token"]).status_code, 401)
        self.assertEqual(self.get_me(tokens["access_token"]).status_code, 401)

    def test_rotated_tokens_are_revoked_too(self):
        rotated = self.refresh(self.login()["refresh_token"]).data["refresh"]
        client_for(make_user("admin", "admin")).delete(f"/api/v1/auth/teachers/{self.teacher.id}/")
        self.teacher.is_active = True  # rule out the inactive-user check; only revocation is under test
        self.teacher.save()
        self.assertEqual(self.refresh(rotated).status_code, 401)

    def test_websocket_auth_rejects_inactive_user(self):
        access = self.login()["access_token"]
        self.assertEqual(_get_user_from_token.func(access), self.teacher)
        self.teacher.is_active = False
        self.teacher.save()
        self.assertFalse(_get_user_from_token.func(access).is_authenticated)

    def test_websocket_auth_rejects_garbage_token(self):
        self.assertFalse(_get_user_from_token.func("garbage").is_authenticated)


class ChangePasswordTests(AuthTestCase):
    def change(self, tokens, new_password):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access_token']}")
        return client.post("/api/v1/auth/change-password/", {
            "old_password": PASSWORD, "new_password": new_password, "new_password2": new_password,
        })

    def test_weak_password_is_rejected(self):
        res = self.change(self.login(), "12345678")
        self.assertEqual(res.status_code, 400)
        self.assertIn("new_password", res.data)

    def test_change_revokes_other_sessions_and_returns_new_tokens(self):
        other_session = self.login()
        res = self.change(self.login(), NEW_PASSWORD)
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(self.refresh(other_session["refresh_token"]).status_code, 401)
        self.assertEqual(self.refresh(res.data["tokens"]["refresh_token"]).status_code, 200)


class PasswordResetTests(AuthTestCase):
    def request_reset(self, email):
        return self.client.post("/api/v1/auth/password-reset/", {"email": email})

    def reset_link_params(self):
        self.assertEqual(len(mail.outbox), 1)
        link = next(word for word in mail.outbox[0].body.split() if word.startswith(settings.FRONTEND_URL))
        self.assertEqual(urlparse(link).path, "/reset-password")
        params = parse_qs(urlparse(link).query)
        return params["uid"][0], params["token"][0]

    def confirm(self, uid, token, password=NEW_PASSWORD, password2=None):
        return self.client.post("/api/v1/auth/password-reset/confirm/", {
            "uid": uid, "token": token, "new_password": password, "new_password2": password2 or password,
        })

    def test_request_sends_email_to_registered_user(self):
        res = self.request_reset(self.teacher.email.upper())
        self.assertEqual(res.status_code, 200)
        self.assertEqual(mail.outbox[0].to, [self.teacher.email])

    def test_request_gives_same_response_for_unknown_or_inactive_email(self):
        known = self.request_reset(self.teacher.email)
        mail.outbox.clear()
        unknown = self.request_reset("nobody@example.com")
        self.teacher.is_active = False
        self.teacher.save()
        inactive = self.request_reset(self.teacher.email)
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(known.data, inactive.data)

    def test_confirm_sets_password_and_ends_sessions(self):
        old_session = self.login()
        self.request_reset(self.teacher.email)
        uid, token = self.reset_link_params()

        res = self.confirm(uid, token)
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(self.refresh(old_session["refresh_token"]).status_code, 401)
        self.login(password=NEW_PASSWORD)

    def test_reset_link_works_only_once(self):
        self.request_reset(self.teacher.email)
        uid, token = self.reset_link_params()
        self.assertEqual(self.confirm(uid, token).status_code, 200)
        res = self.confirm(uid, token, password="Another-Passphrase-99")
        self.assertEqual(res.status_code, 400)
        self.assertIn("token", res.data)

    def test_confirm_rejects_bad_links_and_passwords(self):
        self.request_reset(self.teacher.email)
        uid, token = self.reset_link_params()
        cases = {
            "bad uid": self.confirm("bm90LWEtdXVpZA", token),
            "bad token": self.confirm(uid, "abc-123"),
            "mismatch": self.confirm(uid, token, password2="Something-Else-2026!"),
            "weak": self.confirm(uid, token, password="password"),
        }
        for name, res in cases.items():
            with self.subTest(name):
                self.assertEqual(res.status_code, 400)
        self.login()  # password unchanged

    def test_reset_requests_are_rate_limited(self):
        with mock.patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"password_reset": "2/hour"}):
            statuses = [self.request_reset(self.teacher.email).status_code for _ in range(3)]
        self.assertEqual(statuses, [200, 200, 429])

import shutil
import tempfile
from datetime import date
from unittest import mock

from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from lessons.models import Lesson
from resources.models import Resource, ResourceVisibility
from setup.testing import client_for, make_pairing, make_user


class ResourceAccessTests(TestCase):
    """Teacher A teaches student A; teacher B teaches student B."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")
        cls.teacher_a = make_user("teacher", "teacher_a")
        cls.teacher_b = make_user("teacher", "teacher_b")
        cls.student_a = make_user("student", "student_a")
        cls.student_b = make_user("student", "student_b")
        cls.pairing_a = make_pairing(cls.teacher_a, cls.student_a)
        cls.pairing_b = make_pairing(cls.teacher_b, cls.student_b)
        cls.lesson_a = Lesson.objects.create(pairing=cls.pairing_a, title="Algebra", scheduled_date=date.today())
        cls.lesson_b = Lesson.objects.create(pairing=cls.pairing_b, title="Essays", scheduled_date=date.today())

    def setUp(self):
        # Keep uploaded files out of the real private_media directory.
        self.storage_dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.storage_dir, ignore_errors=True)
        patcher = mock.patch.object(
            Resource._meta.get_field("file"), "storage", FileSystemStorage(location=self.storage_dir)
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def upload(self, user, url="/api/v1/resources/", **fields):
        data = {
            "title": "Notes",
            "resource_type": "note",
            "visibility": "private",
            "file": SimpleUploadedFile("notes.txt", b"secret notes", content_type="text/plain"),
            **fields,
        }
        return client_for(user).post(url, data, format="multipart")

    def private_resource_a(self):
        res = self.upload(self.teacher_a, pairing_id=str(self.pairing_a.id), lesson_id=str(self.lesson_a.id))
        self.assertEqual(res.status_code, 201, res.data)
        return Resource.objects.get(pk=res.data["id"])

    def download(self, user, resource):
        return client_for(user).get(f"/api/v1/resources/{resource.id}/download/")

    # ── Uploading ─────────────────────────────────────────────────────────

    def test_student_cannot_upload(self):
        res = self.upload(self.student_a, pairing_id=str(self.pairing_a.id))
        self.assertEqual(res.status_code, 403)

    def test_teacher_cannot_upload_to_other_teachers_pairing(self):
        res = self.upload(self.teacher_a, pairing_id=str(self.pairing_b.id))
        self.assertEqual(res.status_code, 400)
        self.assertIn("pairing_id", res.data)
        self.assertFalse(Resource.objects.exists())

    def test_teacher_cannot_attach_other_teachers_lesson(self):
        res = self.upload(self.teacher_a, visibility="library", lesson_id=str(self.lesson_b.id))
        self.assertEqual(res.status_code, 400)
        self.assertIn("lesson_id", res.data)

    def test_lesson_must_belong_to_pairing(self):
        other_pairing = make_pairing(self.teacher_a, self.student_b, subject="Physics")
        res = self.upload(self.teacher_a, pairing_id=str(other_pairing.id), lesson_id=str(self.lesson_a.id))
        self.assertEqual(res.status_code, 400)
        self.assertIn("lesson_id", res.data)

    def test_private_upload_requires_pairing(self):
        res = self.upload(self.teacher_a)
        self.assertEqual(res.status_code, 400)
        self.assertIn("pairing_id", res.data)

    def test_library_endpoint_ignores_pairing(self):
        res = self.upload(self.teacher_a, url="/api/v1/resources/library/", pairing_id=str(self.pairing_b.id))
        self.assertEqual(res.status_code, 201, res.data)
        resource = Resource.objects.get(pk=res.data["id"])
        self.assertEqual(resource.visibility, ResourceVisibility.LIBRARY)
        self.assertIsNone(resource.pairing)

    def test_admin_can_upload_to_any_pairing(self):
        res = self.upload(self.admin, pairing_id=str(self.pairing_b.id))
        self.assertEqual(res.status_code, 201, res.data)

    # ── Downloading ───────────────────────────────────────────────────────

    def test_private_resource_download_is_limited_to_pairing(self):
        resource = self.private_resource_a()
        for user, expected in [
            (self.teacher_a, 200), (self.student_a, 200), (self.admin, 200),
            (self.teacher_b, 404), (self.student_b, 404),
        ]:
            with self.subTest(user=user.email):
                self.assertEqual(self.download(user, resource).status_code, expected)

    def test_download_is_an_attachment_with_file_contents(self):
        res = self.download(self.student_a, self.private_resource_a())
        self.assertIn("attachment", res["Content-Disposition"])
        self.assertEqual(b"".join(res.streaming_content), b"secret notes")

    def test_library_resource_downloadable_by_everyone(self):
        res = self.upload(self.teacher_a, url="/api/v1/resources/library/")
        resource = Resource.objects.get(pk=res.data["id"])
        for user in (self.teacher_b, self.student_b):
            with self.subTest(user=user.email):
                self.assertEqual(self.download(user, resource).status_code, 200)

    def test_file_url_points_at_download_endpoint_not_media(self):
        resource = self.private_resource_a()
        res = client_for(self.student_a).get(f"/api/v1/resources/{resource.id}/")
        self.assertIn(f"/api/v1/resources/{resource.id}/download/", res.data["file_url"])
        self.assertNotIn("/media/", res.data["file_url"])

    def test_files_are_not_stored_under_media_root(self):
        resource = self.private_resource_a()
        self.assertTrue(resource.file.path.startswith(self.storage_dir))

    # ── Listing, editing, deleting ────────────────────────────────────────

    def test_private_resources_hidden_from_other_users_lists(self):
        self.private_resource_a()
        for user, expected in [(self.student_a, 1), (self.teacher_a, 1), (self.student_b, 0), (self.teacher_b, 0)]:
            with self.subTest(user=user.email):
                self.assertEqual(client_for(user).get("/api/v1/resources/").data["count"], expected)

    def test_student_cannot_edit_or_delete(self):
        resource = self.private_resource_a()
        client = client_for(self.student_a)
        self.assertEqual(client.patch(f"/api/v1/resources/{resource.id}/", {"title": "x"}).status_code, 403)
        self.assertEqual(client.delete(f"/api/v1/resources/{resource.id}/").status_code, 403)

    def test_teacher_cannot_delete_another_teachers_library_upload(self):
        res = self.upload(self.teacher_a, url="/api/v1/resources/library/")
        url = f"/api/v1/resources/{res.data['id']}/"
        self.assertEqual(client_for(self.teacher_b).delete(url).status_code, 404)
        self.assertTrue(Resource.objects.filter(pk=res.data["id"]).exists())

    def test_uploader_can_delete_and_file_is_removed(self):
        resource = self.private_resource_a()
        self.assertEqual(client_for(self.teacher_a).delete(f"/api/v1/resources/{resource.id}/").status_code, 204)
        self.assertFalse(Resource.objects.filter(pk=resource.id).exists())
        self.assertFalse(FileSystemStorage(location=self.storage_dir).exists(resource.file.name))

    def test_visibility_and_file_metadata_are_read_only(self):
        resource = self.private_resource_a()
        res = client_for(self.teacher_a).patch(
            f"/api/v1/resources/{resource.id}/",
            {"title": "Renamed", "visibility": "library", "mime_type": "text/html"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        resource.refresh_from_db()
        self.assertEqual(resource.title, "Renamed")
        self.assertEqual(resource.visibility, ResourceVisibility.PRIVATE)
        self.assertEqual(resource.mime_type, "text/plain")

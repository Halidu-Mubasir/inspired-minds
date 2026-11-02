from unittest import mock

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from enquiries.models import ContactEnquiry, TutorApplication

CONTACT_URL = "/api/v1/enquiries/contact/"
APPLICATION_URL = "/api/v1/enquiries/tutor-applications/"

CONTACT = {
    "name": "Abena Asante",
    "email": "abena@example.com",
    "level": "jhs",
    "subjects": "Mathematics, Science",
}
APPLICATION = {
    "full_name": "Kwame Asante",
    "email": "kwame@example.com",
    "phone": "0550583636",
    "subjects": "Physics",
    "qualification": "master",
    "experience": "3-5",
}


class EnquirySubmissionTests(TestCase):
    def setUp(self):
        cache.clear()  # throttle history
        self.client = APIClient()

    def test_contact_enquiry_is_stored_without_login(self):
        res = self.client.post(CONTACT_URL, CONTACT, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        enquiry = ContactEnquiry.objects.get()
        self.assertEqual(enquiry.email, "abena@example.com")
        self.assertFalse(enquiry.is_handled)

    def test_tutor_application_is_stored_without_login(self):
        res = self.client.post(APPLICATION_URL, APPLICATION, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(TutorApplication.objects.get().qualification, "master")

    def test_invalid_choice_is_rejected(self):
        res = self.client.post(CONTACT_URL, {**CONTACT, "level": "postgrad"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("level", res.data)
        self.assertFalse(ContactEnquiry.objects.exists())

    def test_missing_required_fields_are_rejected(self):
        res = self.client.post(APPLICATION_URL, {"email": "x@example.com"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("phone", res.data)

    def test_stale_auth_header_does_not_block_submission(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer expired-token")
        self.assertEqual(self.client.post(CONTACT_URL, CONTACT, format="json").status_code, 201)

    def test_submissions_are_rate_limited(self):
        with mock.patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"enquiries": "2/hour"}):
            statuses = [self.client.post(CONTACT_URL, CONTACT, format="json").status_code for _ in range(3)]
        self.assertEqual(statuses, [201, 201, 429])
        self.assertEqual(ContactEnquiry.objects.count(), 2)

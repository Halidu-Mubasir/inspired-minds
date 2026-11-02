from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle

from enquiries.serializers import ContactEnquirySerializer, TutorApplicationSerializer


class PublicSubmissionView(generics.CreateAPIView):
    """Unauthenticated, rate-limited submission from the public marketing website."""
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "enquiries"


class ContactEnquiryCreateView(PublicSubmissionView):
    serializer_class = ContactEnquirySerializer


class TutorApplicationCreateView(PublicSubmissionView):
    serializer_class = TutorApplicationSerializer

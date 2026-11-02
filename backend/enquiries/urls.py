from django.urls import path
from enquiries.views import ContactEnquiryCreateView, TutorApplicationCreateView

urlpatterns = [
    path("contact/", ContactEnquiryCreateView.as_view(), name="contact-enquiry-create"),
    path("tutor-applications/", TutorApplicationCreateView.as_view(), name="tutor-application-create"),
]

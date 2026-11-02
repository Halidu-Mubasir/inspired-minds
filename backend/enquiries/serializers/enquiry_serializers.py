from rest_framework import serializers
from enquiries.models import ContactEnquiry, TutorApplication


class ContactEnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactEnquiry
        fields = ["name", "email", "phone", "level", "subjects", "message"]


class TutorApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorApplication
        fields = ["full_name", "email", "phone", "subjects", "qualification", "experience", "message"]

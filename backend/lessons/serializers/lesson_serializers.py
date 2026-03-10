from rest_framework import serializers
from lessons.models import Lesson, LessonTopic


class LessonTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonTopic
        fields = ["id", "title", "description", "order", "is_completed", "created_at", "updated_at"]


class LessonListSerializer(serializers.ModelSerializer):
    pairing_id = serializers.UUIDField(source="pairing.id")
    subject = serializers.CharField(source="pairing.subject")
    teacher_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    topic_count = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id", "title", "status", "scheduled_date", "scheduled_time",
            "duration_minutes", "pairing_id", "subject", "teacher_name",
            "student_name", "topic_count", "created_at", "updated_at",
        ]

    def get_teacher_name(self, obj):
        t = obj.pairing.teacher
        return f"{t.first_name} {t.last_name}"

    def get_student_name(self, obj):
        s = obj.pairing.student
        return f"{s.first_name} {s.last_name}"

    def get_topic_count(self, obj):
        return obj.topics.count()


class LessonDetailSerializer(serializers.ModelSerializer):
    topics = LessonTopicSerializer(many=True, read_only=True)
    pairing_id = serializers.UUIDField(source="pairing.id", read_only=True)
    subject = serializers.CharField(source="pairing.subject", read_only=True)
    teacher = serializers.SerializerMethodField()
    student = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id", "pairing_id", "subject", "teacher", "student",
            "title", "description", "scheduled_date", "scheduled_time",
            "duration_minutes", "status", "teacher_notes", "student_notes",
            "homework", "topics", "created_at", "updated_at",
        ]

    def get_teacher(self, obj):
        t = obj.pairing.teacher
        return {"id": str(t.id), "first_name": t.first_name, "last_name": t.last_name, "avatar": t.avatar.url if t.avatar else None}

    def get_student(self, obj):
        s = obj.pairing.student
        return {"id": str(s.id), "first_name": s.first_name, "last_name": s.last_name, "avatar": s.avatar.url if s.avatar else None}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and hasattr(request.user, "role") and request.user.role == "student":
            data.pop("teacher_notes", None)
        return data


class CreateLessonSerializer(serializers.ModelSerializer):
    pairing_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Lesson
        fields = [
            "pairing_id", "title", "description", "scheduled_date",
            "scheduled_time", "duration_minutes", "teacher_notes",
            "student_notes", "homework",
        ]

    def validate_pairing_id(self, value):
        from pairings.models import TeacherStudentPairing, PairingStatus
        request = self.context["request"]
        try:
            pairing = TeacherStudentPairing.objects.get(id=value)
        except TeacherStudentPairing.DoesNotExist:
            raise serializers.ValidationError("Pairing not found.")
        if request.user.role == "teacher" and pairing.teacher_id != request.user.id:
            raise serializers.ValidationError("You can only create lessons for your own pairings.")
        if pairing.status == PairingStatus.ENDED:
            raise serializers.ValidationError("Cannot create lessons for an ended pairing.")
        return value

    def create(self, validated_data):
        pairing_id = validated_data.pop("pairing_id")
        from pairings.models import TeacherStudentPairing
        pairing = TeacherStudentPairing.objects.get(id=pairing_id)
        return Lesson.objects.create(pairing=pairing, **validated_data)


class UpdateLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = [
            "title", "description", "scheduled_date", "scheduled_time",
            "duration_minutes", "teacher_notes", "student_notes", "homework",
        ]


class LessonStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["status"]

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.utils import datetime_from_epoch
from users.models import CustomUser


def _validate_new_password(password, user):
    try:
        validate_password(password, user)
    except DjangoValidationError as e:
        raise serializers.ValidationError({"new_password": list(e.messages)})


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email", "").lower().strip()
        password = data.get("password")
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")
        data["user"] = user
        return data


class RefreshSerializer(TokenRefreshSerializer):
    """Token refresh that refuses deactivated users and records rotated tokens as
    outstanding, so revoke_refresh_tokens() can reach them later."""

    def validate(self, attrs):
        user_id = RefreshToken(attrs["refresh"]).payload.get(jwt_settings.USER_ID_CLAIM)
        if not CustomUser.objects.filter(id=user_id, is_active=True).exists():
            raise AuthenticationFailed("User is inactive or no longer exists.", code="user_inactive")

        data = super().validate(attrs)
        if "refresh" in data:
            rotated = RefreshToken(data["refresh"])
            OutstandingToken.objects.create(
                user_id=user_id,
                jti=rotated[jwt_settings.JTI_CLAIM],
                token=str(rotated),
                created_at=rotated.current_time,
                expires_at=datetime_from_epoch(rotated["exp"]),
            )
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match."})
        _validate_new_password(data["new_password"], self.context["request"].user)
        return data

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, data):
        invalid_link = serializers.ValidationError({"token": "This reset link is invalid or has expired."})
        try:
            user = CustomUser.objects.get(pk=urlsafe_base64_decode(data["uid"]).decode(), is_active=True)
        except (ValueError, TypeError, OverflowError, DjangoValidationError, CustomUser.DoesNotExist):
            raise invalid_link
        if not default_token_generator.check_token(user, data["token"]):
            raise invalid_link
        if data["new_password"] != data["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match."})
        _validate_new_password(data["new_password"], user)
        data["user"] = user
        return data

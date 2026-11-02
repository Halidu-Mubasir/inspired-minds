from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from users.emails import send_password_reset_email
from users.models import CustomUser
from users.serializers import (
    LoginSerializer,
    LogoutSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    UserSerializer,
)
from users.tokens import revoke_refresh_tokens


class PublicAuthView(APIView):
    """Endpoints used without a valid session. Skipping authentication means a stale
    Authorization header from an expired session cannot turn the request into a 401."""
    authentication_classes = []
    permission_classes = [AllowAny]


class LoginView(PublicAuthView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        tokens = user.tokens()
        user_data = UserSerializer(user).data
        return Response(
            {"message": "Login successful.", "tokens": tokens, "user": user_data},
            status=status.HTTP_200_OK,
        )


class LogoutView(PublicAuthView):
    """Blacklists the session's refresh token. Holding the token is proof enough to revoke it."""

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            RefreshToken(serializer.validated_data["refresh"]).blacklist()
        except TokenError:
            pass  # Already expired or revoked: the session is over either way.
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        # Sign out every other session; this one continues with fresh tokens.
        revoke_refresh_tokens(request.user)
        return Response(
            {"message": "Password changed successfully.", "tokens": request.user.tokens()},
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(PublicAuthView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = CustomUser.objects.filter(email__iexact=serializer.validated_data["email"], is_active=True).first()
        if user:
            send_password_reset_email(user)
        # Same response either way, so the endpoint cannot be used to discover accounts.
        return Response(
            {"message": "If that email is registered, a password reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(PublicAuthView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        revoke_refresh_tokens(user)
        return Response({"message": "Password has been reset. Please sign in."}, status=status.HTTP_200_OK)

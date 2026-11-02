from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


def send_password_reset_email(user):
    query = urlencode({
        "uid": urlsafe_base64_encode(force_bytes(user.pk)),
        "token": default_token_generator.make_token(user),
    })
    link = f"{settings.FRONTEND_URL}/reset-password?{query}"
    hours = settings.PASSWORD_RESET_TIMEOUT // 3600
    send_mail(
        subject="Reset your Inspired Minds password",
        message=(
            f"Hello {user.first_name},\n\n"
            f"We received a request to reset the password for your Inspired Minds account.\n"
            f"Use the link below to choose a new password. It expires in {hours} hours.\n\n"
            f"{link}\n\n"
            f"If you did not ask for this, you can ignore this email; your password will not change."
        ),
        from_email=None,
        recipient_list=[user.email],
    )

"""Turn uploaded resources and lessons into model input."""
from __future__ import annotations

from django.conf import settings

from ai_services.providers import Attachment

# Formats the model reads natively. Word, PowerPoint and Excel files would need text
# extraction first, so they are not offered.
_KINDS = {
    "pdf": ("pdf", "application/pdf"),
    "png": ("image", "image/png"),
    "jpg": ("image", "image/jpeg"),
    "jpeg": ("image", "image/jpeg"),
    "gif": ("image", "image/gif"),
    "webp": ("image", "image/webp"),
    "txt": ("text", "text/plain"),
}
SUPPORTED_EXTENSIONS = tuple(sorted(_KINDS))


class AttachmentError(ValueError):
    pass


def _extension(file_name: str) -> str:
    return file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""


def is_supported(resource) -> bool:
    # Judged by extension: the stored mime type comes from the uploader's browser.
    return _extension(resource.file_name) in _KINDS


def resource_attachment(resource) -> Attachment:
    """Read a resource's file for the model, or raise AttachmentError with a user-facing reason."""
    if not is_supported(resource):
        raise AttachmentError(
            f"The AI can read PDFs, images and .txt files, not .{_extension(resource.file_name) or '?'} files."
        )
    max_bytes = settings.AI_MAX_ATTACHMENT_MB * 1024 * 1024
    if resource.file_size > max_bytes:
        raise AttachmentError(f"That file is too large for the AI (limit {settings.AI_MAX_ATTACHMENT_MB} MB).")
    kind, media_type = _KINDS[_extension(resource.file_name)]
    try:
        with resource.file.open("rb") as handle:
            data = handle.read()
    except (FileNotFoundError, OSError) as error:
        raise AttachmentError("That file could not be found.") from error
    return Attachment(kind=kind, media_type=media_type, data=data, title=resource.title)


def lesson_brief(lesson) -> str:
    """Lesson details to ground a teacher tool. Private teacher notes are left out on purpose."""
    parts = [f"Lesson: {lesson.title}", f"Subject: {lesson.pairing.subject.name}"]
    if lesson.description:
        parts.append(f"Description: {lesson.description}")
    topics = [t.title for t in lesson.topics.all()]
    if topics:
        parts.append("Topics: " + "; ".join(topics))
    if lesson.student_notes:
        parts.append(f"Notes shared with the student:\n{lesson.student_notes}")
    if lesson.homework:
        parts.append(f"Homework:\n{lesson.homework}")
    return "\n".join(parts)

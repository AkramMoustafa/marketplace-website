import os
import uuid
import aiofiles
from fastapi import HTTPException, UploadFile, status
from app.config.settings import get_settings

settings = get_settings()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


async def save_upload(file: UploadFile, subfolder: str = "vehicles") -> str:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type not allowed. Accepted: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    folder = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)
    filepath = os.path.join(folder, filename)

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(contents)

    return f"/uploads/{subfolder}/{filename}"


async def delete_upload(url_path: str) -> None:
    relative = url_path.lstrip("/uploads/")
    filepath = os.path.join(settings.UPLOAD_DIR, relative)
    if os.path.exists(filepath):
        os.remove(filepath)

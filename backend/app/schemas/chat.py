from pydantic import BaseModel, field_validator


class ChatRequest(BaseModel):
    message: str
    sessionId: str

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message is required")
        return v.strip()

    @field_validator("sessionId")
    @classmethod
    def session_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("sessionId is required")
        return v.strip()


class ChatResponse(BaseModel):
    response: str
    sessionId: str
    vehicles: list[dict] | None = None

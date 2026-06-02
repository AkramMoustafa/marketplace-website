import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import get_settings
from app.db.session import async_engine, get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat.agent import clear_session, run_agent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def chat_endpoint(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is not configured on the server.",
        )

    try:
        response, vehicles = await run_agent(body.sessionId, body.message, db)
        return ChatResponse(response=response, sessionId=body.sessionId, vehicles=vehicles)
    except Exception as exc:
        logger.exception("[chat] unhandled error session_id=%s: %s", body.sessionId, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )


@router.delete("/session/{session_id}", status_code=status.HTTP_200_OK)
async def clear_session_endpoint(session_id: str):
    clear_session(session_id)
    return {"ok": True}


@router.get("/health")
async def chat_health():
    settings = get_settings()

    db_ok = False
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        logger.warning("[chat/health] db probe failed: %s", exc)

    return {
        "status": "ok",
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "langchain_configured": True,
        "database_connected": db_ok,
        "model": "gpt-4o-mini",
    }

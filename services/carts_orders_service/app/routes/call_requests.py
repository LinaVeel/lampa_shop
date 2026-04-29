from fastapi import APIRouter, Depends

from app import db
from app.deps import require_admin
from app.errors import BadRequestError, NotFoundError
from app.schemas import CallRequestCreate, CallRequestResponse, CallRequestUpdate

router = APIRouter(prefix="/call-requests", tags=["call-requests"])


async def _get_call_request(request_id: int) -> dict:
    call_request = await db.fetch_one(
        """
        SELECT id, session_id, name, phone, comment, status, created_at, processed_at
        FROM call_requests
        WHERE id = %s
        """,
        (request_id,),
    )
    if not call_request:
        raise NotFoundError("Call request not found")
    return call_request


@router.post("", response_model=CallRequestResponse)
async def create_call_request(payload: CallRequestCreate) -> dict:
    call_request = await db.fetch_one(
        """
        INSERT INTO call_requests (session_id, name, phone, comment)
        VALUES (%s, %s, %s, %s)
        RETURNING id, session_id, name, phone, comment, status, created_at, processed_at
        """,
        (payload.session_id, payload.name, payload.phone, payload.comment),
    )
    if not call_request:
        raise BadRequestError("Failed to create call request")
    return call_request


@router.get(
    "", response_model=list[CallRequestResponse], dependencies=[Depends(require_admin)]
)
async def list_call_requests() -> list[dict]:
    return await db.fetch_all(
        """
        SELECT id, session_id, name, phone, comment, status, created_at, processed_at
        FROM call_requests
        ORDER BY created_at DESC
        """
    )


@router.get(
    "/{request_id}",
    response_model=CallRequestResponse,
    dependencies=[Depends(require_admin)],
)
async def get_call_request(request_id: int) -> dict:
    return await _get_call_request(request_id)


@router.patch(
    "/{request_id}",
    response_model=CallRequestResponse,
    dependencies=[Depends(require_admin)],
)
async def update_call_request(request_id: int, payload: CallRequestUpdate) -> dict:
    await _get_call_request(request_id)
    if payload.status != "new":
        await db.execute(
            "UPDATE call_requests SET status = %s, processed_at = NOW() WHERE id = %s",
            (payload.status, request_id),
        )
    else:
        await db.execute(
            "UPDATE call_requests SET status = %s, processed_at = NULL WHERE id = %s",
            (payload.status, request_id),
        )
    return await _get_call_request(request_id)


@router.delete("/{request_id}", dependencies=[Depends(require_admin)])
async def delete_call_request(request_id: int) -> dict:
    await _get_call_request(request_id)
    await db.execute("DELETE FROM call_requests WHERE id = %s", (request_id,))
    return {"id": request_id}

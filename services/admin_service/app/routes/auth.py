from datetime import datetime, timedelta

from fastapi import APIRouter, Depends

from app import db, auth
from app.config import settings
from app.deps import get_current_admin
from app.errors import UnauthorizedError, BadRequestError, NotFoundError
from app.schemas import (
    AdminLogin,
    TokenResponse,
    RefreshTokenRequest,
    UpdateEmailRequest,
    ChangePasswordRequest,
    AdminResponse,
    SetActiveRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(credentials: AdminLogin):
    """Login with email and password."""
    admin = await db.fetch_one(
        "SELECT id, password_hash, is_active FROM admins WHERE email = %s",
        (credentials.email,),
    )

    if not admin or not auth.verify_password(
        credentials.password, admin["password_hash"]
    ):
        raise UnauthorizedError("Invalid email or password")

    if not admin["is_active"]:
        raise UnauthorizedError("Admin account is inactive")

    access_token = auth.create_access_token(admin["id"])
    refresh_token = auth.create_refresh_token(admin["id"])

    # Store refresh token hash in DB
    token_hash = auth.hash_token(refresh_token)
    expires_at = datetime.utcnow() + timedelta(
        days=settings.jwt_refresh_expiration_days
    )

    await db.execute(
        "INSERT INTO admin_refresh_tokens (admin_id, token, expires_at) VALUES (%s, %s, %s)",
        (admin["id"], token_hash, expires_at),
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: RefreshTokenRequest):
    """Refresh access token using refresh token."""
    payload = auth.verify_token(request.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid or expired refresh token")

    admin_id = payload.get("admin_id")
    token_hash = auth.hash_token(request.refresh_token)

    # Check if refresh token exists and is not revoked
    token_record = await db.fetch_one(
        "SELECT id, revoked FROM admin_refresh_tokens WHERE admin_id = %s AND token = %s",
        (admin_id, token_hash),
    )

    if not token_record or token_record["revoked"]:
        raise UnauthorizedError("Refresh token has been revoked or does not exist")

    # Create new tokens
    new_access_token = auth.create_access_token(admin_id)
    new_refresh_token = auth.create_refresh_token(admin_id)
    new_token_hash = auth.hash_token(new_refresh_token)
    new_expires_at = datetime.utcnow() + timedelta(
        days=settings.jwt_refresh_expiration_days
    )

    # Revoke old token and store new one
    await db.execute(
        "UPDATE admin_refresh_tokens SET revoked = TRUE WHERE id = %s",
        (token_record["id"],),
    )

    await db.execute(
        "INSERT INTO admin_refresh_tokens (admin_id, token, expires_at) VALUES (%s, %s, %s)",
        (admin_id, new_token_hash, new_expires_at),
    )

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(current_admin: dict = Depends(get_current_admin)):
    """Logout by revoking all refresh tokens."""
    await db.execute(
        "UPDATE admin_refresh_tokens SET revoked = TRUE WHERE admin_id = %s",
        (current_admin["admin_id"],),
    )

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=AdminResponse)
async def get_current(current_admin: dict = Depends(get_current_admin)):
    """Get current admin profile."""
    admin = await db.fetch_one(
        "SELECT id, email, is_active, created_at, updated_at FROM admins WHERE id = %s",
        (current_admin["admin_id"],),
    )

    if not admin:
        raise NotFoundError("Admin not found")

    return {
        **admin,
    }


@router.patch("/me/email", response_model=AdminResponse)
async def update_email(
    request: UpdateEmailRequest, current_admin: dict = Depends(get_current_admin)
):
    """Update admin email."""
    # Check if email already exists
    existing = await db.fetch_one(
        "SELECT id FROM admins WHERE email = %s AND id != %s",
        (request.new_email, current_admin["admin_id"]),
    )

    if existing:
        raise BadRequestError("Email already in use")

    await db.execute(
        "UPDATE admins SET email = %s WHERE id = %s",
        (request.new_email, current_admin["admin_id"]),
    )

    admin = await db.fetch_one(
        "SELECT id, email, is_active, created_at, updated_at FROM admins WHERE id = %s",
        (current_admin["admin_id"],),
    )

    return {**admin}


@router.post("/me/change-password")
async def change_password(
    request: ChangePasswordRequest, current_admin: dict = Depends(get_current_admin)
):
    """Change admin password."""
    admin = await db.fetch_one(
        "SELECT password_hash FROM admins WHERE id = %s",
        (current_admin["admin_id"],),
    )

    if not admin or not auth.verify_password(
        request.current_password, admin["password_hash"]
    ):
        raise UnauthorizedError("Current password is incorrect")

    new_hash = auth.hash_password(request.new_password)
    await db.execute(
        "UPDATE admins SET password_hash = %s WHERE id = %s",
        (new_hash, current_admin["admin_id"]),
    )

    # Revoke all refresh tokens on password change
    await db.execute(
        "UPDATE admin_refresh_tokens SET revoked = TRUE WHERE admin_id = %s",
        (current_admin["admin_id"],),
    )

    return {"message": "Password changed successfully. Please login again."}


@router.get("/{admin_id}", response_model=AdminResponse)
async def get_admin(admin_id: int, current_admin: dict = Depends(get_current_admin)):
    """Get admin by ID (only self or another admin)."""
    admin = await db.fetch_one(
        "SELECT id, email, is_active, created_at, updated_at FROM admins WHERE id = %s",
        (admin_id,),
    )

    if not admin:
        raise NotFoundError("Admin not found")

    return {
        **admin,
    }


@router.patch("/{admin_id}/active")
async def set_admin_active(
    admin_id: int,
    request: SetActiveRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Set admin active/inactive status (self only)."""
    if current_admin["admin_id"] != admin_id:
        raise UnauthorizedError("Can only modify your own account")

    await db.execute(
        "UPDATE admins SET is_active = %s WHERE id = %s",
        (request.is_active, admin_id),
    )

    return {"message": f"Admin status updated to {request.is_active}"}

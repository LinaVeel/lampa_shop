from datetime import datetime, timedelta
from typing import Optional
import jwt
import hashlib
import secrets

from app.config import settings


def hash_password(password: str) -> str:
    """Hash password using bcrypt-like approach (simplified for demo)."""
    # In production, use bcrypt or argon2
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}${hashed.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash."""
    try:
        salt, hashed = password_hash.split("$")
        check_hash = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), salt.encode(), 100000
        )
        return check_hash.hex() == hashed
    except:
        return False


def create_access_token(admin_id: int) -> str:
    """Create JWT access token."""
    expires = datetime.utcnow() + timedelta(
        minutes=settings.jwt_access_expiration_minutes
    )
    payload = {
        "admin_id": admin_id,
        "exp": expires,
        "iat": datetime.utcnow(),
        "type": "access",
    }
    return jwt.encode(
        payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )


def create_refresh_token(admin_id: int) -> str:
    """Create JWT refresh token."""
    expires = datetime.utcnow() + timedelta(days=settings.jwt_refresh_expiration_days)
    payload = {
        "admin_id": admin_id,
        "exp": expires,
        "iat": datetime.utcnow(),
        "type": "refresh",
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(
        payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def hash_token(token: str) -> str:
    """Hash refresh token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()

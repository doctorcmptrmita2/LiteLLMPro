"""
CF-X Router Authentication Module

Provides API key authentication middleware and utilities.
"""

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from cfx.security import hash_api_key, is_valid_api_key_format

logger = logging.getLogger(__name__)


@dataclass
class AuthResult:
    """Result of authentication attempt."""
    authenticated: bool
    user_id: Optional[str] = None
    api_key_id: Optional[int] = None
    key_prefix: Optional[str] = None
    error: Optional[str] = None


class AuthModule:
    """
    API Key Authentication Module.
    
    Handles extraction and verification of API keys from requests.
    """
    
    def __init__(self, db_pool: Optional[Any] = None, hash_salt: str = "default-salt"):
        """
        Initialize authentication module.
        
        Args:
            db_pool: Database connection pool for key lookup (optional)
            hash_salt: Salt for API key hashing
        """
        self.db_pool = db_pool
        self.hash_salt = hash_salt
    
    def extract_bearer_token(self, authorization: Optional[str]) -> Optional[str]:
        """
        Extract Bearer token from Authorization header value.
        
        Args:
            authorization: Authorization header value
            
        Returns:
            API key string or None if not present
        """
        if not authorization:
            return None
        
        # Check for Bearer prefix
        parts = authorization.split(" ", 1)
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        
        return parts[1].strip()
    
    async def verify_api_key(self, api_key: str) -> AuthResult:
        """
        Verify an API key against the database.
        
        Args:
            api_key: Raw API key to verify
            
        Returns:
            AuthResult with authentication status
        """
        # Validate format first
        if not is_valid_api_key_format(api_key):
            logger.warning("Invalid API key format")
            return AuthResult(authenticated=False, error="Invalid API key format")
        
        # If no database, use development mode
        if self.db_pool is None:
            logger.warning("No database configured, using development mode")
            # In dev mode, accept any valid format key
            return AuthResult(
                authenticated=True,
                user_id="dev-user",
                api_key_id=0,
                key_prefix=api_key[:8],
            )
        
        # Hash the key
        key_hash = hash_api_key(api_key, self.hash_salt)
        
        # Look up in database
        try:
            async with self.db_pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                    SELECT id, user_id, key_prefix, status
                    FROM api_keys
                    WHERE key_hash = $1
                    """,
                    key_hash
                )
        except Exception as e:
            logger.error(f"Database error during auth: {e}")
            return AuthResult(authenticated=False, error="Authentication service error")
        
        if row is None:
            logger.warning("API key not found")
            return AuthResult(authenticated=False, error="Invalid API key")
        
        # Check if key is active
        if row["status"] != "active":
            logger.warning(f"API key is {row['status']}")
            return AuthResult(authenticated=False, error="API key is revoked")
        
        # Update last_used_at (fire and forget)
        try:
            async with self.db_pool.acquire() as conn:
                await conn.execute(
                    "UPDATE api_keys SET last_used_at = $1 WHERE id = $2",
                    datetime.utcnow(),
                    row["id"]
                )
        except Exception as e:
            # Don't fail auth if update fails
            logger.error(f"Failed to update last_used_at: {e}")
        
        return AuthResult(
            authenticated=True,
            user_id=str(row["user_id"]),
            api_key_id=row["id"],
            key_prefix=row["key_prefix"],
        )
    
    async def authenticate(self, authorization: Optional[str]) -> AuthResult:
        """
        Authenticate a request using Authorization header value.
        
        Args:
            authorization: Authorization header value
            
        Returns:
            AuthResult with authentication status
        """
        # Extract token
        api_key = self.extract_bearer_token(authorization)
        
        if api_key is None:
            return AuthResult(
                authenticated=False,
                error="Missing or invalid Authorization header"
            )
        
        # Verify key
        return await self.verify_api_key(api_key)

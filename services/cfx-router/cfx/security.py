"""
CF-X Router Security Module

Provides secure hashing and comparison utilities for API keys.
"""

import hashlib
import hmac
import secrets
import string
from typing import Tuple


def hash_api_key(api_key: str, salt: str) -> str:
    """
    Hash an API key using SHA-256 with salt.
    
    Args:
        api_key: The raw API key to hash
        salt: Salt value for hashing
        
    Returns:
        Hexadecimal hash string
    """
    # Combine key with salt
    salted_key = f"{salt}:{api_key}"
    
    # Use SHA-256 for hashing
    return hashlib.sha256(salted_key.encode("utf-8")).hexdigest()


def verify_api_key(api_key: str, stored_hash: str, salt: str) -> bool:
    """
    Verify an API key against a stored hash using constant-time comparison.
    
    Args:
        api_key: The raw API key to verify
        stored_hash: The stored hash to compare against
        salt: Salt value used for hashing
        
    Returns:
        True if the key matches, False otherwise
    """
    # Hash the provided key
    computed_hash = hash_api_key(api_key, salt)
    
    # Use constant-time comparison to prevent timing attacks
    return hmac.compare_digest(computed_hash, stored_hash)


def generate_api_key(prefix: str = "cfx") -> Tuple[str, str]:
    """
    Generate a new API key with prefix.
    
    Args:
        prefix: Prefix for the key (default: "cfx")
        
    Returns:
        Tuple of (full_key, key_prefix)
        - full_key: The complete API key (e.g., "cfx_abc123...")
        - key_prefix: First 8 characters for identification
    """
    # Generate 32 random bytes, encode as base62
    alphabet = string.ascii_letters + string.digits
    random_part = "".join(secrets.choice(alphabet) for _ in range(32))
    
    # Create full key with prefix
    full_key = f"{prefix}_{random_part}"
    
    # Key prefix for identification (first 8 chars after prefix)
    key_prefix = f"{prefix}_{random_part[:4]}"
    
    return full_key, key_prefix


def extract_key_prefix(api_key: str) -> str:
    """
    Extract the prefix portion of an API key for identification.
    
    Args:
        api_key: Full API key
        
    Returns:
        Key prefix (e.g., "cfx_abc1" from "cfx_abc123...")
    """
    parts = api_key.split("_", 1)
    if len(parts) != 2:
        return api_key[:8] if len(api_key) >= 8 else api_key
    
    prefix, rest = parts
    return f"{prefix}_{rest[:4]}" if len(rest) >= 4 else api_key[:8]


def is_valid_api_key_format(api_key: str) -> bool:
    """
    Check if an API key has valid format.
    
    Valid format: prefix_randomchars (e.g., "cfx_abc123...")
    - Must have prefix and random part separated by underscore
    - Random part must be at least 16 characters
    - Only alphanumeric characters allowed
    
    Args:
        api_key: API key to validate
        
    Returns:
        True if format is valid, False otherwise
    """
    if not api_key or not isinstance(api_key, str):
        return False
    
    parts = api_key.split("_", 1)
    if len(parts) != 2:
        return False
    
    prefix, random_part = parts
    
    # Prefix must be alphanumeric and 2-10 chars
    if not prefix.isalnum() or not (2 <= len(prefix) <= 10):
        return False
    
    # Random part must be alphanumeric and at least 16 chars
    if not random_part.isalnum() or len(random_part) < 16:
        return False
    
    return True

"""
Tests for CF-X Router Authentication Module.

Includes property-based tests using Hypothesis.
"""

import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import AsyncMock, MagicMock

from cfx.security import (
    hash_api_key,
    verify_api_key,
    generate_api_key,
    extract_key_prefix,
    is_valid_api_key_format,
)
from cfx.auth import AuthModule, AuthResult


# =============================================================================
# Property Tests
# =============================================================================

class TestAuthenticationProperties:
    """
    Property-based tests for authentication.
    
    **Feature: cfx-router, Property 1: Authentication Validation**
    **Feature: cfx-router, Property 2: API Key Hashing Consistency**
    **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
    """
    
    @given(
        api_key=st.text(
            alphabet=st.characters(whitelist_categories=("L", "N")),
            min_size=20,
            max_size=50
        ),
        salt=st.text(min_size=8, max_size=32)
    )
    @settings(max_examples=100)
    def test_property_hash_consistency(self, api_key: str, salt: str):
        """
        Property 2: API Key Hashing Consistency
        
        *For any* API key and salt, hashing the same key with the same salt
        should always produce the same hash.
        
        **Validates: Requirements 1.5**
        """
        hash1 = hash_api_key(api_key, salt)
        hash2 = hash_api_key(api_key, salt)
        
        assert hash1 == hash2, "Same key and salt should produce same hash"
    
    @given(
        api_key=st.text(
            alphabet=st.characters(whitelist_categories=("L", "N")),
            min_size=20,
            max_size=50
        ),
        salt=st.text(min_size=8, max_size=32)
    )
    @settings(max_examples=100)
    def test_property_verify_matches_hash(self, api_key: str, salt: str):
        """
        Property 1: Authentication Validation (Round-trip)
        
        *For any* API key, hashing and then verifying with the same key
        should always succeed.
        
        **Validates: Requirements 1.1, 1.2**
        """
        stored_hash = hash_api_key(api_key, salt)
        
        assert verify_api_key(api_key, stored_hash, salt), \
            "Verification should succeed for correct key"
    
    @given(
        api_key1=st.text(
            alphabet=st.characters(whitelist_categories=("L", "N")),
            min_size=20,
            max_size=50
        ),
        api_key2=st.text(
            alphabet=st.characters(whitelist_categories=("L", "N")),
            min_size=20,
            max_size=50
        ),
        salt=st.text(min_size=8, max_size=32)
    )
    @settings(max_examples=100)
    def test_property_different_keys_different_hashes(
        self, api_key1: str, api_key2: str, salt: str
    ):
        """
        Property: Different keys produce different hashes.
        
        *For any* two different API keys with the same salt,
        the hashes should be different.
        
        **Validates: Requirements 1.5**
        """
        if api_key1 == api_key2:
            return  # Skip if keys happen to be the same
        
        hash1 = hash_api_key(api_key1, salt)
        hash2 = hash_api_key(api_key2, salt)
        
        assert hash1 != hash2, "Different keys should produce different hashes"
    
    @given(
        api_key=st.text(
            alphabet=st.characters(whitelist_categories=("L", "N")),
            min_size=20,
            max_size=50
        ),
        wrong_key=st.text(
            alphabet=st.characters(whitelist_categories=("L", "N")),
            min_size=20,
            max_size=50
        ),
        salt=st.text(min_size=8, max_size=32)
    )
    @settings(max_examples=100)
    def test_property_wrong_key_fails_verification(
        self, api_key: str, wrong_key: str, salt: str
    ):
        """
        Property: Wrong key fails verification.
        
        *For any* API key, verifying with a different key should fail.
        
        **Validates: Requirements 1.3, 1.4**
        """
        if api_key == wrong_key:
            return  # Skip if keys happen to be the same
        
        stored_hash = hash_api_key(api_key, salt)
        
        assert not verify_api_key(wrong_key, stored_hash, salt), \
            "Verification should fail for wrong key"


# =============================================================================
# Unit Tests
# =============================================================================

class TestHashApiKey:
    """Unit tests for hash_api_key function."""
    
    def test_hash_returns_hex_string(self):
        """Hash should return a hexadecimal string."""
        result = hash_api_key("test_key", "salt")
        assert all(c in "0123456789abcdef" for c in result)
    
    def test_hash_length_is_64(self):
        """SHA-256 hash should be 64 characters."""
        result = hash_api_key("test_key", "salt")
        assert len(result) == 64
    
    def test_hash_is_deterministic(self):
        """Same input should always produce same output."""
        hash1 = hash_api_key("my_api_key", "my_salt")
        hash2 = hash_api_key("my_api_key", "my_salt")
        assert hash1 == hash2


class TestVerifyApiKey:
    """Unit tests for verify_api_key function."""
    
    def test_verify_correct_key(self):
        """Correct key should verify successfully."""
        api_key = "cfx_testkey123456789"
        salt = "test_salt"
        stored_hash = hash_api_key(api_key, salt)
        
        assert verify_api_key(api_key, stored_hash, salt) is True
    
    def test_verify_wrong_key(self):
        """Wrong key should fail verification."""
        api_key = "cfx_testkey123456789"
        wrong_key = "cfx_wrongkey987654321"
        salt = "test_salt"
        stored_hash = hash_api_key(api_key, salt)
        
        assert verify_api_key(wrong_key, stored_hash, salt) is False


class TestGenerateApiKey:
    """Unit tests for generate_api_key function."""
    
    def test_generate_returns_tuple(self):
        """Should return tuple of (full_key, prefix)."""
        result = generate_api_key()
        assert isinstance(result, tuple)
        assert len(result) == 2
    
    def test_generate_default_prefix(self):
        """Default prefix should be 'cfx'."""
        full_key, prefix = generate_api_key()
        assert full_key.startswith("cfx_")
        assert prefix.startswith("cfx_")
    
    def test_generate_custom_prefix(self):
        """Custom prefix should be used."""
        full_key, prefix = generate_api_key(prefix="test")
        assert full_key.startswith("test_")
        assert prefix.startswith("test_")
    
    def test_generate_unique_keys(self):
        """Each call should generate unique key."""
        keys = [generate_api_key()[0] for _ in range(100)]
        assert len(set(keys)) == 100


class TestIsValidApiKeyFormat:
    """Unit tests for is_valid_api_key_format function."""
    
    def test_valid_format(self):
        """Valid format should return True."""
        assert is_valid_api_key_format("cfx_abcdefghijklmnop") is True
        assert is_valid_api_key_format("test_1234567890abcdef") is True
    
    def test_invalid_no_underscore(self):
        """Key without underscore should be invalid."""
        assert is_valid_api_key_format("cfxabcdefghijklmnop") is False
    
    def test_invalid_short_random(self):
        """Key with short random part should be invalid."""
        assert is_valid_api_key_format("cfx_short") is False
    
    def test_invalid_empty(self):
        """Empty key should be invalid."""
        assert is_valid_api_key_format("") is False
        assert is_valid_api_key_format(None) is False


class TestExtractKeyPrefix:
    """Unit tests for extract_key_prefix function."""
    
    def test_extract_prefix(self):
        """Should extract prefix correctly."""
        assert extract_key_prefix("cfx_abcdefghijklmnop") == "cfx_abcd"
    
    def test_extract_short_key(self):
        """Should handle short keys."""
        assert extract_key_prefix("cfx_ab") == "cfx_ab"[:8]


class TestAuthModule:
    """Unit tests for AuthModule class."""
    
    def test_extract_bearer_token_valid(self):
        """Should extract valid Bearer token."""
        auth = AuthModule(None, "salt")
        token = auth.extract_bearer_token("Bearer cfx_testkey123")
        
        assert token == "cfx_testkey123"
    
    def test_extract_bearer_token_missing(self):
        """Should return None for missing header."""
        auth = AuthModule(None, "salt")
        token = auth.extract_bearer_token(None)
        
        assert token is None
    
    def test_extract_bearer_token_wrong_scheme(self):
        """Should return None for non-Bearer scheme."""
        auth = AuthModule(None, "salt")
        token = auth.extract_bearer_token("Basic dXNlcjpwYXNz")
        
        assert token is None
    
    @pytest.mark.asyncio
    async def test_verify_api_key_invalid_format(self):
        """Should return error for invalid format."""
        auth = AuthModule(None, "salt")
        
        result = await auth.verify_api_key("invalid")
        
        assert result.authenticated is False
        assert "format" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_verify_api_key_dev_mode(self):
        """Should accept valid format in dev mode (no database)."""
        auth = AuthModule(None, "salt")
        
        result = await auth.verify_api_key("cfx_validformat12345678")
        
        assert result.authenticated is True
        assert result.user_id == "dev-user"
    
    @pytest.mark.asyncio
    async def test_authenticate_missing_header(self):
        """Should return error for missing header."""
        auth = AuthModule(None, "salt")
        
        result = await auth.authenticate(None)
        
        assert result.authenticated is False
        assert "Missing" in result.error or "invalid" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_authenticate_valid_key(self):
        """Should authenticate valid key."""
        auth = AuthModule(None, "salt")
        
        result = await auth.authenticate("Bearer cfx_validformat12345678")
        
        assert result.authenticated is True

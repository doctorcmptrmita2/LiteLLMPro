"""
Pytest configuration and fixtures for CF-X Router tests.
"""

import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def sample_chat_request() -> dict:
    """Sample OpenAI-format chat completion request."""
    return {
        "model": "gpt-4",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, how are you?"}
        ],
        "stream": False,
        "max_tokens": 1000,
        "temperature": 0.7
    }


@pytest.fixture
def sample_streaming_request() -> dict:
    """Sample streaming chat completion request."""
    return {
        "model": "gpt-4",
        "messages": [
            {"role": "user", "content": "Write a short poem"}
        ],
        "stream": True,
        "max_tokens": 500
    }


@pytest.fixture
def sample_plan_request() -> dict:
    """Sample request that should route to PLAN stage."""
    return {
        "model": "auto",
        "messages": [
            {"role": "user", "content": "Design a REST API for user authentication"}
        ],
        "stream": False
    }


@pytest.fixture
def sample_code_request() -> dict:
    """Sample request that should route to CODE stage."""
    return {
        "model": "auto",
        "messages": [
            {"role": "user", "content": "Implement the login function in Python"}
        ],
        "stream": False
    }


@pytest.fixture
def sample_review_request() -> dict:
    """Sample request that should route to REVIEW stage."""
    return {
        "model": "auto",
        "messages": [
            {"role": "user", "content": "Review this code for security vulnerabilities"}
        ],
        "stream": False
    }

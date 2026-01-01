"""
CF-X Router Database Module

Provides async PostgreSQL connection pool and query utilities.
"""

import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Any, AsyncGenerator, Optional

import asyncpg
from asyncpg import Pool, Connection

logger = logging.getLogger(__name__)


@dataclass
class DatabaseConfig:
    """Database configuration."""
    dsn: str = ""
    min_size: int = 5
    max_size: int = 20
    command_timeout: float = 30.0


class Database:
    """
    Async PostgreSQL database connection manager.
    
    Uses asyncpg connection pool for efficient connection reuse.
    """
    
    def __init__(self, config: DatabaseConfig):
        """
        Initialize database manager.
        
        Args:
            config: Database configuration
        """
        self.config = config
        self._pool: Optional[Pool] = None
    
    async def connect(self) -> None:
        """Create connection pool."""
        if self._pool is not None:
            return
        
        try:
            self._pool = await asyncpg.create_pool(
                self.config.dsn,
                min_size=self.config.min_size,
                max_size=self.config.max_size,
                command_timeout=self.config.command_timeout,
            )
            logger.info("Database connection pool created")
        except Exception as e:
            logger.error(f"Failed to create database pool: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Close connection pool."""
        if self._pool is not None:
            await self._pool.close()
            self._pool = None
            logger.info("Database connection pool closed")
    
    @property
    def pool(self) -> Optional[Pool]:
        """Get the connection pool."""
        return self._pool
    
    @asynccontextmanager
    async def acquire(self) -> AsyncGenerator[Connection, None]:
        """
        Acquire a connection from the pool.
        
        Usage:
            async with db.acquire() as conn:
                result = await conn.fetch("SELECT * FROM users")
        """
        if self._pool is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        
        async with self._pool.acquire() as connection:
            yield connection
    
    async def execute(self, query: str, *args: Any) -> str:
        """
        Execute a query without returning results.
        
        Args:
            query: SQL query string
            *args: Query parameters
            
        Returns:
            Status string (e.g., "INSERT 0 1")
        """
        async with self.acquire() as conn:
            return await conn.execute(query, *args)
    
    async def fetch(self, query: str, *args: Any) -> list[asyncpg.Record]:
        """
        Execute a query and return all results.
        
        Args:
            query: SQL query string
            *args: Query parameters
            
        Returns:
            List of Record objects
        """
        async with self.acquire() as conn:
            return await conn.fetch(query, *args)
    
    async def fetchrow(self, query: str, *args: Any) -> Optional[asyncpg.Record]:
        """
        Execute a query and return first row.
        
        Args:
            query: SQL query string
            *args: Query parameters
            
        Returns:
            Single Record or None
        """
        async with self.acquire() as conn:
            return await conn.fetchrow(query, *args)
    
    async def fetchval(self, query: str, *args: Any) -> Any:
        """
        Execute a query and return first column of first row.
        
        Args:
            query: SQL query string
            *args: Query parameters
            
        Returns:
            Single value
        """
        async with self.acquire() as conn:
            return await conn.fetchval(query, *args)
    
    async def health_check(self) -> bool:
        """
        Check database connectivity.
        
        Returns:
            True if database is reachable, False otherwise
        """
        try:
            result = await self.fetchval("SELECT 1")
            return result == 1
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False

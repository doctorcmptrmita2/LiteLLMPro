"""
CF-X Router Configuration Module

Loads and validates configuration from YAML files and environment variables.
"""

import os
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import yaml

logger = logging.getLogger(__name__)


# =============================================================================
# Configuration Data Classes
# =============================================================================

@dataclass
class StageConfig:
    """Configuration for a single stage."""
    model: str
    max_tokens: int = 4096
    temperature: float = 0.3
    fallback: list[str] = field(default_factory=list)


@dataclass
class DirectModeConfig:
    """Configuration for direct model access."""
    allowed_models: list[str] = field(default_factory=list)
    max_tokens_cap: int = 8192


@dataclass
class ModelsConfig:
    """Complete models configuration."""
    stages: dict[str, StageConfig] = field(default_factory=dict)
    direct: DirectModeConfig = field(default_factory=DirectModeConfig)
    rate_limit: dict[str, Any] = field(default_factory=dict)
    circuit_breaker: dict[str, Any] = field(default_factory=dict)


@dataclass
class DatabaseConfig:
    """Database connection configuration."""
    dsn: str = ""
    host: str = "localhost"
    port: int = 5432
    database: str = "cfx"
    user: str = "cfx"
    password: str = ""
    min_size: int = 5
    max_size: int = 20
    command_timeout: float = 30.0
    
    @classmethod
    def from_env(cls) -> "DatabaseConfig":
        """Create config from environment variables."""
        dsn = os.getenv("DATABASE_URL", "")
        if dsn:
            return cls(dsn=dsn)
        
        return cls(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME", "cfx"),
            user=os.getenv("DB_USER", "cfx"),
            password=os.getenv("DB_PASSWORD", ""),
            min_size=int(os.getenv("DB_MIN_CONNECTIONS", "5")),
            max_size=int(os.getenv("DB_MAX_CONNECTIONS", "20")),
        )
    
    def get_dsn(self) -> str:
        """Get PostgreSQL DSN string."""
        if self.dsn:
            return self.dsn
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"


@dataclass
class LiteLLMConfig:
    """LiteLLM proxy configuration."""
    base_url: str = "http://localhost:4000"
    timeout: float = 120.0
    retry_count: int = 1
    
    @classmethod
    def from_env(cls) -> "LiteLLMConfig":
        """Create config from environment variables."""
        return cls(
            base_url=os.getenv("LITELLM_BASE_URL", "http://localhost:4000"),
            timeout=float(os.getenv("LITELLM_TIMEOUT", "120.0")),
            retry_count=int(os.getenv("LITELLM_RETRY_COUNT", "1")),
        )


@dataclass
class Config:
    """Main application configuration."""
    models: ModelsConfig
    database: DatabaseConfig
    litellm: LiteLLMConfig
    api_key_salt: str = ""
    debug: bool = False
    version: str = "0.1.0"
    
    @classmethod
    def load(cls, config_path: Optional[str] = None) -> "Config":
        """
        Load configuration from file and environment.
        
        Args:
            config_path: Path to models.yaml config file
            
        Returns:
            Loaded Config instance
        """
        # Load models config from YAML
        models_config = cls._load_models_config(config_path)
        
        # Load other configs from environment
        database_config = DatabaseConfig.from_env()
        litellm_config = LiteLLMConfig.from_env()
        
        return cls(
            models=models_config,
            database=database_config,
            litellm=litellm_config,
            api_key_salt=os.getenv("API_KEY_SALT", "default-salt-change-me"),
            debug=os.getenv("DEBUG", "false").lower() == "true",
            version=os.getenv("CFX_VERSION", "0.1.0"),
        )
    
    @classmethod
    def _load_models_config(cls, config_path: Optional[str] = None) -> ModelsConfig:
        """Load models configuration from YAML file."""
        # Find config file
        if config_path:
            path = Path(config_path)
        else:
            # Try common locations
            possible_paths = [
                Path("config/models.yaml"),
                Path("../config/models.yaml"),
                Path("../../config/models.yaml"),
            ]
            path = None
            for p in possible_paths:
                if p.exists():
                    path = p
                    break
        
        if not path or not path.exists():
            logger.warning("No models.yaml found, using defaults")
            return cls._default_models_config()
        
        try:
            with open(path) as f:
                data = yaml.safe_load(f)
            
            return cls._parse_models_config(data)
        except Exception as e:
            logger.error(f"Failed to load models config: {e}")
            return cls._default_models_config()
    
    @classmethod
    def _parse_models_config(cls, data: dict) -> ModelsConfig:
        """Parse models configuration from dictionary."""
        stages = {}
        for stage_name, stage_data in data.get("stages", {}).items():
            stages[stage_name] = StageConfig(
                model=stage_data.get("model", ""),
                max_tokens=stage_data.get("max_tokens", 4096),
                temperature=stage_data.get("temperature", 0.3),
                fallback=stage_data.get("fallback", []),
            )
        
        direct_data = data.get("direct", {})
        direct = DirectModeConfig(
            allowed_models=direct_data.get("allowed_models", []),
            max_tokens_cap=direct_data.get("max_tokens_cap", 8192),
        )
        
        return ModelsConfig(
            stages=stages,
            direct=direct,
            rate_limit=data.get("rate_limit", {}),
            circuit_breaker=data.get("circuit_breaker", {}),
        )
    
    @classmethod
    def _default_models_config(cls) -> ModelsConfig:
        """Create default models configuration."""
        return ModelsConfig(
            stages={
                "plan": StageConfig(
                    model="claude-sonnet-4.5",
                    max_tokens=4096,
                    temperature=0.3,
                    fallback=["gemini-2.5-pro", "gpt-4o"],
                ),
                "code": StageConfig(
                    model="deepseek-v3",
                    max_tokens=8192,
                    temperature=0.2,
                    fallback=["gemini-2.0-flash", "gpt-4o-mini"],
                ),
                "review": StageConfig(
                    model="gpt-4o-mini",
                    max_tokens=2048,
                    temperature=0.1,
                    fallback=["gemini-flash-lite"],
                ),
            },
            direct=DirectModeConfig(
                allowed_models=["claude-sonnet-4.5", "gpt-4o", "deepseek-v3"],
                max_tokens_cap=8192,
            ),
            rate_limit={"daily_requests": 1000, "concurrent_streams": 3},
            circuit_breaker={"failure_threshold": 5, "recovery_timeout": 30},
        )


# =============================================================================
# Helper Functions
# =============================================================================

def load_config(config_path: Optional[str] = None) -> ModelsConfig:
    """
    Load models configuration from YAML file.
    
    This is a convenience function that wraps Config._load_models_config.
    
    Args:
        config_path: Path to models.yaml config file
        
    Returns:
        ModelsConfig instance
        
    Raises:
        FileNotFoundError: If config file not found and no defaults available
    """
    if config_path:
        path = Path(config_path)
        if not path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")
        
        try:
            with open(path) as f:
                data = yaml.safe_load(f)
            return Config._parse_models_config(data)
        except Exception as e:
            logger.error(f"Failed to load config from {config_path}: {e}")
            raise
    
    # Try to find config in common locations
    possible_paths = [
        Path("config/models.yaml"),
        Path("../config/models.yaml"),
        Path("../../config/models.yaml"),
    ]
    
    for p in possible_paths:
        if p.exists():
            try:
                with open(p) as f:
                    data = yaml.safe_load(f)
                return Config._parse_models_config(data)
            except Exception as e:
                logger.warning(f"Failed to load config from {p}: {e}")
                continue
    
    # Return defaults if no config found
    logger.warning("No config file found, using defaults")
    return Config._default_models_config()

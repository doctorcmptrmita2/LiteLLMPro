"""
CF-X Router Stage Routing Module

Implements intelligent routing of requests to appropriate AI models
based on stage (PLAN, CODE, REVIEW) or direct model selection.
"""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Optional

from cfx.config import ModelsConfig, StageConfig

logger = logging.getLogger(__name__)


class Stage(str, Enum):
    """Request processing stages."""
    PLAN = "plan"
    CODE = "code"
    REVIEW = "review"
    DIRECT = "direct"


@dataclass
class RoutingResult:
    """Result of stage routing."""
    stage: Stage
    model: str
    max_tokens: int
    temperature: float
    inferred: bool  # True if stage was inferred from content


class StageRouter:
    """
    Routes requests to appropriate models based on stage.
    
    Supports:
    - Explicit stage via X-CFX-Stage header
    - Stage inference from message content
    - Direct model selection (with allowlist)
    """
    
    # Default keywords for stage inference
    DEFAULT_PLAN_KEYWORDS = [
        "plan", "design", "architect", "spec", "specification",
        "how should", "what's the best way", "structure",
        "approach", "strategy", "outline", "requirements",
        "tasarla", "planla", "mimari", "nasıl yapmalı"
    ]
    
    DEFAULT_CODE_KEYWORDS = [
        "implement", "code", "write", "create", "build",
        "fix", "refactor", "add", "update", "modify",
        "function", "class", "method", "api",
        "yaz", "kodla", "oluştur", "düzelt", "ekle"
    ]
    
    DEFAULT_REVIEW_KEYWORDS = [
        "review", "check", "analyze", "audit", "security",
        "vulnerability", "bug", "issue", "problem",
        "incele", "kontrol", "analiz", "güvenlik"
    ]
    
    def __init__(self, config: ModelsConfig):
        """
        Initialize stage router.
        
        Args:
            config: Models configuration with stage mappings
        """
        self.config = config
        
        # Use keywords from config or defaults
        self.plan_keywords = self.DEFAULT_PLAN_KEYWORDS
        self.code_keywords = self.DEFAULT_CODE_KEYWORDS
        self.review_keywords = self.DEFAULT_REVIEW_KEYWORDS
    
    def parse_stage_header(self, header_value: Optional[str]) -> Optional[Stage]:
        """
        Parse X-CFX-Stage header value.
        
        Args:
            header_value: Header value (e.g., "plan", "code", "review", "direct")
            
        Returns:
            Stage enum or None if invalid/missing
        """
        if not header_value:
            return None
        
        value = header_value.lower().strip()
        
        try:
            return Stage(value)
        except ValueError:
            logger.warning(f"Invalid stage header value: {header_value}")
            return None
    
    def infer_stage(self, messages: list[dict]) -> Stage:
        """
        Infer stage from message content.
        
        Uses keyword matching on the last user message.
        
        Args:
            messages: List of chat messages
            
        Returns:
            Inferred Stage (defaults to PLAN if ambiguous)
        """
        if not messages:
            return Stage.PLAN
        
        # Get last user message
        last_user_content = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_user_content = msg.get("content", "")
                break
        
        if not last_user_content:
            return Stage.PLAN
        
        content_lower = last_user_content.lower()
        
        # Check for review keywords first (most specific)
        if any(kw in content_lower for kw in self.review_keywords):
            return Stage.REVIEW
        
        # Check for code keywords
        if any(kw in content_lower for kw in self.code_keywords):
            return Stage.CODE
        
        # Check for plan keywords
        if any(kw in content_lower for kw in self.plan_keywords):
            return Stage.PLAN
        
        # Check for code block presence (likely code stage)
        if "```" in last_user_content or "def " in content_lower:
            return Stage.CODE
        
        # Check for question patterns (likely plan stage)
        if content_lower.startswith(("how", "what", "nasıl", "ne")):
            return Stage.PLAN
        
        # Default to plan
        return Stage.PLAN
    
    def get_stage_config(self, stage: Stage) -> Optional[StageConfig]:
        """
        Get configuration for a stage.
        
        Args:
            stage: Stage to get config for
            
        Returns:
            StageConfig or None if not found
        """
        if stage == Stage.DIRECT:
            return None
        
        return self.config.stages.get(stage.value)
    
    def is_direct_model_allowed(self, model: str) -> bool:
        """
        Check if a model is allowed in direct mode.
        
        Args:
            model: Model name to check
            
        Returns:
            True if allowed, False otherwise
        """
        return model in self.config.direct.allowed_models
    
    def route(
        self,
        stage_header: Optional[str],
        requested_model: Optional[str],
        messages: list[dict],
        max_tokens: Optional[int] = None
    ) -> RoutingResult:
        """
        Route a request to the appropriate model.
        
        Priority:
        1. If stage_header is "direct" and model is allowed → use requested model
        2. If stage_header is set → use that stage's model
        3. Otherwise → infer stage from messages
        
        Args:
            stage_header: X-CFX-Stage header value
            requested_model: Model requested by client
            messages: Chat messages for inference
            max_tokens: Requested max tokens (may be capped)
            
        Returns:
            RoutingResult with model and parameters
            
        Raises:
            ValueError: If direct mode requested with non-allowed model
        """
        # Parse stage header
        explicit_stage = self.parse_stage_header(stage_header)
        
        # Handle direct mode
        if explicit_stage == Stage.DIRECT:
            if not requested_model:
                raise ValueError("Direct mode requires a model to be specified")
            
            if not self.is_direct_model_allowed(requested_model):
                raise ValueError(
                    f"Model '{requested_model}' is not allowed in direct mode. "
                    f"Allowed models: {', '.join(self.config.direct.allowed_models)}"
                )
            
            # Apply max_tokens cap for direct mode
            effective_max_tokens = min(
                max_tokens or self.config.direct.max_tokens_cap,
                self.config.direct.max_tokens_cap
            )
            
            return RoutingResult(
                stage=Stage.DIRECT,
                model=requested_model,
                max_tokens=effective_max_tokens,
                temperature=0.3,  # Default temperature for direct
                inferred=False
            )
        
        # Determine stage
        if explicit_stage:
            stage = explicit_stage
            inferred = False
        else:
            stage = self.infer_stage(messages)
            inferred = True
        
        # Get stage config
        stage_config = self.get_stage_config(stage)
        
        if not stage_config:
            raise ValueError(f"No configuration found for stage: {stage.value}")
        
        # Use stage's max_tokens unless client requested less
        effective_max_tokens = stage_config.max_tokens
        if max_tokens and max_tokens < effective_max_tokens:
            effective_max_tokens = max_tokens
        
        return RoutingResult(
            stage=stage,
            model=stage_config.model,
            max_tokens=effective_max_tokens,
            temperature=stage_config.temperature,
            inferred=inferred
        )
    
    def get_fallback_models(self, stage: Stage) -> list[str]:
        """
        Get fallback models for a stage.
        
        Args:
            stage: Stage to get fallbacks for
            
        Returns:
            List of fallback model names (empty if none)
        """
        stage_config = self.get_stage_config(stage)
        return stage_config.fallback if stage_config else []

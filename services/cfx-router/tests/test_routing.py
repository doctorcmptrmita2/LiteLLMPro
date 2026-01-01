"""
Tests for CF-X Router Stage Routing Module.

Includes property-based tests using Hypothesis.
"""

import pytest
from hypothesis import given, strategies as st, settings, assume

from cfx.routing import Stage, StageRouter, RoutingResult
from cfx.config import ModelsConfig, StageConfig, DirectModeConfig


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def sample_config() -> ModelsConfig:
    """Create sample models configuration."""
    return ModelsConfig(
        stages={
            "plan": StageConfig(
                model="claude-sonnet-4.5",
                max_tokens=4096,
                temperature=0.3,
                fallback=["gemini-2.5-pro", "gpt-4o"]
            ),
            "code": StageConfig(
                model="deepseek-v3",
                max_tokens=8192,
                temperature=0.2,
                fallback=["gemini-2.0-flash", "gpt-4o-mini"]
            ),
            "review": StageConfig(
                model="gpt-4o-mini",
                max_tokens=2048,
                temperature=0.1,
                fallback=["gemini-flash-lite"]
            ),
        },
        direct=DirectModeConfig(
            allowed_models=["claude-sonnet-4.5", "gpt-4o", "deepseek-v3"],
            max_tokens_cap=8192
        ),
        rate_limit={"daily_requests": 1000, "concurrent_streams": 3},
        circuit_breaker={"failure_threshold": 5, "recovery_timeout": 30},
    )


@pytest.fixture
def router(sample_config: ModelsConfig) -> StageRouter:
    """Create stage router with sample config."""
    return StageRouter(sample_config)


# =============================================================================
# Property Tests
# =============================================================================

class TestStageRoutingProperties:
    """
    Property-based tests for stage routing.
    
    **Feature: cfx-router, Property 5: Stage Routing Determinism**
    **Feature: cfx-router, Property 6: Stage Inference Consistency**
    **Feature: cfx-router, Property 7: Direct Mode Allowlist**
    **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
    """
    
    @staticmethod
    def _create_config() -> ModelsConfig:
        """Create config for property tests."""
        return ModelsConfig(
            stages={
                "plan": StageConfig(
                    model="claude-sonnet-4.5",
                    max_tokens=4096,
                    temperature=0.3,
                    fallback=["gemini-2.5-pro", "gpt-4o"]
                ),
                "code": StageConfig(
                    model="deepseek-v3",
                    max_tokens=8192,
                    temperature=0.2,
                    fallback=["gemini-2.0-flash", "gpt-4o-mini"]
                ),
                "review": StageConfig(
                    model="gpt-4o-mini",
                    max_tokens=2048,
                    temperature=0.1,
                    fallback=["gemini-flash-lite"]
                ),
            },
            direct=DirectModeConfig(
                allowed_models=["claude-sonnet-4.5", "gpt-4o", "deepseek-v3"],
                max_tokens_cap=8192
            ),
            rate_limit={"daily_requests": 1000, "concurrent_streams": 3},
            circuit_breaker={"failure_threshold": 5, "recovery_timeout": 30},
        )
    
    @given(
        stage=st.sampled_from(["plan", "code", "review"])
    )
    @settings(max_examples=100)
    def test_property_explicit_stage_determinism(self, stage: str):
        """
        Property 5: Stage Routing Determinism
        
        *For any* explicit stage header, routing should always return
        the same model for that stage.
        
        **Validates: Requirements 3.1, 3.4**
        """
        config = self._create_config()
        router = StageRouter(config)
        messages = [{"role": "user", "content": "Hello"}]
        
        result1 = router.route(stage, None, messages)
        result2 = router.route(stage, None, messages)
        
        assert result1.model == result2.model, \
            "Same stage should always route to same model"
        assert result1.stage.value == stage, \
            "Result stage should match requested stage"
        assert result1.inferred is False, \
            "Explicit stage should not be marked as inferred"
    
    @given(
        keyword=st.sampled_from([
            "design", "architect", "spec", "plan",
            "implement", "code", "write", "fix",
            "review", "check", "analyze", "security"
        ])
    )
    @settings(max_examples=100)
    def test_property_keyword_inference_consistency(self, keyword: str):
        """
        Property 6: Stage Inference Consistency
        
        *For any* message containing a stage keyword, inference should
        consistently return the same stage.
        
        **Validates: Requirements 3.2, 3.3**
        """
        config = self._create_config()
        router = StageRouter(config)
        
        # Create message with keyword
        messages = [{"role": "user", "content": f"Please {keyword} this feature"}]
        
        # Infer multiple times
        stage1 = router.infer_stage(messages)
        stage2 = router.infer_stage(messages)
        
        assert stage1 == stage2, \
            "Same message should always infer to same stage"
    
    @given(
        model=st.sampled_from(["claude-sonnet-4.5", "gpt-4o", "deepseek-v3"])
    )
    @settings(max_examples=100)
    def test_property_allowed_direct_mode(self, model: str):
        """
        Property 7: Direct Mode Allowlist (Allowed Models)
        
        *For any* model in the allowlist, direct mode should succeed
        and use that exact model.
        
        **Validates: Requirements 3.6**
        """
        config = self._create_config()
        router = StageRouter(config)
        messages = [{"role": "user", "content": "Hello"}]
        
        result = router.route("direct", model, messages)
        
        assert result.stage == Stage.DIRECT, \
            "Should be direct stage"
        assert result.model == model, \
            "Should use requested model"
        assert result.inferred is False, \
            "Direct mode should not be inferred"
    
    @given(
        model=st.text(min_size=5, max_size=30).filter(
            lambda x: x not in ["claude-sonnet-4.5", "gpt-4o", "deepseek-v3"]
        )
    )
    @settings(max_examples=50)
    def test_property_disallowed_direct_mode(self, model: str):
        """
        Property 7: Direct Mode Allowlist (Disallowed Models)
        
        *For any* model NOT in the allowlist, direct mode should fail.
        
        **Validates: Requirements 3.6**
        """
        config = self._create_config()
        router = StageRouter(config)
        messages = [{"role": "user", "content": "Hello"}]
        
        # Filter out allowed models
        assume(model not in config.direct.allowed_models)
        
        with pytest.raises(ValueError, match="not allowed in direct mode"):
            router.route("direct", model, messages)
    
    @given(
        max_tokens=st.integers(min_value=100, max_value=20000)
    )
    @settings(max_examples=100)
    def test_property_direct_mode_token_cap(self, max_tokens: int):
        """
        Property: Direct mode respects max_tokens cap.
        
        *For any* requested max_tokens, the result should not exceed
        the configured cap.
        
        **Validates: Requirements 3.6**
        """
        config = self._create_config()
        router = StageRouter(config)
        messages = [{"role": "user", "content": "Hello"}]
        
        result = router.route("direct", "gpt-4o", messages, max_tokens)
        
        assert result.max_tokens <= config.direct.max_tokens_cap, \
            f"max_tokens {result.max_tokens} should not exceed cap {config.direct.max_tokens_cap}"


# =============================================================================
# Unit Tests
# =============================================================================

class TestStageEnum:
    """Unit tests for Stage enum."""
    
    def test_stage_values(self):
        """Stage enum should have correct values."""
        assert Stage.PLAN.value == "plan"
        assert Stage.CODE.value == "code"
        assert Stage.REVIEW.value == "review"
        assert Stage.DIRECT.value == "direct"


class TestStageRouter:
    """Unit tests for StageRouter class."""
    
    def test_parse_stage_header_valid(self, router: StageRouter):
        """Should parse valid stage headers."""
        assert router.parse_stage_header("plan") == Stage.PLAN
        assert router.parse_stage_header("code") == Stage.CODE
        assert router.parse_stage_header("review") == Stage.REVIEW
        assert router.parse_stage_header("direct") == Stage.DIRECT
    
    def test_parse_stage_header_case_insensitive(self, router: StageRouter):
        """Should handle case variations."""
        assert router.parse_stage_header("PLAN") == Stage.PLAN
        assert router.parse_stage_header("Code") == Stage.CODE
        assert router.parse_stage_header("REVIEW") == Stage.REVIEW
    
    def test_parse_stage_header_invalid(self, router: StageRouter):
        """Should return None for invalid headers."""
        assert router.parse_stage_header("invalid") is None
        assert router.parse_stage_header("") is None
        assert router.parse_stage_header(None) is None
    
    def test_infer_stage_plan_keywords(self, router: StageRouter):
        """Should infer PLAN stage from plan keywords."""
        messages = [{"role": "user", "content": "plan the architecture"}]
        assert router.infer_stage(messages) == Stage.PLAN
        
        messages = [{"role": "user", "content": "what's the best approach?"}]
        assert router.infer_stage(messages) == Stage.PLAN
    
    def test_infer_stage_code_keywords(self, router: StageRouter):
        """Should infer CODE stage from code keywords."""
        messages = [{"role": "user", "content": "write the login function"}]
        assert router.infer_stage(messages) == Stage.CODE
        
        messages = [{"role": "user", "content": "refactor the auth module"}]
        assert router.infer_stage(messages) == Stage.CODE
    
    def test_infer_stage_review_keywords(self, router: StageRouter):
        """Should infer REVIEW stage from review keywords."""
        messages = [{"role": "user", "content": "Review this code for security"}]
        assert router.infer_stage(messages) == Stage.REVIEW
        
        messages = [{"role": "user", "content": "Check for vulnerabilities"}]
        assert router.infer_stage(messages) == Stage.REVIEW
    
    def test_infer_stage_code_block(self, router: StageRouter):
        """Should infer CODE stage when code block present."""
        messages = [{"role": "user", "content": "```python\ndef hello():\n    pass\n```"}]
        assert router.infer_stage(messages) == Stage.CODE
    
    def test_infer_stage_default_plan(self, router: StageRouter):
        """Should default to PLAN for ambiguous messages."""
        messages = [{"role": "user", "content": "Hello, how are you?"}]
        assert router.infer_stage(messages) == Stage.PLAN
    
    def test_infer_stage_empty_messages(self, router: StageRouter):
        """Should default to PLAN for empty messages."""
        assert router.infer_stage([]) == Stage.PLAN
    
    def test_route_explicit_stage(self, router: StageRouter):
        """Should use explicit stage when provided."""
        messages = [{"role": "user", "content": "Hello"}]
        
        result = router.route("code", None, messages)
        
        assert result.stage == Stage.CODE
        assert result.model == "deepseek-v3"
        assert result.inferred is False
    
    def test_route_inferred_stage(self, router: StageRouter):
        """Should infer stage when not provided."""
        messages = [{"role": "user", "content": "Design a database schema"}]
        
        result = router.route(None, None, messages)
        
        assert result.stage == Stage.PLAN
        assert result.model == "claude-sonnet-4.5"
        assert result.inferred is True
    
    def test_route_direct_mode_success(self, router: StageRouter):
        """Should allow direct mode with allowed model."""
        messages = [{"role": "user", "content": "Hello"}]
        
        result = router.route("direct", "gpt-4o", messages)
        
        assert result.stage == Stage.DIRECT
        assert result.model == "gpt-4o"
    
    def test_route_direct_mode_no_model(self, router: StageRouter):
        """Should fail direct mode without model."""
        messages = [{"role": "user", "content": "Hello"}]
        
        with pytest.raises(ValueError, match="requires a model"):
            router.route("direct", None, messages)
    
    def test_route_direct_mode_disallowed(self, router: StageRouter):
        """Should fail direct mode with disallowed model."""
        messages = [{"role": "user", "content": "Hello"}]
        
        with pytest.raises(ValueError, match="not allowed"):
            router.route("direct", "some-random-model", messages)
    
    def test_get_fallback_models(self, router: StageRouter):
        """Should return fallback models for stage."""
        fallbacks = router.get_fallback_models(Stage.PLAN)
        assert "gemini-2.5-pro" in fallbacks
        assert "gpt-4o" in fallbacks
    
    def test_get_fallback_models_direct(self, router: StageRouter):
        """Should return empty list for direct stage."""
        fallbacks = router.get_fallback_models(Stage.DIRECT)
        assert fallbacks == []

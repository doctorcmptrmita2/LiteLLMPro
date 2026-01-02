-- CF-X Router Initial Database Schema
-- Migration: 001_initial_schema
-- Date: 2026-01-02

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- API Keys Table
-- ============================================
-- Stores hashed API keys for authentication
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    key_hash TEXT NOT NULL,           -- SHA-256 hash, never store raw key
    key_prefix TEXT NOT NULL,         -- First 8 chars for identification (cfx_xxxx)
    label TEXT,                       -- User-friendly name
    status TEXT NOT NULL DEFAULT 'active',  -- active | revoked
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    
    CONSTRAINT api_keys_status_check CHECK (status IN ('active', 'revoked'))
);

-- Index for fast key lookup during authentication
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status) WHERE status = 'active';


-- ============================================
-- Usage Counters Table
-- ============================================
-- Tracks daily request counts per user for rate limiting
CREATE TABLE IF NOT EXISTS usage_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    day DATE NOT NULL,                -- UTC day bucket
    request_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One row per user per day
    CONSTRAINT usage_counters_user_day_unique UNIQUE (user_id, day)
);

-- Index for fast lookup during rate limit check
CREATE INDEX IF NOT EXISTS idx_usage_counters_user_day ON usage_counters(user_id, day);


-- ============================================
-- Request Logs Table
-- ============================================
-- Stores all request logs for analytics and debugging
CREATE TABLE IF NOT EXISTS request_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    api_key_id UUID REFERENCES api_keys(id),
    request_id TEXT NOT NULL,         -- Unique request identifier (returned in header)
    session_id TEXT,                  -- Optional session grouping
    
    -- Request details
    stage TEXT NOT NULL,              -- plan | code | review | direct
    model TEXT NOT NULL,              -- Actual model used
    requested_model TEXT,             -- Model requested by client (if different)
    
    -- Token usage
    prompt_tokens INT,
    completion_tokens INT,
    total_tokens INT,
    
    -- Cost tracking
    cost NUMERIC(10, 6),              -- Calculated cost in USD
    
    -- Performance
    latency_ms INT,                   -- Total request latency
    time_to_first_token_ms INT,       -- For streaming requests
    
    -- Status
    status_code INT,                  -- HTTP status code
    error_message TEXT,
    error_code TEXT,
    
    -- Metadata
    is_streaming BOOLEAN DEFAULT FALSE,
    client_ip TEXT,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT request_logs_stage_check CHECK (stage IN ('plan', 'code', 'review', 'direct'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_request_logs_user_created ON request_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_request_id ON request_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_stage ON request_logs(stage);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at DESC);


-- ============================================
-- Users Table (Optional - for future use)
-- ============================================
-- Basic user information if not using external auth
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    name TEXT,
    plan TEXT DEFAULT 'free',         -- free | starter | pro | team
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================
-- Helper Functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for usage_counters
DROP TRIGGER IF EXISTS update_usage_counters_updated_at ON usage_counters;
CREATE TRIGGER update_usage_counters_updated_at
    BEFORE UPDATE ON usage_counters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- Atomic Upsert for Rate Limiting
-- ============================================
-- This function atomically increments the request counter
CREATE OR REPLACE FUNCTION increment_usage_counter(
    p_user_id UUID,
    p_day DATE,
    p_limit INT
) RETURNS TABLE (
    allowed BOOLEAN,
    current_count INT,
    remaining INT
) AS $$
DECLARE
    v_count INT;
BEGIN
    -- Atomic upsert with increment
    INSERT INTO usage_counters (user_id, day, request_count)
    VALUES (p_user_id, p_day, 1)
    ON CONFLICT (user_id, day)
    DO UPDATE SET 
        request_count = usage_counters.request_count + 1,
        updated_at = NOW()
    RETURNING usage_counters.request_count INTO v_count;
    
    -- Return result
    RETURN QUERY SELECT 
        v_count <= p_limit AS allowed,
        v_count AS current_count,
        GREATEST(0, p_limit - v_count) AS remaining;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- Sample Data for Development
-- ============================================
-- Test user and API key for development

INSERT INTO users (id, email, name, plan) VALUES
    ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Test User', 'pro')
ON CONFLICT (id) DO NOTHING;

-- API Key: cfx_testkey1234567890abcdef
-- Hash generated with salt: cfx-dev-salt-not-for-production
INSERT INTO api_keys (user_id, key_hash, key_prefix, label, status) VALUES
    ('00000000-0000-0000-0000-000000000001', 
     'a900af3569657d82686c2678c64fa13ad27c08ff6372f9299bb762ebc54ca692',
     'cfx_test',
     'Development Key',
     'active')
ON CONFLICT DO NOTHING;

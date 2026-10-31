-- ============================================================================
-- KORE BASE PLATFORM — CANONICAL POSTGRESQL SCHEMA
-- Default Relational Database Engine: PostgreSQL 16+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE (RBAC: 'admin' | 'client')
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  locale VARCHAR(10) NOT NULL DEFAULT 'pt-BR' CHECK (locale IN ('pt-BR', 'es', 'en')),
  department VARCHAR(120) NOT NULL DEFAULT 'General',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- 2. PASSWORD RESETS TABLE (SHA-256 Token Digest Only)
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON password_resets (token_hash);

-- 3. AUDIT LOGS TABLE (Immutable System Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email VARCHAR(255) NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  action VARCHAR(120) NOT NULL,
  category VARCHAR(32) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('success', 'warning', 'error')),
  ip_address VARCHAR(64) NOT NULL,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs (category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email ON audit_logs (actor_email);

-- 4. DAILY TELEMETRY METRICS TABLE (Dashboard Time-Series)
CREATE TABLE IF NOT EXISTS metrics_daily (
  metric_date DATE PRIMARY KEY,
  label VARCHAR(20) NOT NULL,
  users_count INTEGER NOT NULL DEFAULT 0,
  logins_count INTEGER NOT NULL DEFAULT 0,
  actions_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. VENDEDORAS TABLE (Sellers)
CREATE TABLE IF NOT EXISTS vendedoras (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  foto TEXT,
  cargo VARCHAR(120),
  loja VARCHAR(120) DEFAULT 'Loja Principal',
  ativa BOOLEAN NOT NULL DEFAULT true,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendedoras_ativa ON vendedoras (ativa);

-- 6. QUINZENAS TABLE (Fortnight Cycles)
CREATE TABLE IF NOT EXISTS quinzenas (
  id VARCHAR(40) PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  quinzena INTEGER NOT NULL CHECK (quinzena IN (1, 2)),
  rotulo VARCHAR(60) NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  premio_valor NUMERIC(10,2) NOT NULL DEFAULT 300.00,
  status VARCHAR(20) NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'encerrada')),
  vencedora_id VARCHAR(50) REFERENCES vendedoras(id) ON DELETE SET NULL,
  vencedora_nome VARCHAR(160),
  vencedora_media NUMERIC(3,2),
  vencedora_total_votos INTEGER,
  homologado_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quinzenas_status ON quinzenas (status);

-- 7. AVALIACOES TABLE (Customer Evaluations & Validation Codes)
CREATE TABLE IF NOT EXISTS avaliacoes (
  id VARCHAR(50) PRIMARY KEY,
  codigo_voto VARCHAR(30) NOT NULL UNIQUE,
  vendedora_id VARCHAR(50) NOT NULL REFERENCES vendedoras(id) ON DELETE CASCADE,
  vendedora_nome VARCHAR(160) NOT NULL,
  sorriso INTEGER NOT NULL CHECK (sorriso BETWEEN 1 AND 5),
  cordialidade INTEGER NOT NULL CHECK (cordialidade BETWEEN 1 AND 5),
  conhecimento INTEGER NOT NULL CHECK (conhecimento BETWEEN 1 AND 5),
  experiencia INTEGER NOT NULL CHECK (experiencia BETWEEN 1 AND 5),
  media NUMERIC(3,2) NOT NULL,
  cliente_nome VARCHAR(160),
  cliente_telefone VARCHAR(40),
  comentario TEXT,
  quinzena_id VARCHAR(40) NOT NULL REFERENCES quinzenas(id) ON DELETE CASCADE,
  quinzena_rotulo VARCHAR(60) NOT NULL,
  ip_address VARCHAR(64) NOT NULL,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'valida' CHECK (status IN ('valida', 'desqualificada')),
  desqualificada_motivo TEXT
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_codigo_voto ON avaliacoes (codigo_voto);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_quinzena_id ON avaliacoes (quinzena_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_vendedora_id ON avaliacoes (vendedora_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_status ON avaliacoes (status);

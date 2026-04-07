-- ════════════════════════════════════════════════
--  단군비즈 CRM — Initial Schema
--  Run this in Supabase → SQL Editor
-- ════════════════════════════════════════════════

-- Enable UUID extension (not needed since we use our own uid, but good practice)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────
--  customers
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  -- Primary key (matches the JS uid() format)
  id            TEXT PRIMARY KEY,

  -- Manual sort order (drag-and-drop; lower = higher in list)
  sort_order    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,

  -- Registration date (string "YYYY-MM-DD" kept as-is from the JS)
  created_at    TEXT NOT NULL DEFAULT '',

  -- ── Basic info ──────────────────────────────
  name          TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  carrier       TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  birth         TEXT NOT NULL DEFAULT '',
  rrn           TEXT NOT NULL DEFAULT '',  -- masked in UI, stored raw here
  gender        TEXT NOT NULL DEFAULT '',  -- 'male' | 'female' | ''

  -- ── Address ─────────────────────────────────
  homeaddr      TEXT NOT NULL DEFAULT '',
  home_ownership TEXT NOT NULL DEFAULT '',
  region        TEXT NOT NULL DEFAULT '',

  -- ── Business ────────────────────────────────
  biztype       TEXT NOT NULL DEFAULT 'sole',  -- 'sole' | 'corp'
  bizname       TEXT NOT NULL DEFAULT '',
  bizno         TEXT NOT NULL DEFAULT '',
  industry      TEXT NOT NULL DEFAULT '',
  period        TEXT NOT NULL DEFAULT '',
  revenue       TEXT NOT NULL DEFAULT '',
  employee      TEXT NOT NULL DEFAULT '',
  bizaddr       TEXT NOT NULL DEFAULT '',

  -- ── Financial ───────────────────────────────
  bank          TEXT NOT NULL DEFAULT '',
  score         TEXT NOT NULL DEFAULT '',
  plan          TEXT NOT NULL DEFAULT '',
  actual_fund   TEXT NOT NULL DEFAULT '',
  apply_route   TEXT NOT NULL DEFAULT '',

  -- ── Key dates (stored as "YYYY-MM-DD" strings) ──
  consult_date  TEXT NOT NULL DEFAULT '',
  apply_date    TEXT NOT NULL DEFAULT '',
  contract_date TEXT NOT NULL DEFAULT '',
  fund_date     TEXT NOT NULL DEFAULT '',
  collect_date  TEXT NOT NULL DEFAULT '',

  -- ── Status ──────────────────────────────────
  status        TEXT NOT NULL DEFAULT '',   -- '' | 'hold' | 'cancel' | 'rejected'
  sub_status    TEXT NOT NULL DEFAULT '',   -- '' | 'review' | 'wait' | 'done'
  step_idx      INTEGER NOT NULL DEFAULT 0,
  collected     TEXT NOT NULL DEFAULT '',   -- '' | '완료'

  -- ── Extra fields ────────────────────────────
  naver         TEXT NOT NULL DEFAULT '',   -- '' | '있음' | '없음'
  credit        TEXT NOT NULL DEFAULT '',   -- '' | '가입완료'
  consult       TEXT NOT NULL DEFAULT '',   -- 1차콜 full text
  reject_reason TEXT NOT NULL DEFAULT '',
  product       TEXT NOT NULL DEFAULT '',   -- for 추가진행

  -- ── Complex / nested data (JSONB) ───────────
  step_dates    JSONB NOT NULL DEFAULT '{}',
  hidden_steps  JSONB NOT NULL DEFAULT '[]',
  doc_items     JSONB NOT NULL DEFAULT '[]',
  memos         JSONB NOT NULL DEFAULT '[]',
  food_info     JSONB,
  collect_info  JSONB,

  -- ── Server-side timestamp ───────────────────
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast list queries
CREATE INDEX IF NOT EXISTS idx_customers_sort    ON public.customers (sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_customers_status  ON public.customers (status);
CREATE INDEX IF NOT EXISTS idx_customers_step    ON public.customers (step_idx);
CREATE INDEX IF NOT EXISTS idx_customers_name    ON public.customers (name);

-- ────────────────────────────────────────────────
--  trash
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trash (
  id            TEXT PRIMARY KEY,
  customer_data JSONB NOT NULL,  -- full customer snapshot as JSON
  deleted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trash_deleted_at ON public.trash (deleted_at DESC);

-- ────────────────────────────────────────────────
--  Row Level Security
--  For an internal tool, allow all anon operations.
--  Add proper auth later if needed.
-- ────────────────────────────────────────────────
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trash     ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (internal tool)
CREATE POLICY "anon_all_customers" ON public.customers
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_trash" ON public.trash
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────
--  Trigger: auto-update updated_at on customers
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────
--  Helper: auto-expire trash older than 30 days
--  (call via cron or manually)
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.expire_trash()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE deleted_count INTEGER;
BEGIN
  DELETE FROM public.trash
  WHERE deleted_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

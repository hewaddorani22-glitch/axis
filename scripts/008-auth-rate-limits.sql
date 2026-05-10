CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  scope TEXT NOT NULL CHECK (scope IN ('email_otp_email', 'email_otp_ip')),
  key_hash TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count >= 0),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, key_hash, window_start)
);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS auth_rate_limits_window_idx
  ON public.auth_rate_limits (window_start);

CREATE INDEX IF NOT EXISTS auth_rate_limits_last_attempt_idx
  ON public.auth_rate_limits (last_attempt_at);

-- No anon/authenticated policies on purpose: this table is service-role only.

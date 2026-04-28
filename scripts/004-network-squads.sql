-- Phase 4: Social Accountability | Squads (The Grid)
-- Creates groups, group_members tables with invite-code system and RLS.

-- ── groups ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Anyone can read a group (needed to resolve invite codes)
CREATE POLICY "groups_select" ON public.groups
  FOR SELECT USING (true);

-- Only the creator can insert
CREATE POLICY "groups_insert" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Only the creator can update/delete
CREATE POLICY "groups_update" ON public.groups
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "groups_delete" ON public.groups
  FOR DELETE USING (auth.uid() = created_by);

-- ── group_members ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Members can see other members in their shared groups
CREATE POLICY "group_members_select" ON public.group_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- Users can join a group themselves
CREATE POLICY "group_members_insert" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave a group (delete their own membership)
CREATE POLICY "group_members_delete" ON public.group_members
  FOR DELETE USING (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx  ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS groups_invite_code_idx      ON public.groups (invite_code);

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  pin_length INT NOT NULL DEFAULT 6,
  display_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS house_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  member_type VARCHAR(20) NOT NULL DEFAULT 'PERSON',
  is_virtual BOOLEAN NOT NULL DEFAULT FALSE,
  gender VARCHAR(10) NOT NULL DEFAULT 'OTHER',
  theme_color VARCHAR(20) NOT NULL DEFAULT '#F97316',
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
  is_placeholder BOOLEAN NOT NULL DEFAULT FALSE,
  invited_phone VARCHAR(20),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS perspective_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alias_name VARCHAR(100) NOT NULL,
  relationship_tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(viewer_user_id, target_user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  current_holder_id UUID NOT NULL REFERENCES house_members(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  due_date TIMESTAMPTZ NOT NULL,
  reminder_at TIMESTAMPTZ,
  recurrence_interval_days INT,
  has_expense BOOLEAN NOT NULL DEFAULT FALSE,
  amount_satang BIGINT NOT NULL DEFAULT 0,
  split_type VARCHAR(20) NOT NULL DEFAULT 'EQUAL',
  related_member_id UUID REFERENCES house_members(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_sub_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  amount_satang BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_split_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES house_members(id) ON DELETE RESTRICT,
  amount_satang BIGINT NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS handover_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_member_id UUID NOT NULL REFERENCES house_members(id) ON DELETE RESTRICT,
  to_member_id UUID NOT NULL REFERENCES house_members(id) ON DELETE RESTRICT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recovery_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE perspective_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_sub_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_split_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "house_isolation_policy" ON tasks
FOR ALL USING (
  house_id IN (
    SELECT house_id FROM house_members 
    WHERE user_id = auth.uid() AND is_deleted = false
  )
);

CREATE POLICY "perspective_privacy_policy" ON perspective_aliases
FOR ALL USING (viewer_user_id = auth.uid());

CREATE POLICY "task_title_creator_only" ON tasks
FOR UPDATE USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE OR REPLACE FUNCTION check_task_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'COMPLETED' AND (
    OLD.amount_satang != NEW.amount_satang OR 
    OLD.split_type != NEW.split_type
  ) THEN
    RAISE EXCEPTION 'COMPLETED_TASK_IMMUTABLE';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_task_immutability ON tasks;
CREATE TRIGGER enforce_task_immutability
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION check_task_immutability();

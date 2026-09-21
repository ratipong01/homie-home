export interface UserRecord {
  id: string;
  phone: string | null;
  pin_hash: string | null;
  display_name: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  avatar_url: string | null;
  theme_color: string;
  is_virtual: boolean;
  pin_length?: number;
  status: 'ACTIVE' | 'LOCKED' | 'PENDING_DELETION';
  failed_attempts: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HouseRecord {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type MemberType = 'PERSON' | 'PET' | 'ASSET';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'INVITED' | 'VESSEL' | 'REMOVED';

export interface HouseMemberRecord {
  id: string;
  house_id: string;
  member_type: MemberType;
  is_virtual: boolean;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  theme_color: string;
  user_id: string | null;
  name: string;
  category: string | null;
  avatar_url: string | null;
  role: MemberRole;
  is_placeholder: boolean;
  invited_phone: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface PerspectiveAliasRecord {
  id: string;
  viewer_user_id: string;
  target_user_id: string;
  alias_name: string;
  relationship_tag: string;
  created_at: string;
  updated_at: string;
}

export interface RecoveryKeyRecord {
  id: string;
  user_id: string;
  house_id: string;
  key_hash: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type SplitType = 'EQUAL' | 'CUSTOM';

export interface TaskRecord {
  id: string;
  house_id: string;
  title: string;
  description: string | null;
  created_by: string;
  current_holder_id: string;
  beneficiary_id: string | null;
  beneficiary_type: 'PERSON' | 'PET' | 'ASSET' | 'HOUSE_COMMON' | null;
  status: TaskStatus;
  due_date: string;
  reminder_at: string | null;
  recurrence_interval_days: number | null;
  has_expense: boolean;
  amount_satang: number;
  split_type: SplitType;
  related_member_id: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskSubItemRecord {
  id: string;
  task_id: string;
  title: string;
  amount_satang: number;
  created_at: string;
  updated_at: string;
}

export interface TaskSplitItemRecord {
  id: string;
  task_id: string;
  member_id: string;
  amount_satang: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HandoverLogRecord {
  id: string;
  task_id: string;
  from_member_id: string;
  to_member_id: string;
  action: 'RETURN' | 'FORWARD' | 'COMPLETE';
  note: string | null;
  created_at: string;
}

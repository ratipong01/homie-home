export type MemberType = 'PERSON' | 'PET' | 'ASSET';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type MemberGender = 'MALE' | 'FEMALE' | 'OTHER';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type SplitType = 'EQUAL' | 'CUSTOM';

export interface User {
  id: string;
  phone: string;
  displayName: string;
  status: 'ACTIVE' | 'LOCKED' | 'PENDING_DELETION';
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface House {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseMember {
  id: string;
  houseId: string;
  memberType: MemberType;
  isVirtual: boolean;
  gender: MemberGender;
  themeColor: string;
  userId: string | null;
  name: string;
  category: string;
  avatarUrl: string | null;
  role: MemberRole;
  isPlaceholder: boolean;
  invitedPhone: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  metadata?: Record<string, any> | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerspectiveAlias {
  id: string;
  viewerUserId: string;
  targetUserId: string;
  aliasName: string;
  relationshipTag: string;
  createdAt: string;
  updatedAt: string;
}

export type BeneficiaryType = 'PERSON' | 'PET' | 'ASSET' | 'HOUSE_COMMON';

export interface Task {
  id: string;
  houseId: string;
  title: string;
  description: string | null;
  createdBy: string;
  currentHolderId: string;
  beneficiaryId?: string | null;
  beneficiaryType?: BeneficiaryType | null;
  beneficiaryName?: string | null;
  paidById?: string | null;
  status: TaskStatus;
  dueDate: string;
  reminderAt: string | null;
  recurrenceIntervalDays: number | null;
  hasExpense: boolean;
  amountSatang: number;
  splitType: SplitType;
  relatedMemberId: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSubItem {
  id: string;
  taskId: string;
  title: string;
  amountSatang: number;
}

export interface TaskSplitItem {
  id: string;
  taskId: string;
  memberId: string;
  amountSatang: number;
  isPaid: boolean;
  paidAt: string | null;
}

export interface HandoverLog {
  id: string;
  taskId: string;
  fromMemberId: string;
  toMemberId: string;
  action: 'RETURN' | 'FORWARD' | 'COMPLETE';
  note: string | null;
  createdAt: string;
}

export interface NetBalance {
  memberId: string;
  name: string;
  netSatang: number;
  status: 'OWED' | 'OWES' | 'SETTLED';
}

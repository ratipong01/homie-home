// Browser-local client store for running offline or on static deployments (e.g. Cloudflare Workers / Pages)
// where POST requests to /api/v1 return 405 Method Not Allowed.

import type { User, House, HouseMember, PerspectiveAlias, Task, TaskSplitItem, TaskSubItem, HandoverLog } from '../types';
import type { EnrichedMember } from './houseApi';
import type { EnrichedTask, CreateTaskPayload, HandoverPayload } from './taskApi';
import type { NetBalance, PromptPayQrResponse } from './financeApi';
import type { PhoneCheckResponse, AuthSuccessResponse, RegisterPayload, VerifyRecoveryKeyPayload } from './authApi';

interface StoredUser extends User {
  pin: string;
  pinLength: number;
  failedAttempts: number;
}

interface LocalStoreState {
  users: Record<string, StoredUser>;
  houses: Record<string, House>;
  members: Record<string, HouseMember>;
  aliases: Record<string, PerspectiveAlias>;
  tasks: Record<string, Task>;
  splits: Record<string, TaskSplitItem>;
  subItems: Record<string, TaskSubItem>;
  logs: Record<string, HandoverLog>;
  recoveryKeys: Record<string, { phone: string; key: string; expiresAt: string }>;
}

const STORAGE_KEY = 'homie_client_store_v1';

function uid(): string {
  return 'id_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function getInitialState(): LocalStoreState {
  const now = new Date().toISOString();
  
  // Seed initial demo users
  const user1: StoredUser = {
    id: 'user_owner_0812345678',
    phone: '0812345678',
    displayName: 'หัวหน้าบ้าน (เบอร์ตัวอย่าง)',
    pin: '1234',
    pinLength: 4,
    failedAttempts: 0,
    status: 'ACTIVE',
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const user2: StoredUser = {
    id: 'user_member_0855979291',
    phone: '0855979291',
    displayName: 'สมาชิกบ้าน (0855979291)',
    pin: '1234',
    pinLength: 4,
    failedAttempts: 0,
    status: 'ACTIVE',
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const defaultHouse: House = {
    id: 'house_demo_1',
    name: 'บ้านสุขใจ Homie',
    createdBy: user1.id,
    createdAt: now,
    updatedAt: now,
  };

  const member1: HouseMember = {
    id: 'member_1',
    houseId: defaultHouse.id,
    memberType: 'PERSON',
    isVirtual: false,
    gender: 'MALE',
    themeColor: '#3B82F6',
    userId: user1.id,
    name: 'หัวหน้าบ้าน',
    category: '',
    avatarUrl: null,
    role: 'OWNER',
    isPlaceholder: false,
    invitedPhone: user1.phone,
    isDeleted: false,
    deletedAt: null,
    createdBy: user1.id,
    updatedBy: user1.id,
    createdAt: now,
    updatedAt: now,
  };

  const member2: HouseMember = {
    id: 'member_2',
    houseId: defaultHouse.id,
    memberType: 'PERSON',
    isVirtual: false,
    gender: 'FEMALE',
    themeColor: '#EC4899',
    userId: user2.id,
    name: 'สมาชิก 0855979291',
    category: '',
    avatarUrl: null,
    role: 'MEMBER',
    isPlaceholder: false,
    invitedPhone: user2.phone,
    isDeleted: false,
    deletedAt: null,
    createdBy: user1.id,
    updatedBy: user1.id,
    createdAt: now,
    updatedAt: now,
  };

  const virtualMember: HouseMember = {
    id: 'member_v1',
    houseId: defaultHouse.id,
    memberType: 'PERSON',
    isVirtual: true,
    gender: 'OTHER',
    themeColor: '#10B981',
    userId: null,
    name: 'กองกลางบ้าน',
    category: '',
    avatarUrl: null,
    role: 'MEMBER',
    isPlaceholder: false,
    invitedPhone: null,
    isDeleted: false,
    deletedAt: null,
    createdBy: user1.id,
    updatedBy: user1.id,
    createdAt: now,
    updatedAt: now,
  };

  const sampleTask: Task = {
    id: 'task_sample_1',
    houseId: defaultHouse.id,
    title: 'จ่ายค่าไฟเดือนนี้',
    description: 'จ่ายก่อนวันที่ 25 นะครับ',
    createdBy: user1.id,
    currentHolderId: member1.id,
    status: 'PENDING',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    reminderAt: null,
    recurrenceIntervalDays: 30,
    hasExpense: true,
    amountSatang: 120000, // 1,200.00 THB
    splitType: 'EQUAL',
    relatedMemberId: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const sampleSplit1: TaskSplitItem = {
    id: 'split_1',
    taskId: sampleTask.id,
    memberId: member1.id,
    amountSatang: 60000,
    isPaid: true,
    paidAt: now,
  };

  const sampleSplit2: TaskSplitItem = {
    id: 'split_2',
    taskId: sampleTask.id,
    memberId: member2.id,
    amountSatang: 60000,
    isPaid: false,
    paidAt: null,
  };

  return {
    users: {
      [user1.id]: user1,
      [user2.id]: user2,
    },
    houses: {
      [defaultHouse.id]: defaultHouse,
    },
    members: {
      [member1.id]: member1,
      [member2.id]: member2,
      [virtualMember.id]: virtualMember,
    },
    aliases: {},
    tasks: {
      [sampleTask.id]: sampleTask,
    },
    splits: {
      [sampleSplit1.id]: sampleSplit1,
      [sampleSplit2.id]: sampleSplit2,
    },
    subItems: {},
    logs: {},
    recoveryKeys: {},
  };
}

function loadState(): LocalStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialState();
      saveState(init);
      return init;
    }
    const parsed = JSON.parse(raw);
    // Ensure demo users exist
    if (!parsed.users['user_owner_0812345678'] || !parsed.users['user_member_0855979291']) {
      const init = getInitialState();
      parsed.users = { ...init.users, ...parsed.users };
      parsed.houses = { ...init.houses, ...parsed.houses };
      parsed.members = { ...init.members, ...parsed.members };
      saveState(parsed);
    }
    return parsed;
  } catch (_e) {
    const init = getInitialState();
    saveState(init);
    return init;
  }
}

function saveState(state: LocalStoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_e) {}
}

function distributeFairSatang(
  totalSatang: number,
  memberIds: string[]
): { memberId: string; amountSatang: number }[] {
  if (memberIds.length === 0) return [];
  if (totalSatang <= 0) {
    return memberIds.map((id) => ({ memberId: id, amountSatang: 0 }));
  }
  const count = memberIds.length;
  const base = Math.floor(totalSatang / count);
  const remainder = totalSatang % count;
  return memberIds.map((id, index) => ({
    memberId: id,
    amountSatang: base + (index < remainder ? 1 : 0),
  }));
}

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function generatePromptPayPayload(targetPhone: string, amountBaht?: number): string {
  const cleanPhone = targetPhone.replace(/\D/g, '');
  const mobileFormatted = cleanPhone.startsWith('0') ? '0066' + cleanPhone.slice(1) : cleanPhone;
  const aid = emvField('00', 'A000000677010111');
  const recipient = emvField('01', mobileFormatted);
  const merchantInfo = emvField('29', `${aid}${recipient}`);
  let payload = `${emvField('00', '01')}${emvField('01', amountBaht ? '12' : '11')}${merchantInfo}${emvField('53', '764')}`;
  if (amountBaht && amountBaht > 0) {
    payload += emvField('54', amountBaht.toFixed(2));
  }
  payload += `${emvField('58', 'TH')}${emvField('63', '04')}`;
  const crc = crc16(payload);
  return `${payload.slice(0, -4)}${emvField('63', crc)}`;
}

export const localFallbackHandler = {
  // --- AUTH ---
  checkPhone: async (phone: string): Promise<PhoneCheckResponse> => {
    const state = loadState();
    const user = Object.values(state.users).find((u) => u.phone === phone);
    if (!user) {
      const pinLength = phone === '0855979291' ? 4 : 4;
      return { exists: false, isLocked: false, pinLength };
    }
    return {
      exists: true,
      isLocked: user.status === 'LOCKED' || user.failedAttempts >= 5,
      pinLength: user.pinLength || 4,
    };
  },

  loginPin: async (phone: string, pin: string): Promise<AuthSuccessResponse> => {
    const state = loadState();
    const user = Object.values(state.users).find((u) => u.phone === phone);
    if (!user) {
      throw new Error('ไม่พบบัญชีผู้ใช้ กรุณาลงทะเบียน');
    }
    if (user.status === 'LOCKED' || user.failedAttempts >= 5) {
      throw new Error('บัญชีถูกล็อก กรุณาใช้ Recovery Key');
    }

    if (user.pin !== pin) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= 5) {
        user.status = 'LOCKED';
      }
      saveState(state);
      const remaining = Math.max(0, 5 - user.failedAttempts);
      throw new Error(
        remaining === 0
          ? 'กรอก PIN ผิดครบ 5 ครั้ง บัญชีถูกล็อก'
          : `PIN ไม่ถูกต้อง (เหลือโอกาส ${remaining} ครั้ง)`
      );
    }

    user.failedAttempts = 0;
    saveState(state);

    const token = 'local_token_' + user.id;
    const { pin: _p, pinLength: _pl, failedAttempts: _fa, ...safeUser } = user;
    return { token, user: safeUser };
  },

  register: async (payload: RegisterPayload): Promise<AuthSuccessResponse> => {
    const state = loadState();
    let existing = Object.values(state.users).find((u) => u.phone === payload.phone);
    if (existing) {
      throw new Error('เบอร์โทรนี้ลงทะเบียนแล้ว');
    }

    const now = new Date().toISOString();
    const userId = 'user_' + uid();
    const newUser: StoredUser = {
      id: userId,
      phone: payload.phone,
      displayName: payload.displayName || 'สมาชิกใหม่',
      pin: payload.pin,
      pinLength: payload.pin.length,
      failedAttempts: 0,
      status: 'ACTIVE',
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    state.users[userId] = newUser;

    // Create a default house for new user
    const houseId = 'house_' + uid();
    const newHouse: House = {
      id: houseId,
      name: `บ้านของ ${newUser.displayName}`,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    state.houses[houseId] = newHouse;

    const memberId = 'member_' + uid();
    const newMember: HouseMember = {
      id: memberId,
      houseId: houseId,
      memberType: 'PERSON',
      isVirtual: false,
      gender: payload.gender || 'OTHER',
      themeColor: payload.themeColor || '#F97316',
      userId: userId,
      name: newUser.displayName,
      category: '',
      avatarUrl: null,
      role: 'OWNER',
      isPlaceholder: false,
      invitedPhone: payload.phone,
      isDeleted: false,
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    state.members[memberId] = newMember;
    saveState(state);

    const token = 'local_token_' + userId;
    const { pin: _p, pinLength: _pl, failedAttempts: _fa, ...safeUser } = newUser;
    return { token, user: safeUser };
  },

  getMe: async (token: string): Promise<{ user: User }> => {
    const state = loadState();
    const userId = token.replace('local_token_', '');
    const user = state.users[userId] || Object.values(state.users)[0];
    if (!user) {
      throw new Error('ไม่พบข้อมูลผู้ใช้');
    }
    const { pin: _p, pinLength: _pl, failedAttempts: _fa, ...safeUser } = user;
    return { user: safeUser };
  },

  verifyRecoveryKey: async (payload: VerifyRecoveryKeyPayload): Promise<AuthSuccessResponse> => {
    const state = loadState();
    const user = Object.values(state.users).find((u) => u.phone === payload.phone);
    if (!user) throw new Error('ไม่พบผู้ใช้');
    user.pin = payload.newPin;
    user.pinLength = payload.newPin.length;
    user.failedAttempts = 0;
    user.status = 'ACTIVE';
    saveState(state);
    const token = 'local_token_' + user.id;
    const { pin: _p, pinLength: _pl, failedAttempts: _fa, ...safeUser } = user;
    return { token, user: safeUser };
  },

  // --- HOUSES ---
  listHouses: async (userId: string): Promise<{ houses: House[] }> => {
    const state = loadState();
    const userMemberHouseIds = Object.values(state.members)
      .filter((m) => m.userId === userId && !m.isDeleted)
      .map((m) => m.houseId);

    const list = Object.values(state.houses).filter(
      (h) => userMemberHouseIds.includes(h.id) || h.createdBy === userId
    );

    // If no houses, create one
    if (list.length === 0) {
      const now = new Date().toISOString();
      const houseId = 'house_' + uid();
      const newHouse: House = {
        id: houseId,
        name: 'บ้านของฉัน',
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      };
      state.houses[houseId] = newHouse;

      const memberId = 'member_' + uid();
      const member: HouseMember = {
        id: memberId,
        houseId: houseId,
        memberType: 'PERSON',
        isVirtual: false,
        gender: 'OTHER',
        themeColor: '#F97316',
        userId: userId,
        name: state.users[userId]?.displayName || 'ฉัน',
        category: '',
        avatarUrl: null,
        role: 'OWNER',
        isPlaceholder: false,
        invitedPhone: null,
        isDeleted: false,
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      };
      state.members[memberId] = member;
      saveState(state);
      return { houses: [newHouse] };
    }

    return { houses: list };
  },

  createHouse: async (userId: string, name: string): Promise<{ house: House }> => {
    const state = loadState();
    const now = new Date().toISOString();
    const houseId = 'house_' + uid();
    const house: House = {
      id: houseId,
      name,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    state.houses[houseId] = house;

    const memberId = 'member_' + uid();
    const member: HouseMember = {
      id: memberId,
      houseId: houseId,
      memberType: 'PERSON',
      isVirtual: false,
      gender: 'OTHER',
      themeColor: '#F97316',
      userId: userId,
      name: state.users[userId]?.displayName || 'เจ้าของบ้าน',
      category: '',
      avatarUrl: null,
      role: 'OWNER',
      isPlaceholder: false,
      invitedPhone: null,
      isDeleted: false,
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    state.members[memberId] = member;
    saveState(state);
    return { house };
  },

  listMembers: async (houseId: string, viewerUserId: string): Promise<{ members: EnrichedMember[] }> => {
    const state = loadState();
    const rawMembers = Object.values(state.members).filter(
      (m) => m.houseId === houseId && !m.isDeleted
    );

    const enriched: EnrichedMember[] = rawMembers.map((m) => {
      let displayName = m.name;
      const aliasKey = `${viewerUserId}_${m.userId}`;
      const alias = state.aliases[aliasKey];
      if (alias) {
        displayName = `${alias.aliasName} (${m.name})`;
      }
      return {
        ...m,
        displayName,
        perspectiveAlias: alias?.aliasName,
        relationshipTag: alias?.relationshipTag,
      };
    });

    return { members: enriched };
  },

  createVirtualMember: async (
    houseId: string,
    userId: string,
    payload: { name: string; gender?: string; themeColor?: string; category?: string }
  ): Promise<{ member: HouseMember }> => {
    const state = loadState();
    const now = new Date().toISOString();
    const memberId = 'member_' + uid();
    const member: HouseMember = {
      id: memberId,
      houseId,
      memberType: 'PERSON',
      isVirtual: true,
      gender: (payload.gender as any) || 'OTHER',
      themeColor: payload.themeColor || '#10B981',
      userId: null,
      name: payload.name,
      category: payload.category || '',
      avatarUrl: null,
      role: 'MEMBER',
      isPlaceholder: false,
      invitedPhone: null,
      isDeleted: false,
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    state.members[memberId] = member;
    saveState(state);
    return { member };
  },

  createEntity: async (
    houseId: string,
    userId: string,
    payload: { memberType: 'PET' | 'ASSET'; name: string; category?: string; avatarUrl?: string | null; themeColor?: string }
  ): Promise<{ member: HouseMember }> => {
    const state = loadState();
    const now = new Date().toISOString();
    const memberId = 'member_' + uid();
    const member: HouseMember = {
      id: memberId,
      houseId,
      memberType: payload.memberType,
      isVirtual: true,
      gender: 'OTHER',
      themeColor: payload.themeColor || (payload.memberType === 'PET' ? '#F59E0B' : '#6366F1'),
      userId: null,
      name: payload.name,
      category: payload.category || '',
      avatarUrl: payload.avatarUrl || null,
      role: 'MEMBER',
      isPlaceholder: false,
      invitedPhone: null,
      isDeleted: false,
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    state.members[memberId] = member;
    saveState(state);
    return { member };
  },

  inviteMember: async (
    houseId: string,
    userId: string,
    payload: { phone: string; role?: 'ADMIN' | 'MEMBER' }
  ): Promise<{ member: HouseMember }> => {
    const state = loadState();
    const cleanPhone = payload.phone.replace(/\D/g, '');
    const existingUser = Object.values(state.users).find((u) => u.phone === cleanPhone);
    const now = new Date().toISOString();
    const memberId = 'member_' + uid();
    const member: HouseMember = {
      id: memberId,
      houseId,
      memberType: 'PERSON',
      isVirtual: false,
      gender: 'OTHER',
      themeColor: '#3B82F6',
      userId: existingUser ? existingUser.id : null,
      name: existingUser ? existingUser.displayName : `เบอร์ ${cleanPhone}`,
      category: '',
      avatarUrl: null,
      role: payload.role || 'MEMBER',
      isPlaceholder: !existingUser,
      invitedPhone: cleanPhone,
      isDeleted: false,
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    state.members[memberId] = member;
    saveState(state);
    return { member };
  },

  setPerspectiveAlias: async (
    _houseId: string,
    viewerUserId: string,
    targetUserId: string,
    payload: { aliasName: string; relationshipTag?: string }
  ): Promise<{ alias: PerspectiveAlias }> => {
    const state = loadState();
    const now = new Date().toISOString();
    const aliasKey = `${viewerUserId}_${targetUserId}`;
    const alias: PerspectiveAlias = {
      id: aliasKey,
      viewerUserId,
      targetUserId,
      aliasName: payload.aliasName,
      relationshipTag: payload.relationshipTag || '',
      createdAt: now,
      updatedAt: now,
    };
    state.aliases[aliasKey] = alias;
    saveState(state);
    return { alias };
  },

  // --- TASKS ---
  listTasks: async (
    houseId: string,
    filters?: { status?: string; holderId?: string }
  ): Promise<{ tasks: Task[] }> => {
    const state = loadState();
    let tasks = Object.values(state.tasks).filter((t) => t.houseId === houseId && !t.isDeleted);
    if (filters?.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }
    if (filters?.holderId) {
      tasks = tasks.filter((t) => t.currentHolderId === filters.holderId);
    }
    tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return { tasks };
  },

  getTaskDetail: async (houseId: string, taskId: string): Promise<{ task: EnrichedTask }> => {
    const state = loadState();
    const task = state.tasks[taskId];
    if (!task || task.houseId !== houseId) {
      throw new Error('ไม่พบข้อมูลงาน');
    }

    const holder = state.members[task.currentHolderId];
    const creator = Object.values(state.members).find(
      (m) => m.houseId === houseId && m.userId === task.createdBy
    );

    const splits = Object.values(state.splits).filter((s) => s.taskId === taskId);
    const subItems = Object.values(state.subItems).filter((s) => s.taskId === taskId);
    const timeline = Object.values(state.logs)
      .filter((l) => l.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return {
      task: {
        ...task,
        holderName: holder?.name || 'ไม่ระบุ',
        createdByName: creator?.name || 'ไม่ระบุ',
        splits,
        subItems,
        timeline,
      },
    };
  },

  createTask: async (
    houseId: string,
    userId: string,
    payload: CreateTaskPayload
  ): Promise<{ task: EnrichedTask }> => {
    const state = loadState();
    const now = new Date().toISOString();
    const taskId = 'task_' + uid();

    const task: Task = {
      id: taskId,
      houseId,
      title: payload.title,
      description: payload.description || null,
      createdBy: userId,
      currentHolderId: payload.holderId,
      status: 'PENDING',
      dueDate: payload.dueDate,
      reminderAt: payload.reminderAt || null,
      recurrenceIntervalDays: payload.recurrenceIntervalDays || null,
      hasExpense: payload.hasExpense,
      amountSatang: payload.amountSatang || 0,
      splitType: payload.splitType || 'EQUAL',
      relatedMemberId: payload.relatedMemberId || null,
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    state.tasks[taskId] = task;

    // Splits
    const createdSplits: TaskSplitItem[] = [];
    if (payload.hasExpense && payload.splitMembers && payload.splitMembers.length > 0) {
      if (payload.splitType === 'EQUAL') {
        const memberIds = payload.splitMembers.map((m) => m.memberId);
        const distributed = distributeFairSatang(payload.amountSatang, memberIds);
        for (const dist of distributed) {
          const splitId = 'split_' + uid();
          const splitItem: TaskSplitItem = {
            id: splitId,
            taskId,
            memberId: dist.memberId,
            amountSatang: dist.amountSatang,
            isPaid: false,
            paidAt: null,
          };
          state.splits[splitId] = splitItem;
          createdSplits.push(splitItem);
        }
      } else {
        for (const m of payload.splitMembers) {
          const splitId = 'split_' + uid();
          const splitItem: TaskSplitItem = {
            id: splitId,
            taskId,
            memberId: m.memberId,
            amountSatang: m.amountSatang || 0,
            isPaid: false,
            paidAt: null,
          };
          state.splits[splitId] = splitItem;
          createdSplits.push(splitItem);
        }
      }
    }

    // Sub items
    const createdSubItems: TaskSubItem[] = [];
    if (payload.subItems) {
      for (const item of payload.subItems) {
        const subId = 'sub_' + uid();
        const subItem: TaskSubItem = {
          id: subId,
          taskId,
          title: item.title,
          amountSatang: item.amountSatang,
        };
        state.subItems[subId] = subItem;
        createdSubItems.push(subItem);
      }
    }

    saveState(state);

    const holder = state.members[payload.holderId];
    return {
      task: {
        ...task,
        holderName: holder?.name,
        splits: createdSplits,
        subItems: createdSubItems,
        timeline: [],
      },
    };
  },

  updateTitle: async (houseId: string, taskId: string, title: string): Promise<{ task: Task }> => {
    const state = loadState();
    const task = state.tasks[taskId];
    if (!task || task.houseId !== houseId) throw new Error('ไม่พบงาน');
    task.title = title;
    task.updatedAt = new Date().toISOString();
    saveState(state);
    return { task };
  },

  handoverTask: async (
    houseId: string,
    taskId: string,
    payload: HandoverPayload
  ): Promise<{ task: Task; log: HandoverLog }> => {
    const state = loadState();
    const task = state.tasks[taskId];
    if (!task || task.houseId !== houseId) throw new Error('ไม่พบงาน');

    const fromMemberId = task.currentHolderId;
    const now = new Date().toISOString();

    if (payload.action === 'COMPLETE') {
      task.status = 'COMPLETED';
    } else {
      task.currentHolderId = payload.toMemberId;
      task.status = 'IN_PROGRESS';
    }
    task.updatedAt = now;

    const logId = 'log_' + uid();
    const log: HandoverLog = {
      id: logId,
      taskId,
      fromMemberId,
      toMemberId: payload.toMemberId,
      action: payload.action,
      note: payload.note || null,
      createdAt: now,
    };
    state.logs[logId] = log;
    saveState(state);

    return { task, log };
  },

  deleteTask: async (houseId: string, taskId: string): Promise<void> => {
    const state = loadState();
    const task = state.tasks[taskId];
    if (!task || task.houseId !== houseId) return;
    task.isDeleted = true;
    task.deletedAt = new Date().toISOString();
    saveState(state);
  },

  // --- FINANCE ---
  getBalances: async (houseId: string): Promise<{ balances: NetBalance[] }> => {
    const state = loadState();
    const members = Object.values(state.members).filter(
      (m) => m.houseId === houseId && !m.isDeleted
    );

    const balanceMap = new Map<string, number>();
    for (const m of members) {
      balanceMap.set(m.id, 0);
    }

    const unpaidSplits = Object.values(state.splits).filter((s) => !s.isPaid);
    for (const split of unpaidSplits) {
      const task = state.tasks[split.taskId];
      if (!task || task.houseId !== houseId || task.isDeleted) continue;

      const creatorMember = members.find((m) => m.userId === task.createdBy);
      const debtorMemberId = split.memberId;

      if (creatorMember && creatorMember.id !== debtorMemberId) {
        balanceMap.set(debtorMemberId, (balanceMap.get(debtorMemberId) || 0) + split.amountSatang);
        balanceMap.set(creatorMember.id, (balanceMap.get(creatorMember.id) || 0) - split.amountSatang);
      }
    }

    const balances: NetBalance[] = members.map((m) => {
      const net = balanceMap.get(m.id) || 0;
      let status: 'OWED' | 'OWES' | 'SETTLED' = 'SETTLED';
      if (net > 0) status = 'OWES';
      else if (net < 0) status = 'OWED';

      return {
        memberId: m.id,
        name: m.name,
        isVirtual: m.isVirtual,
        netSatang: Math.abs(net),
        status,
      };
    });

    return { balances };
  },

  settleVirtual: async (_houseId: string, virtualMemberId: string): Promise<{ message: string }> => {
    const state = loadState();
    const unpaid = Object.values(state.splits).filter(
      (s) => s.memberId === virtualMemberId && !s.isPaid
    );
    const now = new Date().toISOString();
    for (const s of unpaid) {
      s.isPaid = true;
      s.paidAt = now;
    }
    saveState(state);
    return { message: 'เคลียร์ยอดสำเร็จ' };
  },

  getPromptPayQr: async (
    _houseId: string,
    toMemberId: string,
    amountSatang?: number
  ): Promise<PromptPayQrResponse> => {
    const state = loadState();
    const member = state.members[toMemberId];
    const phone = member?.invitedPhone || '0812345678';
    const amountBaht = amountSatang ? amountSatang / 100 : 0;
    const qrPayload = generatePromptPayPayload(phone, amountBaht);
    return {
      qrPayload,
      amountBaht,
      phone,
    };
  },
};

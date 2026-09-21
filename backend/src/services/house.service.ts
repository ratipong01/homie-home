import { randomUUID } from 'crypto';
import type {
  HouseRecord,
  HouseMemberRecord,
  PerspectiveAliasRecord,
  UserRecord,
} from '../types/database.js';
import { MemoryStore } from '../types/store.js';
import type {
  CreateHouseInput,
  CreateVirtualMemberInput,
  CreatePetOrAssetInput,
  InviteMemberInput,
  SetPerspectiveAliasInput,
} from '../schemas/house.schema.js';

export interface EnrichedMemberDto {
  id: string;
  houseId: string;
  memberType: 'PERSON' | 'PET' | 'ASSET';
  isVirtual: boolean;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  themeColor: string;
  userId: string | null;
  name: string;
  displayName: string;
  category: string | null;
  avatarUrl: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  isPlaceholder: boolean;
  invitedPhone: string | null;
  isDeleted: boolean;
  perspectiveAlias?: string;
  relationshipTag?: string;
  createdAt: string;
  updatedAt: string;
}

export class HouseService {
  static async listUserHouses(userId: string): Promise<HouseRecord[]> {
    const userMemberHouses = Array.from(MemoryStore.houseMembers.values())
      .filter((m) => m.user_id === userId && !m.is_deleted)
      .map((m) => m.house_id);

    return Array.from(MemoryStore.houses.values()).filter((h) =>
      userMemberHouses.includes(h.id)
    );
  }

  static async createHouse(userId: string, input: CreateHouseInput): Promise<HouseRecord> {
    const houseId = randomUUID();
    const now = new Date().toISOString();

    const house: HouseRecord = {
      id: houseId,
      name: input.name,
      created_by: userId,
      created_at: now,
      updated_at: now,
    };
    MemoryStore.houses.set(houseId, house);

    // Creator automatically becomes OWNER
    const user = MemoryStore.users.get(userId);
    const memberId = randomUUID();
    const member: HouseMemberRecord = {
      id: memberId,
      house_id: houseId,
      member_type: 'PERSON',
      is_virtual: false,
      gender: user?.gender || 'OTHER',
      theme_color: user?.theme_color || '#F97316',
      user_id: userId,
      name: user?.display_name || 'หัวหน้าบ้าน',
      category: null,
      avatar_url: user?.avatar_url || null,
      role: 'OWNER',
      is_placeholder: false,
      invited_phone: user?.phone || null,
      is_deleted: false,
      deleted_at: null,
      created_by: userId,
      updated_by: userId,
      created_at: now,
      updated_at: now,
    };
    MemoryStore.houseMembers.set(memberId, member);

    return house;
  }

  static async listHouseMembers(houseId: string, viewerUserId: string): Promise<EnrichedMemberDto[]> {
    const members = Array.from(MemoryStore.houseMembers.values()).filter(
      (m) => m.house_id === houseId && !m.is_deleted
    );

    return members.map((m) => {
      let displayName = m.name;
      let userObj: UserRecord | undefined;
      if (m.user_id) {
        userObj = MemoryStore.users.get(m.user_id);
        if (userObj) {
          displayName = userObj.display_name;
        }
      }

      // Check 1-way perspective alias for viewer
      let perspectiveAlias: string | undefined;
      let relationshipTag: string | undefined;
      if (m.user_id) {
        const aliasKey = `${viewerUserId}_${m.user_id}`;
        const alias = MemoryStore.perspectiveAliases.get(aliasKey);
        if (alias) {
          perspectiveAlias = alias.alias_name;
          relationshipTag = alias.relationship_tag;
        }
      }

      return {
        id: m.id,
        houseId: m.house_id,
        memberType: m.member_type,
        isVirtual: m.is_virtual,
        gender: m.gender,
        themeColor: m.theme_color,
        userId: m.user_id,
        name: m.name,
        displayName: perspectiveAlias || displayName,
        category: m.category,
        avatarUrl: m.user_id && userObj?.avatar_url ? userObj.avatar_url : m.avatar_url,
        role: m.role,
        isPlaceholder: m.is_placeholder,
        invitedPhone: m.invited_phone,
        isDeleted: m.is_deleted,
        perspectiveAlias,
        relationshipTag,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      };
    });
  }

  static async createVirtualMember(
    houseId: string,
    creatorUserId: string,
    input: CreateVirtualMemberInput
  ): Promise<HouseMemberRecord> {
    const virtualUserId = randomUUID();
    const now = new Date().toISOString();

    const virtualUser: UserRecord = {
      id: virtualUserId,
      phone: null,
      pin_hash: null,
      display_name: input.name,
      gender: input.gender,
      avatar_url: null,
      theme_color: input.themeColor,
      is_virtual: true,
      status: 'ACTIVE',
      failed_attempts: 0,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };
    MemoryStore.users.set(virtualUserId, virtualUser);

    const memberId = randomUUID();
    const member: HouseMemberRecord = {
      id: memberId,
      house_id: houseId,
      member_type: 'PERSON',
      is_virtual: true,
      gender: input.gender,
      theme_color: input.themeColor,
      user_id: virtualUserId,
      name: input.name,
      category: input.category || null,
      avatar_url: null,
      role: 'MEMBER',
      is_placeholder: false,
      invited_phone: null,
      is_deleted: false,
      deleted_at: null,
      created_by: creatorUserId,
      updated_by: creatorUserId,
      created_at: now,
      updated_at: now,
    };
    MemoryStore.houseMembers.set(memberId, member);

    return member;
  }

  static async createPetOrAsset(
    houseId: string,
    creatorUserId: string,
    input: CreatePetOrAssetInput
  ): Promise<HouseMemberRecord> {
    const now = new Date().toISOString();
    const memberId = randomUUID();

    const member: HouseMemberRecord = {
      id: memberId,
      house_id: houseId,
      member_type: input.memberType,
      is_virtual: false,
      gender: 'OTHER',
      theme_color: input.themeColor,
      user_id: null,
      name: input.name,
      category: input.category || null,
      avatar_url: input.avatarUrl || null,
      role: 'MEMBER',
      is_placeholder: false,
      invited_phone: null,
      is_deleted: false,
      deleted_at: null,
      created_by: creatorUserId,
      updated_by: creatorUserId,
      created_at: now,
      updated_at: now,
    };
    MemoryStore.houseMembers.set(memberId, member);

    return member;
  }

  static async inviteMember(
    houseId: string,
    inviterUserId: string,
    input: InviteMemberInput
  ): Promise<HouseMemberRecord> {
    const now = new Date().toISOString();
    const existingUserId = MemoryStore.phoneIndex.get(input.phone);
    let targetUser: UserRecord | undefined;
    if (existingUserId) {
      targetUser = MemoryStore.users.get(existingUserId);
    }

    const memberId = randomUUID();
    const member: HouseMemberRecord = {
      id: memberId,
      house_id: houseId,
      member_type: 'PERSON',
      is_virtual: false,
      gender: targetUser?.gender || 'OTHER',
      theme_color: targetUser?.theme_color || '#F97316',
      user_id: targetUser?.id || null,
      name: targetUser?.display_name || input.phone,
      category: null,
      avatar_url: targetUser?.avatar_url || null,
      role: input.role,
      is_placeholder: !targetUser,
      invited_phone: input.phone,
      is_deleted: false,
      deleted_at: null,
      created_by: inviterUserId,
      updated_by: inviterUserId,
      created_at: now,
      updated_at: now,
    };
    MemoryStore.houseMembers.set(memberId, member);

    return member;
  }

  static async setPerspectiveAlias(
    viewerUserId: string,
    targetUserId: string,
    input: SetPerspectiveAliasInput
  ): Promise<PerspectiveAliasRecord> {
    const now = new Date().toISOString();
    const aliasKey = `${viewerUserId}_${targetUserId}`;

    const existing = MemoryStore.perspectiveAliases.get(aliasKey);
    const aliasRecord: PerspectiveAliasRecord = {
      id: existing?.id || randomUUID(),
      viewer_user_id: viewerUserId,
      target_user_id: targetUserId,
      alias_name: input.aliasName,
      relationship_tag: input.relationshipTag,
      created_at: existing?.created_at || now,
      updated_at: now,
    };
    MemoryStore.perspectiveAliases.set(aliasKey, aliasRecord);

    return aliasRecord;
  }
}

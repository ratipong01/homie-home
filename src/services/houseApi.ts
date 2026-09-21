import { apiFetch } from './apiClient';
import type { House, HouseMember, PerspectiveAlias } from '../types';

export interface EnrichedMember extends HouseMember {
  displayName: string;
  perspectiveAlias?: string;
  relationshipTag?: string;
}

export interface CreateHousePayload {
  name: string;
}

export interface CreateVirtualMemberPayload {
  name: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  themeColor?: string;
  category?: string;
}

export interface CreateEntityPayload {
  memberType: 'PET' | 'ASSET';
  name: string;
  category?: string;
  avatarUrl?: string | null;
  themeColor?: string;
}

export interface InviteMemberPayload {
  phone: string;
  role?: 'ADMIN' | 'MEMBER';
}

export interface SetPerspectiveAliasPayload {
  aliasName: string;
  relationshipTag?: string;
}

export const houseApi = {
  listHouses: async (): Promise<{ houses: House[] }> => {
    return apiFetch<{ houses: House[] }>('/houses');
  },

  createHouse: async (payload: CreateHousePayload): Promise<{ house: House }> => {
    return apiFetch<{ house: House }>('/houses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listMembers: async (houseId: string): Promise<{ members: EnrichedMember[] }> => {
    return apiFetch<{ members: EnrichedMember[] }>(`/houses/${houseId}/members`);
  },

  createVirtualMember: async (
    houseId: string,
    payload: CreateVirtualMemberPayload
  ): Promise<{ member: HouseMember }> => {
    return apiFetch<{ member: HouseMember }>(`/houses/${houseId}/members/virtual`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createEntity: async (
    houseId: string,
    payload: CreateEntityPayload
  ): Promise<{ member: HouseMember }> => {
    return apiFetch<{ member: HouseMember }>(`/houses/${houseId}/members/entity`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  inviteMember: async (
    houseId: string,
    payload: InviteMemberPayload
  ): Promise<{ member: HouseMember }> => {
    return apiFetch<{ member: HouseMember }>(`/houses/${houseId}/members/invite`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  setPerspectiveAlias: async (
    houseId: string,
    targetUserId: string,
    payload: SetPerspectiveAliasPayload
  ): Promise<{ alias: PerspectiveAlias }> => {
    return apiFetch<{ alias: PerspectiveAlias }>(
      `/houses/${houseId}/members/${targetUserId}/alias`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  },
};

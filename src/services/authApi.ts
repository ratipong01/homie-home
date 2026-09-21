import { apiFetch } from './apiClient';
import type { User } from '../types';

export interface PhoneCheckResponse {
  exists: boolean;
  isLocked: boolean;
  pinLength?: number;
}

export interface AuthSuccessResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  phone: string;
  pin: string;
  displayName: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  themeColor?: string;
}

export interface CreateRecoveryKeyPayload {
  targetUserId: string;
  houseId: string;
}

export interface VerifyRecoveryKeyPayload {
  phone: string;
  recoveryKey: string;
  newPin: string;
}

export const authApi = {
  checkPhone: async (phone: string): Promise<PhoneCheckResponse> => {
    return apiFetch<PhoneCheckResponse>('/auth/phone-check', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  loginPin: async (phone: string, pin: string): Promise<AuthSuccessResponse> => {
    return apiFetch<AuthSuccessResponse>('/auth/login-pin', {
      method: 'POST',
      body: JSON.stringify({ phone, pin }),
    });
  },

  register: async (payload: RegisterPayload): Promise<AuthSuccessResponse> => {
    return apiFetch<AuthSuccessResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createRecoveryKey: async (payload: CreateRecoveryKeyPayload): Promise<{ recoveryKey: string; expiresAt: string }> => {
    return apiFetch<{ recoveryKey: string; expiresAt: string }>('/auth/recovery-key/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  verifyRecoveryKey: async (payload: VerifyRecoveryKeyPayload): Promise<AuthSuccessResponse> => {
    return apiFetch<AuthSuccessResponse>('/auth/recovery-key/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMe: async (): Promise<{ user: User }> => {
    return apiFetch<{ user: User }>('/auth/me');
  },
};

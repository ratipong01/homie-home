import { localFallbackHandler } from './mockStore';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

// Intercept and dispatch to local fallback when the hosting environment does not have a backend
// (e.g. Cloudflare Workers returning 405 Method Not Allowed or 404 for POST /api/v1)
async function dispatchLocalFallback<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};
  const token = localStorage.getItem('homie_auth_token') || '';
  const currentUser = localStorage.getItem('homie_auth_user')
    ? JSON.parse(localStorage.getItem('homie_auth_user')!)
    : null;
  const currentUserId = currentUser?.id || 'user_owner_0812345678';

  // --- AUTH ---
  if (endpoint === '/auth/phone-check') {
    const res = await localFallbackHandler.checkPhone(body.phone);
    return res as unknown as T;
  }
  if (endpoint === '/auth/login-pin') {
    const res = await localFallbackHandler.loginPin(body.phone, body.pin);
    return res as unknown as T;
  }
  if (endpoint === '/auth/register') {
    const res = await localFallbackHandler.register(body);
    return res as unknown as T;
  }
  if (endpoint === '/auth/me') {
    const res = await localFallbackHandler.getMe(token);
    return res as unknown as T;
  }
  if (endpoint === '/auth/recovery-key/verify') {
    const res = await localFallbackHandler.verifyRecoveryKey(body);
    return res as unknown as T;
  }

  // --- HOUSES ---
  if (endpoint === '/houses') {
    if (method === 'POST') {
      const res = await localFallbackHandler.createHouse(currentUserId, body.name);
      return res as unknown as T;
    }
    const res = await localFallbackHandler.listHouses(currentUserId);
    return res as unknown as T;
  }

  const memberMatch = endpoint.match(/^\/houses\/([^/]+)\/members(\/.*)?$/);
  if (memberMatch) {
    const houseId = memberMatch[1];
    const sub = memberMatch[2] || '';
    if (sub === '' && method === 'GET') {
      const res = await localFallbackHandler.listMembers(houseId, currentUserId);
      return res as unknown as T;
    }
    if (sub === '/virtual' && method === 'POST') {
      const res = await localFallbackHandler.createVirtualMember(houseId, currentUserId, body);
      return res as unknown as T;
    }
    if (sub === '/entity' && method === 'POST') {
      const res = await localFallbackHandler.createEntity(houseId, currentUserId, body);
      return res as unknown as T;
    }
    if (sub === '/invite' && method === 'POST') {
      const res = await localFallbackHandler.inviteMember(houseId, currentUserId, body);
      return res as unknown as T;
    }
    const aliasMatch = sub.match(/^\/([^/]+)\/alias$/);
    if (aliasMatch && (method === 'PATCH' || method === 'POST')) {
      const targetUserId = aliasMatch[1];
      const res = await localFallbackHandler.setPerspectiveAlias(houseId, currentUserId, targetUserId, body);
      return res as unknown as T;
    }
  }

  // --- TASKS ---
  const taskMatch = endpoint.match(/^\/houses\/([^/]+)\/tasks(\/.*)?$/);
  if (taskMatch) {
    const houseId = taskMatch[1];
    const sub = taskMatch[2] || '';
    if (sub === '' || sub.startsWith('?')) {
      if (method === 'POST') {
        const res = await localFallbackHandler.createTask(houseId, currentUserId, body);
        return res as unknown as T;
      }
      const res = await localFallbackHandler.listTasks(houseId);
      return res as unknown as T;
    }
    const singleTaskMatch = sub.match(/^\/([^/?]+)(\/.*)?$/);
    if (singleTaskMatch) {
      const taskId = singleTaskMatch[1];
      const action = singleTaskMatch[2] || '';
      if (action === '' && method === 'GET') {
        const res = await localFallbackHandler.getTaskDetail(houseId, taskId);
        return res as unknown as T;
      }
      if (action === '' && method === 'DELETE') {
        await localFallbackHandler.deleteTask(houseId, taskId);
        return {} as unknown as T;
      }
      if (action === '/title' && method === 'PATCH') {
        const res = await localFallbackHandler.updateTitle(houseId, taskId, body.title);
        return res as unknown as T;
      }
      if (action === '/handover' && method === 'POST') {
        const res = await localFallbackHandler.handoverTask(houseId, taskId, body);
        return res as unknown as T;
      }
    }
  }

  // --- FINANCE ---
  const financeMatch = endpoint.match(/^\/houses\/([^/]+)\/finance\/(.+)$/);
  if (financeMatch) {
    const houseId = financeMatch[1];
    const finAction = financeMatch[2];
    if (finAction === 'balances') {
      const res = await localFallbackHandler.getBalances(houseId);
      return res as unknown as T;
    }
    if (finAction === 'settle-virtual') {
      const res = await localFallbackHandler.settleVirtual(houseId, body.virtualMemberId);
      return res as unknown as T;
    }
    if (finAction === 'promptpay-qr') {
      const res = await localFallbackHandler.getPromptPayQr(houseId, body.toMemberId, body.amountSatang);
      return res as unknown as T;
    }
  }

  // Fallback for AI parse
  if (endpoint === '/ai/parse-task') {
    return {
      title: body.text || 'งานบ้านใหม่',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      amountSatang: 0,
      hasExpense: false,
      splitNames: [],
    } as unknown as T;
  }

  throw new ApiError('Not found in local fallback', 'NOT_FOUND', 404);
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('homie_auth_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // When deployed as a static site (Cloudflare Workers / Pages) without Fastify backend proxy:
    // POST/PUT/PATCH/DELETE or even GET /api/v1 returns 405 Method Not Allowed or 404
    if (response.status === 405 || response.status === 404) {
      return await dispatchLocalFallback<T>(endpoint, options);
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.error?.message || `Request failed with status ${response.status}`;
      const code = data?.error?.code || 'API_ERROR';
      throw new ApiError(message, code, response.status);
    }

    return data?.data ?? (data as T);
  } catch (err: any) {
    // If it's a network error (e.g. backend completely down or offline), fallback to local
    if (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      return await dispatchLocalFallback<T>(endpoint, options);
    }
    throw err;
  }
}

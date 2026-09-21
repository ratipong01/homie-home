import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
  };
}

export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'กรุณาเข้าสู่ระบบ',
      },
    });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = AuthService.verifyToken(token);
    (request as AuthenticatedRequest).user = {
      id: payload.sub,
    };
  } catch (_err) {
    reply.status(401).send({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
      },
    });
  }
}

import type { FastifyInstance } from 'fastify';
import {
  PhoneCheckSchema,
  LoginPinSchema,
  RegisterSchema,
  CreateRecoveryKeySchema,
  VerifyRecoveryKeySchema,
} from '../schemas/auth.schema.js';
import { AuthService } from '../services/auth.service.js';
import { authenticateToken, type AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Public: Phone check
  app.post('/phone-check', async (request, reply) => {
    const body = PhoneCheckSchema.parse(request.body);
    const result = await AuthService.checkPhone(body.phone);
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  // Public: Login with PIN
  app.post('/login-pin', async (request, reply) => {
    const body = LoginPinSchema.parse(request.body);
    const result = await AuthService.loginPin(body.phone, body.pin);
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  // Public: Register first-time user
  app.post('/register', async (request, reply) => {
    const body = RegisterSchema.parse(request.body);
    const result = await AuthService.register(body);
    return reply.status(201).send({
      success: true,
      data: result,
    });
  });

  // Public: Verify recovery key & reset PIN
  app.post('/recovery-key/verify', async (request, reply) => {
    const body = VerifyRecoveryKeySchema.parse(request.body);
    const result = await AuthService.verifyRecoveryKey(body.phone, body.recoveryKey, body.newPin);
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  // Protected: Owner/Admin creates recovery key for another member
  app.post(
    '/recovery-key/create',
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const body = CreateRecoveryKeySchema.parse(request.body);
      const result = await AuthService.createRecoveryKey(body.targetUserId, body.houseId);
      return reply.status(201).send({
        success: true,
        data: result,
      });
    }
  );

  // Protected: Get current user profile
  app.get(
    '/me',
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const authReq = request as AuthenticatedRequest;
      const user = AuthService.getUserById(authReq.user!.id);
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'ไม่พบผู้ใช้' },
        });
      }
      return reply.status(200).send({
        success: true,
        data: { user },
      });
    }
  );
}

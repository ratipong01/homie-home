import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { VesselService } from '../services/vessel.service.js';
import { authenticateToken, type AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { ClaimVesselSchema, TransferOwnershipSchema } from '../schemas/house.schema.js';

export async function vesselRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticateToken);

  // Kick member -> convert to vessel
  app.post('/houses/:houseId/members/:memberId/kick', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const { houseId, memberId } = request.params as { houseId: string; memberId: string };
    await VesselService.kickMember(houseId, memberId, authReq.user!.id);
    return reply.status(200).send({
      success: true,
      data: { message: 'นำสมาชิกออกและแปลงเป็นภาชนะ (Vessel) สำเร็จ' },
    });
  });

  // Claim vessel
  app.post('/houses/:houseId/members/:memberId/claim-vessel', async (request, reply) => {
    const { houseId, memberId } = request.params as { houseId: string; memberId: string };
    const body = ClaimVesselSchema.parse(request.body);
    await VesselService.claimVessel(houseId, memberId, body.phone, body.debtChoice);
    return reply.status(200).send({
      success: true,
      data: { message: 'ส่งคำเชิญสิงร่างสำเร็จ' },
    });
  });

  // Transfer house ownership
  app.post('/houses/:houseId/transfer-ownership', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const { houseId } = request.params as { houseId: string };
    const body = TransferOwnershipSchema.parse(request.body);
    await VesselService.transferOwnership(houseId, authReq.user!.id, body.targetUserId);
    return reply.status(200).send({
      success: true,
      data: { message: 'โอนสิทธิ์ความเป็นเจ้าของบ้านสำเร็จ' },
    });
  });

  // Account deletion request (30-day grace period)
  app.post('/auth/account-deletion', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const result = await VesselService.requestAccountDeletion(authReq.user!.id);
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });
}

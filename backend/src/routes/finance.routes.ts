import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { FinanceService } from '../services/finance.service.js';
import { authenticateToken, type AuthenticatedRequest } from '../middlewares/auth.middleware.js';

const SettleVirtualSchema = z.object({
  virtualMemberId: z.string().uuid(),
});

const PromptPaySchema = z.object({
  toMemberId: z.string().uuid(),
  amountSatang: z.number().int().nonnegative().optional(),
});

export async function financeRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticateToken);

  // Get net balances
  app.get('/houses/:houseId/finance/balances', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const { houseId } = request.params as { houseId: string };
    const balances = await FinanceService.getHouseBalances(houseId, authReq.user!.id);
    return reply.status(200).send({
      success: true,
      data: { balances },
    });
  });

  // Settle virtual member
  app.post('/houses/:houseId/finance/settle-virtual', async (request, reply) => {
    const { houseId } = request.params as { houseId: string };
    const body = SettleVirtualSchema.parse(request.body);
    await FinanceService.settleVirtualMember(houseId, body.virtualMemberId);
    return reply.status(200).send({
      success: true,
      data: { message: 'บันทึกการรับเงินสดสำเร็จ ยอดหนี้เป็น 0' },
    });
  });

  // Generate PromptPay QR
  app.post('/houses/:houseId/finance/promptpay-qr', async (request, reply) => {
    const { houseId } = request.params as { houseId: string };
    const body = PromptPaySchema.parse(request.body);
    const result = await FinanceService.generatePromptPayQr(
      houseId,
      body.toMemberId,
      body.amountSatang
    );
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });
}

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { GeminiService } from '../services/gemini.service.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const ParseTaskSchema = z.object({
  text: z.string().min(1, 'ต้องระบุข้อความ'),
});

const ReceiptOcrSchema = z.object({
  imageBase64: z.string().min(1, 'ต้องระบุข้อมูลรูปภาพ'),
});

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticateToken);

  // Parse natural language task
  app.post('/parse-task', async (request, reply) => {
    const body = ParseTaskSchema.parse(request.body);
    const result = await GeminiService.parseNaturalLanguageTask(body.text);
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  // Receipt OCR parsing
  app.post('/receipt-ocr', async (request, reply) => {
    const body = ReceiptOcrSchema.parse(request.body);
    const result = await GeminiService.parseReceiptOcr(body.imageBase64);
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });
}

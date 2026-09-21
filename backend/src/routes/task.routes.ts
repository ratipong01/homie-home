import type { FastifyInstance } from 'fastify';
import {
  CreateTaskSchema,
  UpdateTaskTitleSchema,
  HandoverTaskSchema,
} from '../schemas/task.schema.js';
import { TaskService } from '../services/task.service.js';
import { authenticateToken, type AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export async function taskRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticateToken);

  // List tasks in house
  app.get('/houses/:houseId/tasks', async (request, reply) => {
    const { houseId } = request.params as { houseId: string };
    const query = request.query as { status?: string; holderId?: string };
    const tasks = await TaskService.listHouseTasks(houseId, query);
    return reply.status(200).send({
      success: true,
      data: { tasks },
    });
  });

  // Get task detail
  app.get('/houses/:houseId/tasks/:taskId', async (request, reply) => {
    const { taskId } = request.params as { houseId: string; taskId: string };
    const task = await TaskService.getTaskDetail(taskId);
    return reply.status(200).send({
      success: true,
      data: { task },
    });
  });

  // Create task
  app.post('/houses/:houseId/tasks', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const { houseId } = request.params as { houseId: string };
    const body = CreateTaskSchema.parse(request.body);
    const task = await TaskService.createTask(houseId, authReq.user!.id, body);
    return reply.status(201).send({
      success: true,
      data: { task },
    });
  });

  // Update title (Strictly created_by)
  app.patch('/houses/:houseId/tasks/:taskId/title', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const { taskId } = request.params as { houseId: string; taskId: string };
    const body = UpdateTaskTitleSchema.parse(request.body);
    const task = await TaskService.updateTitle(taskId, authReq.user!.id, body);
    return reply.status(200).send({
      success: true,
      data: { task },
    });
  });

  // Handover ball (RETURN, FORWARD, COMPLETE)
  app.post('/houses/:houseId/tasks/:taskId/handover', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const { taskId } = request.params as { houseId: string; taskId: string };
    const body = HandoverTaskSchema.parse(request.body);
    const result = await TaskService.handoverTask(taskId, authReq.user!.id, body);
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  // Soft delete task (Strictly created_by)
  app.delete('/houses/:houseId/tasks/:taskId', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const { taskId } = request.params as { houseId: string; taskId: string };
    await TaskService.deleteTask(taskId, authReq.user!.id);
    return reply.status(200).send({
      success: true,
      data: { message: 'ลบงานเรียบร้อย' },
    });
  });
}

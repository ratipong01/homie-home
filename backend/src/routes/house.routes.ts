import type { FastifyInstance } from 'fastify';
import {
  CreateHouseSchema,
  CreateVirtualMemberSchema,
  CreatePetOrAssetSchema,
  InviteMemberSchema,
  SetPerspectiveAliasSchema,
} from '../schemas/house.schema.js';
import { HouseService } from '../services/house.service.js';
import { authenticateToken, type AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export async function houseRoutes(app: FastifyInstance): Promise<void> {
  // All house routes require valid Bearer token
  app.addHook('preHandler', authenticateToken);

  // List houses where caller is a member
  app.get('/', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const houses = await HouseService.listUserHouses(authReq.user!.id);
    return reply.status(200).send({
      success: true,
      data: { houses },
    });
  });

  // Create house
  app.post('/', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const body = CreateHouseSchema.parse(request.body);
    const house = await HouseService.createHouse(authReq.user!.id, body);
    return reply.status(201).send({
      success: true,
      data: { house },
    });
  });

  // List members in a house
  app.get('/:houseId/members', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const { houseId } = request.params as { houseId: string };
    const members = await HouseService.listHouseMembers(houseId, authReq.user!.id);
    return reply.status(200).send({
      success: true,
      data: { members },
    });
  });

  // Add virtual member
  app.post('/:houseId/members/virtual', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const { houseId } = request.params as { houseId: string };
    const body = CreateVirtualMemberSchema.parse(request.body);
    const member = await HouseService.createVirtualMember(houseId, authReq.user!.id, body);
    return reply.status(201).send({
      success: true,
      data: { member },
    });
  });

  // Add pet or asset
  app.post('/:houseId/members/entity', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const { houseId } = request.params as { houseId: string };
    const body = CreatePetOrAssetSchema.parse(request.body);
    const member = await HouseService.createPetOrAsset(houseId, authReq.user!.id, body);
    return reply.status(201).send({
      success: true,
      data: { member },
    });
  });

  // Invite member by phone
  app.post('/:houseId/members/invite', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const { houseId } = request.params as { houseId: string };
    const body = InviteMemberSchema.parse(request.body);
    const member = await HouseService.inviteMember(houseId, authReq.user!.id, body);
    return reply.status(201).send({
      success: true,
      data: { member },
    });
  });

  // Set 1-way perspective alias
  app.patch('/:houseId/members/:targetUserId/alias', async (request, reply) => {
    const authReq = request as AuthenticatedRequest;
    const { targetUserId } = request.params as { houseId: string; targetUserId: string };
    const body = SetPerspectiveAliasSchema.parse(request.body);
    const alias = await HouseService.setPerspectiveAlias(authReq.user!.id, targetUserId, body);
    return reply.status(200).send({
      success: true,
      data: { alias },
    });
  });
}

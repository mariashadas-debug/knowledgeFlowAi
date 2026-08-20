import { Router } from 'express';
import { z } from 'zod';

import { AppError } from '../errors/app-error.js';
import type { ConversationsService } from '../services/conversations-service.js';

const conversationIdSchema = z.uuid();
const messageSchema = z.object({ message: z.string().trim().min(1).max(4_000) }).strict();

function conversationId(value: string): string {
  const parsed = conversationIdSchema.safeParse(value);
  if (!parsed.success)
    throw new AppError(400, 'INVALID_CONVERSATION_ID', 'Invalid conversation id');
  return parsed.data;
}

export function createConversationsRouter(service: ConversationsService): Router {
  const router = Router();

  router.post('/api/conversations', async (_request, response) => {
    response.status(201).json({ data: await service.create() });
  });

  router.get('/api/conversations', async (_request, response) => {
    response.status(200).json({ data: await service.list() });
  });

  router.get('/api/conversations/:id', async (request, response) => {
    response.status(200).json({ data: await service.get(conversationId(request.params.id ?? '')) });
  });

  router.delete('/api/conversations/:id', async (request, response) => {
    await service.delete(conversationId(request.params.id ?? ''));
    response.status(204).send();
  });

  router.post('/api/conversations/:id/messages', async (request, response) => {
    const parsed = messageSchema.safeParse(request.body);
    if (!parsed.success)
      throw new AppError(400, 'INVALID_MESSAGE', 'Message must contain 1 to 4000 characters');
    response
      .status(201)
      .json(
        await service.sendMessage(conversationId(request.params.id ?? ''), parsed.data.message),
      );
  });

  return router;
}

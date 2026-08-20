import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

import { AppError } from '../errors/app-error.js';
import type { DocumentsService } from '../services/documents-service.js';

const documentIdSchema = z.uuid();

function parseDocumentId(value: string): string {
  const result = documentIdSchema.safeParse(value);
  if (!result.success) {
    throw new AppError(400, 'INVALID_DOCUMENT_ID', 'Invalid document id');
  }
  return result.data;
}

export function createDocumentsRouter(
  documentsService: DocumentsService,
  maxUploadBytes: number,
): Router {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { files: 1, fileSize: maxUploadBytes },
  });

  router.post('/api/documents', upload.single('file'), async (request, response) => {
    const document = await documentsService.upload(request.file);
    response.status(201).json({ data: document });
  });

  router.get('/api/documents', async (_request, response) => {
    response.status(200).json({ data: await documentsService.list() });
  });

  router.get('/api/documents/:id', async (request, response) => {
    const document = await documentsService.getById(parseDocumentId(request.params.id ?? ''));
    response.status(200).json({ data: document });
  });

  router.get('/api/documents/:id/chunks', async (request, response) => {
    const items = await documentsService.getChunks(parseDocumentId(request.params.id ?? ''));
    response.status(200).json({ items });
  });

  router.delete('/api/documents/:id', async (request, response) => {
    await documentsService.delete(parseDocumentId(request.params.id ?? ''));
    response.status(204).send();
  });

  return router;
}

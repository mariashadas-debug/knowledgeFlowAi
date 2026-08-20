import { createHash } from 'node:crypto';
import path from 'node:path';

import { AppError } from '../errors/app-error.js';
import { type DocumentRecord, DocumentsRepository } from '../repositories/documents-repository.js';
import type { DocumentStorage } from './document-storage.js';

const SUPPORTED_MIME_TYPES: Record<string, readonly string[]> = {
  '.pdf': ['application/pdf'],
  '.txt': ['text/plain'],
  '.md': ['text/markdown', 'text/x-markdown', 'text/plain', 'application/octet-stream'],
  '.markdown': ['text/markdown', 'text/x-markdown', 'text/plain', 'application/octet-stream'],
};

export interface UploadedDocument {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export type PublicDocument = Omit<DocumentRecord, 'storageKey'>;

function toPublicDocument(document: DocumentRecord): PublicDocument {
  const { storageKey, ...publicDocument } = document;
  void storageKey;
  return publicDocument;
}

function sanitizeOriginalName(originalName: string): string {
  const normalized = originalName.replaceAll('\\', '/');
  const baseName = [...path.posix.basename(normalized)]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .trim();
  return baseName.slice(0, 255);
}

function appearsToBeText(data: Buffer): boolean {
  if (data.includes(0)) {
    return false;
  }

  return !data.toString('utf8').includes('\uFFFD');
}

export class DocumentsService {
  constructor(
    private readonly repository: DocumentsRepository,
    private readonly storage: DocumentStorage,
  ) {}

  async upload(file: UploadedDocument | undefined): Promise<PublicDocument> {
    if (!file) {
      throw new AppError(400, 'FILE_REQUIRED', 'A document file is required');
    }

    if (file.size === 0) {
      throw new AppError(400, 'EMPTY_FILE', 'The uploaded file is empty');
    }

    const originalName = sanitizeOriginalName(file.originalname);
    const extension = path.extname(originalName).toLowerCase();
    const allowedMimeTypes = SUPPORTED_MIME_TYPES[extension];

    if (!originalName || !allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype)) {
      throw new AppError(
        415,
        'UNSUPPORTED_FILE_TYPE',
        'Only PDF, TXT, Markdown, and MARKDOWN files are supported',
      );
    }

    const validContent =
      extension === '.pdf'
        ? file.buffer.subarray(0, 5).toString('ascii') === '%PDF-'
        : appearsToBeText(file.buffer);

    if (!validContent) {
      throw new AppError(
        415,
        'UNSUPPORTED_FILE_TYPE',
        'The file content does not match a supported document type',
      );
    }

    let storageKey: string | undefined;

    try {
      storageKey = await this.storage.save(file.buffer, extension);
      const document = await this.repository.insert({
        name: originalName,
        originalName,
        mimeType: file.mimetype,
        size: file.size,
        storageKey,
        checksumSha256: createHash('sha256').update(file.buffer).digest('hex'),
      });
      return toPublicDocument(document);
    } catch (error) {
      if (storageKey) {
        await this.storage.delete(storageKey);
      }
      throw error;
    }
  }

  async list(): Promise<PublicDocument[]> {
    return (await this.repository.findAll()).map(toPublicDocument);
  }

  async getById(id: string): Promise<PublicDocument> {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    }
    return toPublicDocument(document);
  }

  async delete(id: string): Promise<void> {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    }

    if (document.storageKey) {
      await this.storage.delete(document.storageKey);
    }

    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    }
  }
}

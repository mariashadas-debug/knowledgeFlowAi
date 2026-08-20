import { AppError } from '../errors/app-error.js';
import { type DocumentRecord, DocumentsRepository } from '../repositories/documents-repository.js';
import type { DocumentStorage } from './document-storage.js';
import { DocumentTextExtractor } from './extraction/document-text-extractor.js';
import { TextChunker } from './text-chunker.js';
import { normalizeText } from './text-normalizer.js';

const SAFE_PROCESSING_MESSAGES = [
  'The PDF could not be read',
  'The document is not valid UTF-8 text',
  'The document contains binary data',
  'The Markdown document contains binary data',
] as const;

function safeProcessingMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (SAFE_PROCESSING_MESSAGES.some((safeMessage) => message === safeMessage)) return message;
  if (message === 'No extractable text was found') return message;
  return 'Document processing failed';
}

export class DocumentProcessor {
  constructor(
    private readonly repository: DocumentsRepository,
    private readonly storage: DocumentStorage,
    private readonly extractor: DocumentTextExtractor,
    private readonly chunker: TextChunker,
  ) {}

  async process(document: DocumentRecord): Promise<DocumentRecord> {
    try {
      if (!document.storageKey) throw new Error('Document has no stored file');
      const data = await this.storage.read(document.storageKey);
      const extracted = await this.extractor.extract(data, document.originalName);
      const sections = extracted.sections
        .map((section) => ({ ...section, text: normalizeText(section.text) }))
        .filter((section) => section.text.length > 0);
      const chunks = this.chunker.chunk(sections, document.originalName, extracted.format);
      if (chunks.length === 0) throw new Error('No extractable text was found');

      return await this.repository.replaceChunksAndMarkReady(document.id, chunks);
    } catch (error) {
      const technicalMessage = error instanceof Error ? error.message : 'Unknown processing error';
      console.error(`Document processing failed for ${document.id}: ${technicalMessage}`);
      const failed = await this.repository.markFailed(document.id, safeProcessingMessage(error));
      if (!failed) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
      return failed;
    }
  }
}

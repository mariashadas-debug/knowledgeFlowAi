import path from 'node:path';

import { MarkdownTextExtractor } from './markdown-text-extractor.js';
import { PdfTextExtractor } from './pdf-text-extractor.js';
import { PlainTextExtractor } from './plain-text-extractor.js';

export type SourceFormat = 'pdf' | 'txt' | 'markdown';

export interface ExtractedTextSection {
  text: string;
  pageNumber?: number;
}

export interface ExtractedDocumentText {
  format: SourceFormat;
  sections: ExtractedTextSection[];
}

export interface FormatTextExtractor {
  extract(data: Buffer): Promise<ExtractedTextSection[]>;
}

export class DocumentTextExtractor {
  private readonly plainText = new PlainTextExtractor();
  private readonly markdown = new MarkdownTextExtractor();
  private readonly pdf = new PdfTextExtractor();

  async extract(data: Buffer, originalName: string): Promise<ExtractedDocumentText> {
    const extension = path.extname(originalName).toLowerCase();

    if (extension === '.pdf') {
      return { format: 'pdf', sections: await this.pdf.extract(data) };
    }
    if (extension === '.md' || extension === '.markdown') {
      return { format: 'markdown', sections: await this.markdown.extract(data) };
    }
    if (extension === '.txt') {
      return { format: 'txt', sections: await this.plainText.extract(data) };
    }

    throw new Error('Unsupported document format');
  }
}

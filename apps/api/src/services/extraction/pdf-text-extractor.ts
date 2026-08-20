import { PDFParse } from 'pdf-parse';

import type { ExtractedTextSection, FormatTextExtractor } from './document-text-extractor.js';

export class PdfTextExtractor implements FormatTextExtractor {
  async extract(data: Buffer): Promise<ExtractedTextSection[]> {
    const parser = new PDFParse({ data: new Uint8Array(data), stopAtErrors: true });

    try {
      const result = await parser.getText();
      return result.pages.map((page) => ({ text: page.text, pageNumber: page.num }));
    } catch {
      throw new Error('The PDF could not be read');
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }
}

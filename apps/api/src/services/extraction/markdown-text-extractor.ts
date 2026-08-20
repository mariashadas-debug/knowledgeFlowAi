import type { ExtractedTextSection, FormatTextExtractor } from './document-text-extractor.js';
import { decodeUtf8 } from './plain-text-extractor.js';

export class MarkdownTextExtractor implements FormatTextExtractor {
  async extract(data: Buffer): Promise<ExtractedTextSection[]> {
    const text = decodeUtf8(data);
    if (text.includes('\u0000')) {
      throw new Error('The Markdown document contains binary data');
    }

    // Markdown is intentionally retained: headings, lists, and fenced code are useful retrieval context.
    return [{ text }];
  }
}

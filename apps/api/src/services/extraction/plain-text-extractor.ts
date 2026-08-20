import type { ExtractedTextSection, FormatTextExtractor } from './document-text-extractor.js';

export function decodeUtf8(data: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(data);
  } catch {
    throw new Error('The document is not valid UTF-8 text');
  }
}

export class PlainTextExtractor implements FormatTextExtractor {
  async extract(data: Buffer): Promise<ExtractedTextSection[]> {
    const text = decodeUtf8(data);
    if (text.includes('\u0000')) {
      throw new Error('The document contains binary data');
    }
    return [{ text }];
  }
}

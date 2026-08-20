import type { ExtractedTextSection, SourceFormat } from './extraction/document-text-extractor.js';

export interface ChunkMetadata {
  documentName: string;
  chunkIndex: number;
  sourceFormat: SourceFormat;
  pageNumber?: number;
  heading?: string;
}

export interface TextChunk {
  content: string;
  metadata: ChunkMetadata;
}

export interface EmbeddedTextChunk extends TextChunk {
  embedding: number[];
}

interface Boundary {
  index: number;
  length: number;
}

function lastBoundary(text: string, pattern: RegExp, minimum: number): Boundary | null {
  let selected: Boundary | null = null;
  for (const match of text.matchAll(pattern)) {
    const index = match.index + match[0].length;
    if (index >= minimum) selected = { index, length: match[0].length };
  }
  return selected;
}

function chooseEnd(text: string, start: number, size: number): number {
  const hardEnd = Math.min(start + size, text.length);
  if (hardEnd === text.length) return hardEnd;

  const window = text.slice(start, hardEnd);
  const minimum = Math.floor(size * 0.55);
  const boundaries = [
    lastBoundary(window, /\n(?=#{1,6}\s)/g, minimum),
    lastBoundary(window, /\n\n+/g, minimum),
    lastBoundary(window, /[.!?]["')\]]?\s+/g, minimum),
    lastBoundary(window, /\s+/g, minimum),
  ];
  return start + (boundaries.find(Boolean)?.index ?? window.length);
}

function headingAt(text: string, position: number): string | undefined {
  const prefix = text.slice(0, position);
  const matches = [...prefix.matchAll(/^#{1,6}\s+(.+)$/gm)];
  return matches.at(-1)?.[1]?.trim();
}

export class TextChunker {
  constructor(
    private readonly size: number,
    private readonly overlap: number,
  ) {}

  chunk(
    sections: ExtractedTextSection[],
    documentName: string,
    sourceFormat: SourceFormat,
  ): TextChunk[] {
    const chunks: TextChunk[] = [];

    for (const section of sections) {
      const text = section.text.trim();
      let start = 0;

      while (start < text.length) {
        const end = chooseEnd(text, start, this.size);
        const content = text.slice(start, end).trim();
        if (content) {
          const metadata: ChunkMetadata = {
            documentName,
            chunkIndex: chunks.length,
            sourceFormat,
          };
          if (section.pageNumber !== undefined) metadata.pageNumber = section.pageNumber;
          const heading = sourceFormat === 'markdown' ? headingAt(text, end) : undefined;
          if (heading) metadata.heading = heading;
          chunks.push({ content, metadata });
        }

        if (end >= text.length) break;
        const nextStart = Math.max(start + 1, end - this.overlap);
        const whitespace = text.slice(nextStart, Math.min(nextStart + 40, end)).search(/\s/);
        start = whitespace >= 0 ? nextStart + whitespace + 1 : nextStart;
      }
    }

    return chunks;
  }
}

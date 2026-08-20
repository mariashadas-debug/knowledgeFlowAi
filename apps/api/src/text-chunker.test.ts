import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { TextChunker } from './services/text-chunker.js';

describe('TextChunker', () => {
  it('prefers paragraph and sentence boundaries for multi-paragraph content', () => {
    const text = [
      '# First section',
      'The first paragraph contains several useful sentences. It provides retrieval context.',
      'The second paragraph continues with additional details. It should form another chunk.',
    ].join('\n\n');
    const chunks = new TextChunker(100, 20).chunk([{ text }], 'guide.md', 'markdown');

    assert.ok(chunks.length >= 2);
    assert.equal(chunks[0]?.metadata.chunkIndex, 0);
    assert.equal(chunks[0]?.metadata.documentName, 'guide.md');
    assert.equal(chunks[0]?.metadata.heading, 'First section');
    assert.ok(chunks.every((chunk) => chunk.content.length <= 100));
  });

  it('carries trailing context into the next chunk', () => {
    const text = Array.from({ length: 35 }, (_, index) => `word${index}`).join(' ');
    const chunks = new TextChunker(90, 24).chunk([{ text }], 'notes.txt', 'txt');

    assert.ok(chunks.length >= 2);
    const firstWords = new Set(chunks[0]!.content.split(/\s+/));
    const secondWords = chunks[1]!.content.split(/\s+/);
    assert.ok(secondWords.some((word) => firstWords.has(word)));
  });
});

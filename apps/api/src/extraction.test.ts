import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { DocumentTextExtractor } from './services/extraction/document-text-extractor.js';

const extractor = new DocumentTextExtractor();

async function fixture(name: string): Promise<Buffer> {
  return readFile(new URL(`./test/fixtures/${name}`, import.meta.url));
}

describe('DocumentTextExtractor', () => {
  it('extracts UTF-8 plain text', async () => {
    const result = await extractor.extract(await fixture('sample.txt'), 'sample.txt');
    assert.equal(result.format, 'txt');
    assert.match(result.sections[0]?.text ?? '', /plain text fixture/);
  });

  it('preserves useful Markdown structure', async () => {
    const result = await extractor.extract(await fixture('sample.md'), 'sample.md');
    const text = result.sections[0]?.text ?? '';
    assert.equal(result.format, 'markdown');
    assert.match(text, /# Knowledge operations/);
    assert.match(text, /```ts/);
    assert.match(text, /const status = 'ready';/);
  });

  it('extracts page-aware PDF text', async () => {
    const result = await extractor.extract(await fixture('sample.pdf'), 'sample.pdf');
    assert.equal(result.format, 'pdf');
    assert.equal(result.sections[0]?.pageNumber, 1);
    assert.match(result.sections[0]?.text ?? '', /KnowledgeFlow PDF fixture text/);
  });
});

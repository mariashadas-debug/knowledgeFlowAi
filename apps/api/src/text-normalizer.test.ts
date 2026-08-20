import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeText } from './services/text-normalizer.js';

describe('normalizeText', () => {
  it('normalizes prose whitespace while preserving paragraphs and fenced code', () => {
    const input =
      'Heading\r\n\r\n\r\nWords   stay\treadable.\r\n\r\n```ts\r\n  const x  =  1;\r\n```';
    assert.equal(
      normalizeText(input),
      'Heading\n\nWords stay readable.\n\n```ts\n  const x  =  1;\n```',
    );
  });
});

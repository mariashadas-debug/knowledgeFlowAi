import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import request from 'supertest';

import { app } from './app.js';

describe('GET /health', () => {
  it('returns the API health status', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      status: 'ok',
      service: 'knowledgeflow-api',
    });
  });
});

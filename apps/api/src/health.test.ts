import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import request from 'supertest';

import { createApp } from './app.js';

describe('GET /health', () => {
  it('returns the API health status', async () => {
    const app = createApp({ checkHealth: async () => true });
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      status: 'ok',
      service: 'knowledgeflow-api',
      database: 'ok',
    });
  });

  it('returns 503 without exposing database errors', async () => {
    const app = createApp({
      checkHealth: async () => {
        throw new Error('connection refused');
      },
    });
    const response = await request(app).get('/health');

    assert.equal(response.status, 503);
    assert.deepEqual(response.body, {
      status: 'error',
      service: 'knowledgeflow-api',
      database: 'unavailable',
    });
  });
});

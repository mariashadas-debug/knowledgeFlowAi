import {
  forwardApiResponse,
  getApiUrl,
  unavailableApiResponse,
} from '../../../lib/server/api-proxy';

async function forward(method: 'GET' | 'POST') {
  const url = getApiUrl('/api/conversations');
  if (!url) return unavailableApiResponse();
  try {
    return forwardApiResponse(await fetch(url, { method, cache: 'no-store' }));
  } catch {
    return unavailableApiResponse();
  }
}

export function GET() {
  return forward('GET');
}
export function POST() {
  return forward('POST');
}

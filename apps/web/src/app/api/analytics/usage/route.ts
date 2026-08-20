import {
  forwardApiResponse,
  getApiUrl,
  unavailableApiResponse,
} from '../../../../lib/server/api-proxy';

export async function GET() {
  const url = getApiUrl('/api/analytics/usage');
  if (!url) return unavailableApiResponse();
  try {
    return forwardApiResponse(await fetch(url, { cache: 'no-store' }));
  } catch {
    return unavailableApiResponse();
  }
}

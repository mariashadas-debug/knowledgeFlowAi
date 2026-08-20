import {
  forwardApiResponse,
  getApiUrl,
  unavailableApiResponse,
} from '../../../lib/server/api-proxy';

export async function GET() {
  const url = getApiUrl('/api/documents');
  if (!url) return unavailableApiResponse();

  try {
    return forwardApiResponse(await fetch(url, { cache: 'no-store' }));
  } catch {
    return unavailableApiResponse();
  }
}

export async function POST(request: Request) {
  const url = getApiUrl('/api/documents');
  if (!url) return unavailableApiResponse();

  try {
    const formData = await request.formData();
    return forwardApiResponse(
      await fetch(url, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30_000),
      }),
    );
  } catch {
    return unavailableApiResponse();
  }
}

import {
  forwardApiResponse,
  getApiUrl,
  unavailableApiResponse,
} from '../../../../../lib/server/api-proxy';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const url = getApiUrl(`/api/conversations/${encodeURIComponent(id)}/messages`);
  if (!url) return unavailableApiResponse();
  try {
    return forwardApiResponse(
      await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: await request.text(),
        signal: AbortSignal.timeout(60_000),
      }),
    );
  } catch {
    return unavailableApiResponse();
  }
}

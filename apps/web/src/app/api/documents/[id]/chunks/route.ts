import {
  forwardApiResponse,
  getApiUrl,
  unavailableApiResponse,
} from '../../../../../lib/server/api-proxy';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const url = getApiUrl(`/api/documents/${encodeURIComponent(id)}/chunks`);
  if (!url) return unavailableApiResponse();

  try {
    return forwardApiResponse(await fetch(url, { cache: 'no-store' }));
  } catch {
    return unavailableApiResponse();
  }
}

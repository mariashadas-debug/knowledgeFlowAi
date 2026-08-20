import {
  forwardApiResponse,
  getApiUrl,
  unavailableApiResponse,
} from '../../../../lib/server/api-proxy';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function documentUrl(context: RouteContext): Promise<URL | null> {
  const { id } = await context.params;
  return getApiUrl(`/api/documents/${encodeURIComponent(id)}`);
}

export async function GET(_request: Request, context: RouteContext) {
  const url = await documentUrl(context);
  if (!url) return unavailableApiResponse();

  try {
    return forwardApiResponse(await fetch(url, { cache: 'no-store' }));
  } catch {
    return unavailableApiResponse();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const url = await documentUrl(context);
  if (!url) return unavailableApiResponse();

  try {
    return forwardApiResponse(await fetch(url, { method: 'DELETE' }));
  } catch {
    return unavailableApiResponse();
  }
}

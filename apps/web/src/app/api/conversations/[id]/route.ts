import {
  forwardApiResponse,
  getApiUrl,
  unavailableApiResponse,
} from '../../../../lib/server/api-proxy';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function url(context: RouteContext) {
  const { id } = await context.params;
  return getApiUrl(`/api/conversations/${encodeURIComponent(id)}`);
}

async function forward(context: RouteContext, method: 'GET' | 'DELETE') {
  const target = await url(context);
  if (!target) return unavailableApiResponse();
  try {
    return forwardApiResponse(await fetch(target, { method, cache: 'no-store' }));
  } catch {
    return unavailableApiResponse();
  }
}

export function GET(_request: Request, context: RouteContext) {
  return forward(context, 'GET');
}
export function DELETE(_request: Request, context: RouteContext) {
  return forward(context, 'DELETE');
}

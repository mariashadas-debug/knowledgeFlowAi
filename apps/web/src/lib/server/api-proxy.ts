import { NextResponse } from 'next/server';

export function getApiUrl(pathname: string): URL | null {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) {
    return null;
  }

  try {
    return new URL(pathname, apiBaseUrl);
  } catch {
    return null;
  }
}

export async function forwardApiResponse(response: Response): Promise<NextResponse> {
  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const body: unknown = await response.json();
  return NextResponse.json(body, { status: response.status });
}

export function unavailableApiResponse(): NextResponse {
  return NextResponse.json(
    { error: { code: 'API_UNAVAILABLE', message: 'The API is unavailable' } },
    { status: 503 },
  );
}

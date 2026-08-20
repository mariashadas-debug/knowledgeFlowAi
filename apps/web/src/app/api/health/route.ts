import { NextResponse } from 'next/server';

export async function GET() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'API URL is not configured' }, { status: 503 });
  }

  try {
    const response = await fetch(new URL('/health', apiBaseUrl), {
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
    });
    const body: unknown = await response.json();

    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'API is unavailable' }, { status: 503 });
  }
}

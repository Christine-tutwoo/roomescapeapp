import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const url = new URL(request.url);

  // Backward-compat for old share links that used `/?eventId=...`
  if (url.pathname === '/') {
    const sp = url.searchParams;
    const hasShareParam =
      sp.has('eventId') || sp.has('wishId') || sp.has('host') || sp.has('tab') || sp.has('edit');
    if (hasShareParam) {
      const next = new URL(url.toString());
      next.pathname = '/lobby';
      return NextResponse.redirect(next);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};



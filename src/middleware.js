import { NextResponse } from 'next/server';

const COOKIE = 'storenet_token';

/** Cheap gate: no cookie, no dashboard. Real permission checks live in the API routes. */
export function middleware(req) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };

import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { sha256Hex, SITE_GATE_COOKIE, isGateExemptPath } from '@/lib/site-gate';

// Refreshes the Supabase auth session cookie on every request.
export async function middleware(request: NextRequest) {
  // Site-wide password gate — set SITE_GATE_PASSWORD to require a password
  // for every page (including /admin); unset it to open the site up, no
  // code changes needed either way.
  const gatePassword = process.env.SITE_GATE_PASSWORD;
  if (gatePassword && !isGateExemptPath(request.nextUrl.pathname)) {
    const expected = await sha256Hex(gatePassword);
    if (request.cookies.get(SITE_GATE_COOKIE)?.value !== expected) {
      const url = request.nextUrl.clone();
      url.pathname = '/gate';
      url.search = '';
      url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  await supabase.auth.getUser();

  // Affiliate referral attribution: last-click wins, 30-day window.
  const ref = request.nextUrl.searchParams.get('ref');
  if (ref) {
    response.cookies.set('pct_ref', ref, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|slots|brand|img|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)'],
};

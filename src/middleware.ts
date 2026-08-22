import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and API endpoints are public
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if live Supabase auth cookies are required and present
  const hasSupabaseEnv = 
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http') &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'string' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 10;

  if (hasSupabaseEnv) {
    const authCookie = request.cookies.get('sb-access-token') || request.cookies.get('supabase-auth-token');
    const isAuthRoute = pathname === '/login' || pathname === '/register';

    if (!authCookie && !isAuthRoute) {
      // In production mode with live Supabase, redirect unauthenticated visitors to /login
      // (Unless bypassing for preview)
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

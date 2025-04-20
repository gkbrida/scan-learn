import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { pathname, searchParams } = req.nextUrl;
  const code = searchParams.get('code');

  // Gérer le code de réinitialisation du mot de passe
  if (code && pathname === '/') {
    const redirectUrl = new URL('/auth/reset-password', req.url);
    redirectUrl.searchParams.set('code', code);
    return NextResponse.redirect(redirectUrl);
  }

  await supabase.auth.getSession();
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 
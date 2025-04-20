import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        throw error;
      }

      // Rediriger vers la page demandée
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (error) {
      console.error('Erreur lors de l\'échange du code:', error);
      return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
    }
  }

  // Si pas de code, rediriger vers la page de connexion
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
} 
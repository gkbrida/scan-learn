import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      
      // Échanger le code contre une session
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Erreur lors de l\'échange du code:', error);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      // Vérifier que la session est bien créée
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('Session non créée après échange du code');
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }

    // Redirection vers le dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
    
  } catch (error) {
    console.error('Erreur dans la route de callback:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
} 
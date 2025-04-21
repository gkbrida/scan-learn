import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/'
];

// Fonction utilitaire pour créer une URL absolue
const createUrl = (path: string, req: NextRequest): URL => {
  try {
    // Si une URL complète est fournie, l'utiliser directement
    if (path.startsWith('http')) {
      return new URL(path);
    }

    // Construire l'URL de base
    let baseURL: string;

    // Essayer d'abord avec NEXT_PUBLIC_SITE_URL
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      baseURL = process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      // Sinon, construire à partir de la requête
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http:' : 'https:';
      baseURL = `${protocol}//${host}`;
    }
    console.log('baseURL ok', baseURL);

    // S'assurer que baseURL se termine par un slash si nécessaire
    if (!baseURL.endsWith('/')) {
      baseURL += '/';
    }

    // S'assurer que le chemin ne commence pas par un slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    console.log('cleanPath ok', cleanPath);
    console.log('baseURL + cleanPath ok', baseURL + cleanPath);
    console.log('new URL ok', new URL(cleanPath, baseURL));
    // Construire et retourner l'URL complète
    return new URL(cleanPath, baseURL);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'URL:', error);
    // Fallback sur une URL locale simple
    return new URL(`http://localhost:3000${path}`);
  }
};

// Fonction utilitaire pour nettoyer les cookies
const cleanCookies = (request: NextRequest): void => {
  const cookiesToClean = ['supabase-auth-token', 'sb-bjalqwsorjebmgwdxuji-auth-token'];
  cookiesToClean.forEach(cookieName => {
    const cookie = request.cookies.get(cookieName);
    if (cookie?.value.startsWith('base64-')) {
      const cleanValue = cookie.value.replace('base64-', '');
      request.cookies.set(cookieName, cleanValue);
    }
  });
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Créer le client Supabase
  const supabase = createMiddlewareClient({ req, res });

  // Vérifier si le chemin actuel est une route publique
  if (publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    return res;
  }

  try {
    // Récupérer la session
    const { data: { session } } = await supabase.auth.getSession();

    // Si pas de session et route protégée, rediriger vers login
    if (!session) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (error) {
    console.error('Erreur middleware:', error);
    // En cas d'erreur, rediriger vers login
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
}

// Protéger toutes les routes sauf les assets statiques
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public/).*)'
  ]
};
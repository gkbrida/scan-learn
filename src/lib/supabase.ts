import { createBrowserClient } from '@supabase/ssr';

const decodeBase64Value = (value: string) => {
  if (!value.startsWith('base64-')) return value;
  
  try {
    const base64Data = value.replace(/^base64-/, '');
    const decoded = typeof window !== 'undefined' 
      ? window.atob(base64Data)
      : Buffer.from(base64Data, 'base64').toString('utf-8');
    return decoded;
  } catch (error) {
    console.error('❌ Erreur de décodage base64:', error);
    return value;
  }
};

const customCookieOptions = {
  cookies: {
    get(name: string) {
      if (typeof window === 'undefined') return null;
      
      const cookie = document.cookie
        .split(';')
        .find((c) => c.trim().startsWith(`${name}=`));
      
      if (!cookie) return null;
      
      const value = cookie.split('=')[1];
      if (!value) return null;

      // Décoder la valeur si elle est en base64
      return decodeBase64Value(value);
    },
    set(name: string, value: string, options: { path?: string; domain?: string; maxAge?: number; httpOnly?: boolean }) {
      if (typeof window === 'undefined') return;
      document.cookie = `${name}=${value}; path=${options.path || '/'}; max-age=${options.maxAge || 31536000}`;
    },
    remove(name: string, options: { path?: string }) {
      if (typeof window === 'undefined') return;
      document.cookie = `${name}=; path=${options.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }
};

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
};

export const clearSupabaseData = () => {
  if (typeof window === 'undefined') return;
  
  // Supprimer les cookies liés à Supabase
  document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  
  // Nettoyer le localStorage
  localStorage.removeItem('supabase.auth.token');
  localStorage.removeItem('sb-access-token');
  localStorage.removeItem('sb-refresh-token');
  
  // Forcer un rechargement de la page
  window.location.reload();
}; 
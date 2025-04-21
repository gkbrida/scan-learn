import { useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    try {
      // Déconnexion de Supabase
      await supabase.auth.signOut();
      
      // Nettoyage des cookies d'authentification
      document.cookie = 'supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'sb-bjalqwsorjebmgwdxuji-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      
      // Nettoyage du localStorage
      localStorage.clear();
      
      // Redirection vers la page de login
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
    }
  }, [supabase, router]);

  return {
    signOut: handleSignOut,
    // Vous pouvez ajouter d'autres fonctions d'authentification ici
  };
}; 
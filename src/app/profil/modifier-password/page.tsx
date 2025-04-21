'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        const cookie = document.cookie
          .split(';')
          .find((c) => c.trim().startsWith(`${name}=`));
        if (!cookie) return null;
        const value = cookie.split('=')[1];
        return decodeURIComponent(value);
      },
      set(name: string, value: string, options: { path?: string; domain?: string; maxAge?: number; httpOnly?: boolean }) {
        document.cookie = `${name}=${encodeURIComponent(value)}; path=${options.path || '/'}; max-age=${options.maxAge || 31536000}`;
      },
      remove(name: string, options: { path?: string }) {
        document.cookie = `${name}=; path=${options.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }
  }
);

export default function ModifierPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      // Validation des mots de passe
      if (newPassword !== confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }

      if (newPassword.length < 6) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        if (error.message.includes('should be different from the old password')) {
          toast.error('Le nouveau mot de passe doit être différent de l\'ancien');
        } else {
          toast.error('Une erreur est survenue lors de la mise à jour du mot de passe');
          console.error('❌ Erreur lors de la mise à jour du mot de passe:', error);
        }
        return;
      }

      // Forcer une nouvelle session après la mise à jour du mot de passe
      await supabase.auth.refreshSession();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        await supabase.auth.signOut();
        toast.error('Session expirée. Veuillez vous reconnecter.');
        router.push('/auth/login');
        return;
      }

      toast.success('Mot de passe mis à jour avec succès');
      router.push('/dashboard');
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F0FF]">
      <div className="max-w-2xl mx-auto">
        {/* Header avec bouton retour et titre */}
        <div className="px-4 pt-12 pb-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold mt-4">
            Changer de mot de passe
          </h1>
        </div>

        {/* Formulaire */}
        <div className="px-4 space-y-6">
          <div className="space-y-2">
            <div className="text-[17px] font-medium">Nouveau mot de passe</div>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white border border-gray-200 text-[17px]"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showNewPassword ? (
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />
                  ) : (
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[17px] font-medium">Confirmation du nouveau mot de passe</div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white border border-gray-200 text-[17px]"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showConfirmPassword ? (
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />
                  ) : (
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bouton Valider */}
        <div className="absolute bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl md:px-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-black text-white rounded-full py-4 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Mise à jour..." : "Valider"}
          </button>
        </div>
      </div>
    </div>
  );
} 
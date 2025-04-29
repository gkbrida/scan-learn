'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LoginButton() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialiser le client Supabase une seule fois
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('error', error);
      console.log('data', data);

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setNotification({
            message: 'Email ou mot de passe incorrect',
            type: 'error'
          });
          toast.error('Email ou mot de passe incorrect');
        } else if (error.message.includes('Email not confirmed') || error.message === 'Email not confirmed') {
          setNotification({
            message: 'Veuillez confirmer votre email avant de vous connecter, un mail vous a été envoyé',
            type: 'error'
          });
          toast.error('Veuillez confirmer votre email avant de vous connecter');
        } else {
          setNotification({
            message: 'Une erreur est survenue lors de la connexion',
            type: 'error'
          });
          toast.error('Une erreur est survenue lors de la connexion');
        }
        console.log('❌ Détails de l\'erreur:', error.message);
        return;
      }

      toast.success('Connexion réussie !');
      
      // Attendre que le token soit bien stocké avant la redirection
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Rediriger vers la bonne page
      const redirectPath = searchParams?.get('redirectTo');
      if (redirectPath && redirectPath.startsWith('/')) {
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error('Une erreur inattendue est survenue');
      console.log('❌ Erreur inattendue:', error);
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="w-full space-y-8">
      {notification && (
        <div className={`p-4 rounded-lg ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          <p className="text-white">{notification.message}</p>
        </div>
      )}
      <form onSubmit={handleEmailLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-2">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Entre ton e-mail"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Entre ton mot de passe"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-base text-gray-500 hover:text-gray-700"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gray-200 text-black rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Connexion en cours..." : "Connexion"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Ou se connecter avec</span>
        </div>
      </div>

      

      <div className="text-center">
        <p className="text-base text-gray-500">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="font-medium text-gray-700 hover:text-gray-900">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
} 
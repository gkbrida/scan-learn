'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import Notification from '@/components/Notification';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setNotification({
        message: 'L\'email et le mot de passe sont obligatoires',
        type: 'error'
      });
      return;
    }

    if (!validateEmail(email)) {
      setNotification({
        message: 'Format d\'email invalide',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

 try {
  const { count, error } = await supabase
    .from('info_users') // ou 'users' selon ta table
    .select('*', { count: 'exact', head: true })
    .eq('email', email )

   
  if (error && error.code !== 'PGRST116') { // erreur autre que "no rows returned"
    throw error;
  }


  if (count && count > 0) {
    setNotification({
      message: 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.',
      type: 'info'
    });
    setLoading(false);
    // Rediriger vers la page de connexion après 10 secondes
    setTimeout(() => {
      router.push('/auth/login');
    }, 10000);
    return;
  }
  } catch (error) {
    if (error instanceof Error && error.message.includes('PGRST116')) {
      setNotification({
        message: 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.',
        type: 'info'
      });
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.push('/auth/login');
      }, 10000);
      return;
    }

    console.error('Erreur lors de la vérification de l\'existence de l\'utilisateur:', error);
    setNotification({
      message: 'Une erreur est survenue lors de la vérification de l\'existence de l\'utilisateur',
      type: 'error'
    });
  }

    try {
    
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/auth/login`,
        },
      });
      
      

      if (error) throw error;

      // Enregistrer les informations dans la table info_users
      if (data.user) {
        const { error: infoError } = await supabase
          .from('info_users')
          .insert([
            {
              user_id: data.user.id,
              prenom: firstName,
              niveau_etude: educationLevel,
              email: email
            }
          ]);

        if (infoError) throw infoError;
      }

      setNotification({
        message: 'Compte créé avec succès ! Veuillez vérifier votre email pour confirmer votre inscription.',
        type: 'success'
      });
      
      // Rediriger vers la page de vérification après 3 secondes
      setTimeout(() => {
        router.push('/auth/verify-email');
      }, 3000);

    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      
      // Double vérification si l'erreur indique que l'utilisateur existe déjà
      if (error.message?.includes('User already registered')) {
        setNotification({
          message: 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.',
          type: 'info'
        });
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setNotification({
          message: 'Une erreur est survenue lors de l\'inscription',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white p-4">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <button 
        onClick={() => window.history.back()}
        className="mb-8 rounded-full p-4 hover:bg-gray-100"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold mb-12">
          Crée ton compte
        </h1>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label htmlFor="firstName" className="block text-base font-medium text-gray-700 mb-2">
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Entre ton prénom"
              required
            />
          </div>

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

          <div>
            <label htmlFor="educationLevel" className="block text-base font-medium text-gray-700 mb-2">
              Niveau d'étude
            </label>
            <select
              id="educationLevel"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Sélectionne ton niveau</option>
              <option value="Collégien(ne)">Collégien(ne)</option>
              <option value="Lycéen(ne)">Lycéen(ne)</option>
              <option value="Étudiant(e)">Étudiant(e)</option>
              <option value="Doctorant(e)">Doctorant(e)</option>
            </select>
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gray-200 text-black rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Inscription en cours..." : "S'inscrire"}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou s'inscrire avec</span>
            </div>
          </div>

          
        </div>

        <div className="text-center mt-8">
          <p className="text-base text-gray-500">
            Déjà un compte ?{' '}
            <a href="/auth/login" className="font-medium text-gray-700 hover:text-gray-900">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 
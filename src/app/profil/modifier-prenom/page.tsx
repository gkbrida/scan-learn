'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ModifierPrenomPage() {
  const router = useRouter();
  const [prenom, setPrenom] = useState('');

  useEffect(() => {
    const fetchPrenom = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('info_users')
        .select('prenom')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setPrenom(data.prenom || '');
      }
    };

    fetchPrenom();
  }, [router]);

  const handleSubmit = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/auth/login');
        return;
      }

      const { error } = await supabase
        .from('info_users')
        .update({ prenom })
        .eq('user_id', user.id);

      if (error) throw error;

      router.push('/profil');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prénom:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F0FF]">
      <div className="max-w-2xl mx-auto">
        {/* Header avec bouton retour et titre */}
        <div className="px-4 pt-12 pb-6">
          <button 
            onClick={() => router.back()}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold mt-4">
            Changer le prénom
          </h1>
        </div>

        {/* Formulaire */}
        <div className="px-4">
          <div className="mb-6">
            <label htmlFor="prenom" className="block text-base mb-2">
              Prénom
            </label>
            <input
              id="prenom"
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              className="w-full p-4 rounded-3xl bg-white border border-gray-200 text-lg"
              placeholder="Entre ton prénom"
            />
          </div>
        </div>

        {/* Bouton Enregistrer */}
        <div className="absolute bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl md:px-4">
          <button
            onClick={handleSubmit}
            className="w-full bg-black text-white rounded-full py-4 text-lg font-medium"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
} 
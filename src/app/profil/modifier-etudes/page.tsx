'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NIVEAUX_ETUDES = [
  'Collégien',
  'Lycéen',
  'Étudiant',
  'Autre'
];

export default function ModifierEtudesPage() {
  const router = useRouter();
  const [niveauEtude, setNiveauEtude] = useState('');

  useEffect(() => {
    const fetchNiveauEtude = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('info_users')
        .select('niveau_etude')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setNiveauEtude(data.niveau_etude || '');
      }
    };

    fetchNiveauEtude();
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
        .update({ niveau_etude: niveauEtude })
        .eq('user_id', user.id);

      if (error) throw error;

      router.push('/profil');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du niveau d\'études:', error);
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
            Changer les études
          </h1>
        </div>

        {/* Options */}
        <div className="px-4 space-y-4">
          {NIVEAUX_ETUDES.map((niveau) => (
            <button
              key={niveau}
              onClick={() => setNiveauEtude(niveau)}
              className={`w-full p-4 rounded-3xl text-left text-lg ${
                niveauEtude === niveau 
                  ? 'bg-white border-2 border-black' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              {niveau}
            </button>
          ))}
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
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CURSUS_OPTIONS = [
  'Lycée Général',
  'Lycée Technologique',
  'Lycée Professionnel'
];

export default function ModifierCursusPage() {
  const router = useRouter();
  const [cursus, setCursus] = useState('');

  useEffect(() => {
    const fetchCursus = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('info_users')
        .select('cursus')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setCursus(data.cursus || '');
      }
    };

    fetchCursus();
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
        .update({ cursus })
        .eq('user_id', user.id);

      if (error) throw error;

      router.push('/profil');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du cursus:', error);
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
            Changer le cursus
          </h1>
        </div>

        {/* Options */}
        <div className="px-4 space-y-4">
          {CURSUS_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setCursus(option)}
              className={`w-full p-4 rounded-3xl text-left text-lg ${
                cursus === option 
                  ? 'bg-white border-2 border-black' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              {option}
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
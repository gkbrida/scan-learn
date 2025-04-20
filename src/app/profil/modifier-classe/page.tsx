'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CLASSES_PAR_NIVEAU = {
  'Collégien': ['6ème', '5ème', '4ème', '3ème'] as string[],
  'Lycéen': ['Seconde', 'Première', 'Terminale'] as string[],
  'Étudiant': ['DEUG/BTS/DUT/DEUST', 'Licence/Licence Pro', 'Master', 'Doctorat'] as string[],
  'Autre': [] as string[]
};

export default function ModifierClassePage() {
  const router = useRouter();
  const [classe, setClasse] = useState('');
  const [niveauEtude, setNiveauEtude] = useState<keyof typeof CLASSES_PAR_NIVEAU>('Autre');
  const [optionsClasse, setOptionsClasse] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('info_users')
        .select('classe_actuelle, niveau_etude')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setClasse(data.classe_actuelle || '');
        const niveau = data.niveau_etude as keyof typeof CLASSES_PAR_NIVEAU;
        setNiveauEtude(niveau);
        setOptionsClasse(CLASSES_PAR_NIVEAU[niveau] || []);
      }
    };

    fetchUserData();
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
        .update({ classe_actuelle: classe })
        .eq('user_id', user.id);

      if (error) throw error;

      router.push('/profil');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la classe:', error);
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
            Changer la classe
          </h1>
        </div>

        {/* Options */}
        <div className="px-4 space-y-4">
          {optionsClasse.map((option) => (
            <button
              key={option}
              onClick={() => setClasse(option)}
              className={`w-full p-4 rounded-3xl text-left text-lg ${
                classe === option 
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
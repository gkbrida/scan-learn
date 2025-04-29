'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LanguageSelector from '@/app/components/LanguageSelector';
import SizeSelector from '@/app/components/SizeSelector';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GenerateWithAIPage() {
  const router = useRouter();
  const params = useParams();
  const [theme, setTheme] = useState('');
  const [language, setLanguage] = useState('fr');
  const [size, setSize] = useState('moyenne');
  const [formule, setFormule] = useState('');
  const [niveauEtude, setNiveauEtude] = useState('');
  const [classeActuelle, setClasseActuelle] = useState('');
  const [matiereId, setMatiereId] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('info_users')
        .select('niveau_etude, classe_actuelle')
        .eq('user_id', user.id)
        .single();
      if (!error && data) {
        setNiveauEtude(data.niveau_etude || '');
        setClasseActuelle(data.classe_actuelle || '');
      }
    };
    fetchUserInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Récupérer l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      console.log(user);
      if (!user) return;
      // Récupérer le nombre de fiches avant
      const { count: fichesAvant } = await supabase
        .from('fiches')
        .select('*', { count: 'exact', head: true })
        .eq('matiere_id', params?.id as string);
      console.log(fichesAvant);
      const matiereId = params?.id as string;
      console.log(matiereId);
      // Envoi au webhook
      await fetch('https://n8n-tb3a.onrender.com/webhook/abc37463-6c25-4a83-9f1a-3c316602fd61', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapitre: theme,
          matiere_id: matiereId,
          langue: language,
          taille: size,
          niveau_etude: niveauEtude,
          classe_actuelle: classeActuelle,
          description: formule
        })
      });
      console.log("Fiche envoyée");

      // Boucle de polling pour vérifier l'ajout de la fiche
      let ficheCree = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(res => setTimeout(res, 10000));
        const { count: fichesApres } = await supabase
          .from('fiches')
          .select('*', { count: 'exact', head: true })
          .eq('matiere_id', params?.id as string);
        if (typeof fichesAvant === 'number' && typeof fichesApres === 'number' && fichesApres > fichesAvant) {
          ficheCree = true;
          break;
        }
      }
      if (ficheCree && params?.id) {
        router.push(`/matieres/${params?.id as string}/ia`);
      } else {
        alert("La création de la fiche a échoué ou prend plus de temps que prévu. Merci de réessayer plus tard 1.");
      }
    } catch (error) {
      alert("La création de la fiche a échoué ou prend plus de temps que prévu. Merci de réessayer plus tard 2.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-[640px] flex flex-col">
        {/* Header avec bouton retour et titre */}
        <div className="px-4 pt-4">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <h1 className="text-[28px] font-semibold text-center mt-2">
            Générer avec l'IA
          </h1>
        </div>

        {/* Message d'introduction */}
        <div className="px-4 mt-6">
          <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <p className="text-[17px] leading-tight">
              Indique les informations pour que je génère ta fiche !
              <br />
              Sois précis dans ta demande
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div className="flex-1 px-4 mt-8">
            <div className="space-y-6">
              {/* Thème/Chapitre */}
              <div className="space-y-4">
                <label className="block text-[17px]">
                  Thème/chapitre
                  <input
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="La Seconde Guerre mondiale"
                    className="mt-2 w-full h-[52px] min-h-[52px] px-4 py-3 bg-white rounded-[20px] text-[17px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] resize-none overflow-hidden"
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                  />
                </label>
              </div>
              {/* Formule */}
              <div className="space-y-4">
                <label className="block text-[17px]">
                  Description de la fiche
                  <textarea
                    value={formule}
                    onChange={(e) => setFormule(e.target.value)}
                    placeholder="Cette fiche est une fiche de révision pour le chapitre de la seconde guerre mondiale"
                    className="mt-2 w-full h-[52px] min-h-[52px] px-4 py-3 bg-white rounded-[20px] text-[17px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] resize-none overflow-hidden"
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                  />
                </label>
              </div>
              {/* Langage */}
              <div>
                <LanguageSelector
                  selectedLanguage={language}
                  onLanguageSelect={setLanguage}
                />
              </div>
              {/* Taille */}
              <div>
                <SizeSelector
                  selectedSize={size}
                  onSizeSelect={setSize}
                />
              </div>
            </div>
          </div>
          {/* Bouton Générer */}
          <div className="px-4 pb-24 mt-8">
            <button 
              className="w-full h-[52px] bg-black text-white rounded-full text-[17px] font-medium"
              type="submit"
            >
              Générer ma fiche
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
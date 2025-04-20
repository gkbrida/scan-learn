'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LanguageSelector from '@/app/components/LanguageSelector';
import SizeSelector from '@/app/components/SizeSelector';

export default function GenerateWithAIPage() {
  const router = useRouter();
  const [theme, setTheme] = useState('');
  const [language, setLanguage] = useState('fr');
  const [size, setSize] = useState('moyenne');

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
        <div className="flex-1 px-4 mt-8">
          <div className="space-y-6">
            {/* Thème/Chapitre */}
            <div className="space-y-4">
              <label className="block text-[17px]">
                Thème/chapitre
                <textarea
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Exemple : La Seconde Guerre mondiale"
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
          >
            Générer ma fiche
          </button>
        </div>
      </div>
    </div>
  );
} 
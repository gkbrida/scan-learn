'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COLORS = [
  '#A78BFA', // violet
  '#86EFAC', // vert
  '#FCD34D', // jaune
  '#93C5FD', // bleu
  '#F9A8D4', // rose
  '#FDBA74', // orange
];

const ICONS = [
  { id: 'folder', path: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { id: 'building', path: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'globe', path: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { id: 'book', path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'chart', path: 'M8 13v-1m4 1v-3m4 3V8M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z' },
  { id: 'calculator', path: 'M9 7h6m0 10v4m-6-4v4m12-7-12 .01M3.2 17.8l17.6-17.6M3.2 6.2l17.6 17.6' },
  { id: 'location', path: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'wave', path: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { id: 'flask', path: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { id: 'book-open', path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'users', path: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
];

function NewMatiereForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Détermine si nous sommes en mode édition
  const isEditMode = searchParams?.get('mode') === 'edit';
  const matiereId = searchParams?.get('id');

  // Initialise les états avec les valeurs de l'URL si en mode édition
  const [nom, setNom] = useState(searchParams?.get('nom') || '');
  const [couleur, setCouleur] = useState('#' + (searchParams?.get('couleur') || '93C5FD'));
  const [icone, setIcone] = useState(searchParams?.get('icone') || 'book');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditMode && matiereId) {
        // Mode édition : mise à jour de la matière existante
        const { error } = await supabase
          .from('matieres')
          .update({
            nom,
            couleur,
            icone
          })
          .eq('id', matiereId);

        if (error) throw error;
      } else {
        // Mode création : insertion d'une nouvelle matière
        const { error } = await supabase
          .from('matieres')
          .insert([{ nom, couleur, icone }]);

        if (error) throw error;
      }

      router.back();
    } catch (error) {
      console.error('Erreur:', error);
      alert("Une erreur s'est produite");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-14 pb-6">
        <div className="flex justify-end">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h1 className="text-[32px] leading-10 font-semibold mt-8 mb-12">
          {isEditMode ? 'Modifier la matière' : 'Créer une nouvelle matière'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div>
            <label htmlFor="nom" className="block text-[22px] font-medium text-black mb-4">
              Nom de la matière
            </label>
            <input
              type="text"
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Philosophie"
              className="block w-full h-14 rounded-2xl px-6 text-lg bg-[#F3F4F6] border-0 placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-[22px] font-medium text-black mb-4">
              Couleur de la matière
            </label>
            <div className="bg-[#F3F4F6] rounded-2xl p-6">
              <div className="grid grid-cols-6 gap-4">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCouleur(color)}
                    className={`w-12 h-12 rounded-full ${couleur === color ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[22px] font-medium text-black mb-4">
              Icône de la matière
            </label>
            <div className="bg-[#F3F4F6] rounded-2xl p-6">
              <div className="grid grid-cols-6 gap-4">
                {ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => setIcone(icon.id)}
                    className={`w-12 h-12 rounded-full bg-[#E5E7EB] flex items-center justify-center
                      ${icone === icon.id ? 'ring-2 ring-black' : ''}`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon.path} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="fixed bottom-8 left-6 right-6 h-14 bg-[#94A3B8] text-white rounded-2xl text-lg font-medium"
          >
            {isEditMode ? 'Modifier' : 'Créer'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NewMatierePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    }>
      <NewMatiereForm />
    </Suspense>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ICONS } from '@/app/constants/icons';

const COLORS = [
  { id: '#FF6B6B', name: 'Rouge' },
  { id: '#4ECDC4', name: 'Turquoise' },
  { id: '#45B7D1', name: 'Bleu clair' },
  { id: '#96CEB4', name: 'Vert clair' },
  { id: '#4A90E2', name: 'Bleu' },
  { id: '#9B59B6', name: 'Violet' },
  { id: '#3498DB', name: 'Bleu foncé' },
  { id: '#2ECC71', name: 'Vert' },
  { id: '#F1C40F', name: 'Jaune' },
  { id: '#E67E22', name: 'Orange' },
  { id: '#E74C3C', name: 'Rouge foncé' },
  { id: '#1ABC9C', name: 'Turquoise foncé' },
];

export default function CreerMatierePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams?.get('mode') ?? null;
  const concours = searchParams?.get('concours') ?? null;
  const id = searchParams?.get('id') ?? null;
  const nomParam = searchParams?.get('nom') ?? null;
  const couleurParam = searchParams?.get('couleur') ?? null;
  const iconeParam = searchParams?.get('icone') ?? null;

  const [nom, setNom] = useState(nomParam || '');
  const [couleur, setCouleur] = useState(couleurParam ? `#${couleurParam}` : COLORS[0].id);
  const [icone, setIcone] = useState(iconeParam || Object.keys(ICONS)[0]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      if (mode === 'edit' && id) {
        const { error } = await supabase
          .from('matieres')
          .update({
            nom,
            couleur,
            icone,
          })
          .eq('id', id);

        if (error) throw error;
        router.push(`/matieres/${id}`);
      } else {
        const { data, error } = await supabase
          .from('matieres')
          .insert([
            {
              nom,
              couleur,
              icone,
              user_id: user.id,
              concours: concours ? 1 : 0
            },
          ])
          .select();

        if (error) throw error;
        router.push(`/dashboard`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };



  return (
    <div className="min-h-screen bg-[#F3F0FF] p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">{mode === 'edit' ? 'Modifier la matière' : concours ? 'Créer un concours' : 'Créer une matière'}</h1>
          <div className="w-10 h-10" /> {/* Spacer */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {concours ? 'Nom du concours' : 'Nom de la matière'}
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white"
              placeholder={concours ? "Ex: Police" : "Ex: Mathématiques"}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setCouleur(color.id)}
                  className={`w-12 h-12 rounded-2xl ${
                    couleur === color.id ? 'ring-2 ring-offset-2 ring-black' : ''
                  }`}
                  style={{ backgroundColor: color.id }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icône
            </label>
            <div className="grid grid-cols-5 gap-2">
              {Object.keys(ICONS).map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcone(iconName)}
                  className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center ${
                    icone === iconName ? 'ring-2 ring-black' : ''
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={ICONS[iconName as keyof typeof ICONS]}
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white p-4 rounded-2xl font-medium"
          >
            {mode === 'edit' ? 'Modifier' : 'Créer'}
          </button>
        </form>
      </div>
    </div>
  );
} 
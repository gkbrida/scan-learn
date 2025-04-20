'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { ICONS } from '@/app/constants/icons';
import BottomNav from '../components/BottomNav';

interface Matiere {
  id: string;
  nom: string;
  couleur: string;
  icone: string;
  fiches_count?: number;
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchMatieres = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('matieres')
          .select(`
            *,
            fiches:fiches(count)
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ Erreur lors de la récupération des matières:', error);
          return;
        }
        
        // Transformer les données pour avoir le bon format
        const matieresAvecFiches = data.map(m => ({
          ...m,
          fiches_count: m.fiches[0].count
        }));
        
        setMatieres(matieresAvecFiches);
      } catch (error) {
        console.error('Erreur lors de la récupération des matières:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatieres();
  }, []);

  const calculateProgress = async () => {
    try {
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Aucun utilisateur connecté');
        setProgress(0);
        return;
      }

      // Récupérer tous les quiz pour cette matière et cet utilisateur
      const { data: quizzes, error: quizError } = await supabase
        .from('qcm')
        .select('id, resultat')
        .eq('user_id', user.id);

      if (quizError) {
        console.error('❌ Erreur lors de la récupération des quiz:', quizError);
        return;
      }

      if (!quizzes || quizzes.length === 0) {
        setProgress(0);
        return;
      }

      // Calculer le pourcentage de quiz réussis
      const completedQuizzes = quizzes.filter(quiz => quiz.resultat === 1).length;
      const progressPercentage = Math.round((completedQuizzes / quizzes.length) * 100);
      setProgress(progressPercentage);
    } catch (err) {
      console.error('❌ Erreur lors du calcul de la progression:', err);
    }
  };
  useEffect(() => {
    calculateProgress();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <main>
      <div className="min-h-screen bg-[#F3F0FF] p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Progression générale */}
          <div className="bg-black rounded-2xl flex items-center p-2.5 mb-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-2.5">
              <span className="text-sm font-bold">{progress}%</span>
            </div>
            <div className="flex-1">
              <h2 className="text-white text-sm font-semibold mb-1">Progression générale</h2>
              <div className="h-1 bg-white/20 rounded-full">
                <div className="w-0 h-full bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Titre de la section */}
          <h1 className="text-base font-bold mb-3">Toutes les matières</h1>

          {/* Liste des matières */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {matieres.map((matiere) => (
              <Link
                key={matiere.id}
                href={`/matieres/${matiere.id}`}
                className="bg-white p-4 rounded-2xl"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-2xl flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: matiere.couleur }}
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={ICONS[matiere.icone as keyof typeof ICONS] || ICONS.book}
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{matiere.nom}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <span>{matiere.fiches_count || 0}</span>
                      <span>fiches</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bouton d'ajout */}
        <div className="fixed bottom-20 right-3 md:right-1/2 md:translate-x-[calc(24rem+0.75rem)]">
          <Link 
            href="/matieres/creer" 
            className="w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg"
          >
            <svg 
              className="w-5 h-5 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      </div>
      <div className='fixed bottom-0 left-0 right-0'>
        <BottomNav />
      </div>
    </main>
  );
} 
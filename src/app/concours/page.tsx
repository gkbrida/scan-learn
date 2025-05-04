'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { ICONS } from '@/app/constants/icons';
import { useRouter } from 'next/navigation';


interface Matiere {
  id: string;
  nom: string;
  couleur: string;
  icone: string;
  fiches_count?: number;
}

interface InfoUser {
  id: string;
  user_id: string;
  prenom: string;
  niveau_etudes: string;
  cursus: string;
  classe_actuelle: string;
  equipe: boolean;
}



const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [infoUser, setInfoUser] = useState<InfoUser>({
    id: '',
    user_id: '',
    prenom: '',
    niveau_etudes: '',
    cursus: '',
    classe_actuelle: '',
    equipe: false
  });
  const router = useRouter();
  useEffect(() => {
    const fetchMatieres = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: infoUser, error: infoUserError } = await supabase
          .from('info_users')
          .select('*')
          .eq('user_id', user.id);
        setInfoUser(infoUser?.[0]);

        if (infoUserError) {
          console.error('❌ Erreur lors de la récupération des informations de l\'utilisateur:', infoUserError);
          return;
        }
      

        const { data, error } = await supabase
          .from('matieres')
          .select(`
            *,
            fiches:fiches(count)
          `)
          .eq('concours', 1);

        if (error) {
          console.error('❌ Erreur lors de la récupération des concours:', error);
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

  


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (

      <div className="min-h-screen bg-[#F3F0FF] p-4 pb-20">
        <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-bold">Tous les concours</h1>
        </div>

          {/* Liste des matières */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {matieres.map((matiere) => (
              <Link
                key={matiere.id}
                href={`/matieres/${matiere.id}?concours=1`}
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
        {infoUser.equipe == true && (
        <div className="fixed bottom-20 right-3 md:right-1/2 md:translate-x-[calc(24rem+0.75rem)]">
          <Link 
            href="/matieres/creer?concours=1" 
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
        )}
        </div>

    );
} 
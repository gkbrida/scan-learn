'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import BottomSheet from '@/app/components/BottomSheet';
import MatiereOptionsSheet from '@/app/components/MatiereOptionsSheet';
import { ICONS } from '@/app/constants/icons';
import SizeSelector from '@/app/components/SizeSelector';
import LanguageSelector from '@/app/components/LanguageSelector';
import { toast } from 'react-hot-toast';

// Validation des variables d'environnement
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface Matiere {
  id: string;
  nom: string;
  couleur: string;
  icone: string;
}

interface Fiche {
  id: string;
  nom: string;
  created_at: string;
}

const OPTIONS = [
  {
    id: 'fiche',
    name: 'Avec ta fiche',
    description: 'Prends en photo ta fiche manuscrite',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    id: 'cours',
    name: 'Avec tes cours',
    description: 'Importe un PDF de ton cours',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    id: 'ia',
    name: 'Avec l\'IA',
    description: 'Génère une fiche à partir d\'un thème',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }
];

export default function MatierePage() {
  const params = useParams();
  const router = useRouter();
  const [matiere, setMatiere] = useState<Matiere | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isLessonSheetOpen, setIsLessonSheetOpen] = useState(false);
  const [isMatiereOptionsOpen, setIsMatiereOptionsOpen] = useState(false);
  const [niveauEtude, setNiveauEtude] = useState<string | null>(null);
  const [language, setLanguage] = useState('fr');
  const [size, setSize] = useState('moyenne');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ficheName, setFicheName] = useState<string>('');
  const [isProgressSheetOpen, setIsProgressSheetOpen] = useState(false);
  const [steps, setSteps] = useState([
    { id: 'analyse', label: 'Analyse du document', status: 'pending' },
    { id: 'creation', label: 'Création de la fiche', status: 'pending' },
    { id: 'miseEnForme', label: 'Mise en forme de la fiche', status: 'pending' }
  ]);
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchMatiere = async () => {
      if (!params?.id) {
        console.error('ID non trouvé dans les paramètres');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('matieres')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) {
          console.error('Erreur lors de la récupération de la matière:', error);
          return;
        }

        setMatiere(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFiches = async () => {
      if (!params?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('fiches')
          .select('id, nom, created_at')
          .eq('matiere_id', params.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erreur lors de la récupération des fiches:', error);
          return;
        }

        setFiches(data || []);
      } catch (error) {
        console.error('❌ Erreur:', error);
      }
    };

    fetchMatiere();
    fetchFiches();

    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('info_users')
          .select('niveau_etude')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setNiveauEtude(data.niveau_etude);
        }
      }
    };

    fetchUserInfo();
  }, [params?.id]);

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
        .eq('matiere_id', params?.id)
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
    if (params?.id) {
      calculateProgress();
    }
  }, [params?.id]);

  const handleOptionSelect = async (option: string) => {
    setIsCreateSheetOpen(false);
    switch (option) {
      case 'fiche':
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          if (params?.id) {
            router.push(`/matieres/${params.id}/scan`);
          }
        } catch (error) {
          alert("L'accès à la caméra a été refusé");
        }
        break;
      
      case 'cours':
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            if (file.size > 10 * 1024 * 1024) {
              alert("Le fichier est trop volumineux (max 10Mo)");
              return;
            }
            setSelectedFile(file);
            setError(null);
            setIsLessonSheetOpen(true);
          }
        };
        input.click();
        break;
      case 'ia':
        if (params?.id) {
          router.push(`/matieres/${params.id}/ia`);
        }
        break;
    }
  };

  const onEdit = () => {
    if (matiere) {
      const url = `/matieres/creer?mode=edit&id=${matiere.id}&nom=${encodeURIComponent(matiere.nom)}&couleur=${encodeURIComponent(matiere.couleur.replace('#', ''))}&icone=${encodeURIComponent(matiere.icone)}`;
      router.push(url);
    }
    setIsMatiereOptionsOpen(false);
  };

  const onDelete = async () => {
    if (matiere && confirm('Êtes-vous sûr de vouloir supprimer cette matière ? Toutes les fiches et les quiz associés seront également supprimés.')) {
      try {
        // 1. Récupérer toutes les fiches de la matière
        const { data: fiches, error: fichesError } = await supabase
          .from('fiches')
          .select('id')
          .eq('matiere_id', matiere.id);

        if (fichesError) throw fichesError;

        if (fiches && fiches.length > 0) {
          // 2. Supprimer tous les QCM associés à ces fiches
          const ficheIds = fiches.map(fiche => fiche.id);
          const { error: qcmError } = await supabase
            .from('qcm')
            .delete()
            .in('fiche_id', ficheIds);

          if (qcmError) {
            console.error('❌ Erreur lors de la suppression des QCM:', qcmError);
            throw qcmError;
          }

          // 3. Supprimer toutes les fiches
          const { error: fichesDeleteError } = await supabase
            .from('fiches')
            .delete()
            .eq('matiere_id', matiere.id);

          if (fichesDeleteError) {
            console.error('❌ Erreur lors de la suppression des fiches:', fichesDeleteError);
            throw fichesDeleteError;
          }
        }

        // 4. Enfin, supprimer la matière
        const { error: matiereError } = await supabase
          .from('matieres')
          .delete()
          .eq('id', matiere.id);

        if (matiereError) throw matiereError;

        toast.success('Matière et tout son contenu supprimés avec succès');
        router.push('/dashboard');
      } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        toast.error('Une erreur est survenue lors de la suppression');
      }
    }
    setIsMatiereOptionsOpen(false);
  };

  const updateStepStatus = (stepId: string, newStatus: 'pending' | 'loading' | 'completed') => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, status: newStatus } : step
    ));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedFile || !niveauEtude || !language || !size || !params?.id) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    setIsLessonSheetOpen(false);
    setIsProgressSheetOpen(true);
    setUploading(true);
    setError(null);

    // Étape 1: Analyse du document
    updateStepStatus('analyse', 'loading');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('matiereId', params.id.toString());
    formData.append('niveauEtude', niveauEtude.toString());
    formData.append('language', language.toString());
    formData.append('size', size.toString());

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const analyzeData = await response.json();
      updateStepStatus('analyse', 'completed');

      // Étape 2: Création de la fiche
      updateStepStatus('creation', 'loading');
      const createFicheFormData = new FormData();
      createFicheFormData.append('assistantId', analyzeData.assistantId.toString());
      createFicheFormData.append('fileId', analyzeData.fileId.toString());
      createFicheFormData.append('vectorStoreId', analyzeData.vectorStoreId.toString());
      createFicheFormData.append('storageDataPath', analyzeData.storagePath.toString());
      createFicheFormData.append('language', language.toString());
      createFicheFormData.append('size', size.toString());
      createFicheFormData.append('niveauEtude', niveauEtude.toString());
      createFicheFormData.append('matiereId', params.id.toString());

      const createFicheResponse = await fetch('/api/createFiche', {
        method: 'POST',
        body: createFicheFormData
      });

      if (!createFicheResponse.ok) {
        throw new Error(await createFicheResponse.text());
      }

      const createFicheData = await createFicheResponse.json();
      updateStepStatus('creation', 'completed');

      // Étape 3: Mise en forme de la fiche
      updateStepStatus('miseEnForme', 'loading');
      const miseEnFormeResponse = await fetch('/api/miseEnFormeFiche', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          threadId: createFicheData.threadId,
          runId: createFicheData.runId,
          matiereId: params.id,
          ficheName: ficheName,
          assistantId: analyzeData.assistantId,
          vectorStoreId: analyzeData.vectorStoreId,
          fileId: analyzeData.fileId,
          language: language
        })
      });

      if (!miseEnFormeResponse.ok) {
        throw new Error(await miseEnFormeResponse.text());
      }

      updateStepStatus('miseEnForme', 'completed');
      
      // Rafraîchir la liste des fiches
      const { data: newFiches, error: fetchError } = await supabase
        .from('fiches')
        .select('id, nom, created_at')
        .eq('matiere_id', params.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Erreur lors de la récupération des fiches:', fetchError);
      } else {
        setFiches(newFiches || []);
      }

      // Fermer la modal de progression et réinitialiser les états
      setTimeout(() => {
        setIsProgressSheetOpen(false);
        setSelectedFile(null);
        setFicheName('');
        setSteps(steps.map(step => ({ ...step, status: 'pending' })));
      }, 1000);

    } catch (err: any) {
      console.error('❌ Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!matiere) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-lg text-black">Matière non trouvée</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="relative h-[200px] p-4" style={{ backgroundColor: matiere.couleur }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={() => setIsMatiereOptionsOpen(true)}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="w-14 h-14 bg-[#F3F0FF] rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={ICONS[matiere.icone as keyof typeof ICONS] || ICONS.book} 
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">
              {matiere.nom}
            </h1>
          </div>
        </div>
      </div>

      <div className="bg-white -mt-6 rounded-t-[2.5rem] min-h-[calc(100vh-200px+24px)] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {progress}% de progression
            </div>
          </div>

          {fiches.length > 0 ? (
            <div className="space-y-4">
              {fiches.map((fiche) => (
                <div
                  key={fiche.id}
                  onClick={() => router.push(`/matieres/${params?.id}/fiches/${fiche.id}`)}
                  className="p-4 bg-gray-50 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">{fiche.nom}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(fiche.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-2">
                Pas encore de fiche de révision...
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Crée ta première fiche de révision pour commencer !
              </p>
              <button 
                onClick={() => setIsCreateSheetOpen(true)}
                className="w-full max-w-sm py-4 px-6 bg-white rounded-full border border-gray-200 text-center font-medium hover:bg-gray-50 transition-colors"
              >
                Ajouter une fiche
              </button>
            </div>
          )}
        </div>
      </div>
    
      {fiches.length > 0 && (
        <button
          onClick={() => setIsCreateSheetOpen(true)}
          className="fixed bottom-20 right-3 md:right-1/2 md:translate-x-[calc(24rem+0.75rem)] w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      <BottomSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
        title="Créer une fiche"
      >
        <div className="px-4 space-y-2">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              className="w-full p-4 bg-[#F6F4F0] rounded-[20px] flex items-start gap-4 text-left"
            >
              <div className="text-gray-500">
                {option.icon}
              </div>
              <div>
                <div className="text-[17px] font-medium">
                  {option.name}
                </div>
                <div className="text-[15px] text-gray-500">
                  {option.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isLessonSheetOpen}
        onClose={() => setIsLessonSheetOpen(false)}
        title="Créer une fiche"
      >
        <div className="min-h-[calc(100vh-4rem)] bg-white px-4">
          <form onSubmit={handleSubmit} className="space-y-6 py-6">
            <div>
              <label htmlFor="ficheName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom du document
              </label>
              <input
                type="text"
                id="ficheName"
                value={ficheName}
                onChange={(e) => setFicheName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Entrez le nom de votre document"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier PDF
              </label>
              {!selectedFile ? (
                <div 
                  className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    type="file"
                    id="file-input"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          setError('Le fichier est trop volumineux (maximum 10 Mo)');
                          return;
                        }
                        setSelectedFile(file);
                        setError(null);
                      }
                    }}
                  />
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4-4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 mt-4 justify-center">
                      <div className="text-blue-600 hover:text-blue-500">Sélectionner un fichier</div>
                      <p className="pl-1">ou glisser-déposer</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">PDF jusqu'à 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} Mo</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      const input = document.getElementById('file-input') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="ml-4 flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue de sortie
                </label>
                <LanguageSelector 
                  selectedLanguage={language}
                  onLanguageSelect={setLanguage}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taille de la fiche
                </label>
                <SizeSelector 
                  selectedSize={size}
                  onSizeSelect={setSize}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading || !selectedFile || !ficheName}
                className={`w-full px-6 py-4 text-white rounded-full text-lg font-medium transition-colors ${
                  uploading || !selectedFile || !ficheName
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-black hover:bg-gray-900'
                }`}
              >
                {uploading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Traitement en cours...
                  </div>
                ) : (
                  'Créer ma fiche'
                )}
              </button>
            </div>
          </form>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isProgressSheetOpen}
        onClose={() => setIsProgressSheetOpen(false)}
        title="Création de la fiche en cours"
      >
        <div className="p-4 space-y-6">
          {steps.map(step => (
            <div key={step.id} className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {step.status === 'loading' ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-black" />
                ) : step.status === 'completed' ? (
                  <span className="text-green-500 text-xl">✅</span>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <span className={`flex-grow ${step.status === 'completed' ? 'text-green-600' : 'text-gray-700'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </BottomSheet>

      <MatiereOptionsSheet
        isOpen={isMatiereOptionsOpen}
        onClose={() => setIsMatiereOptionsOpen(false)}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
} 
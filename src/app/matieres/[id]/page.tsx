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
import { isNull } from 'util';

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
    name: 'Avec tes cours images',
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
    name: 'Avec tes cours pdf',
    description: 'Importe un PDF de ton cours',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
  const [isLessonImgSheetOpen, setIsLessonImgSheetOpen] = useState(false);
  const [isMatiereOptionsOpen, setIsMatiereOptionsOpen] = useState(false);
  const [language, setLanguage] = useState('fr');
  const [size, setSize] = useState('moyenne');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ficheName, setFicheName] = useState<string>('');
  const [ficheNameImg, setFicheNameImg] = useState<string>('');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [steps, setSteps] = useState([
    { id: 'analyse', label: 'Analyse du document', status: 'pending' },
    { id: 'creation', label: 'Création de la fiche', status: 'pending' },
    { id: 'miseEnForme', label: 'Mise en forme de la fiche', status: 'pending' }
  ]);
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [progress, setProgress] = useState(0);
  const [equipe, setEquipe] = useState(false);
  const [userId, setUserID] = useState('');
  const searchParams = useSearchParams();
  const concours = searchParams?.get('concours');

  useEffect(() => {
    const fetchUserID = async () => {
      const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('❌ Aucun utilisateur connecté');
          setIsLoading(false);
          return;
        }
        setUserID(user.id);
      };
      fetchUserID();
      
  }, [userId]);

  useEffect(() => {
    
    const fetchInfoUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('❌ Aucun utilisateur connecté');
          setIsLoading(false);
          return;
        }
      const { data: infoUser, error: infoUserError } = await supabase
        .from('info_users')
        .select('*')
        .eq('user_id', user.id);
      setEquipe(infoUser?.[0].equipe);
    };
    
    fetchInfoUser();

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


  }, [params?.id]);

  const calculateProgress = async () => {
    try {
     

      // Récupérer tous les quiz pour cette matière et cet utilisateur
      
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      const { data: quizzes, error: quizError } = await supabase
        .from('qcm')
        .select('id, resultat')
        .eq('matiere_id', params?.id)
        .eq('user_id', userId);

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
        const inputimg = document.createElement('input');
        inputimg.type = 'file';
        inputimg.accept = 'image/*';
        inputimg.onchange = async (e) => {
          const images = Array.from((e.target as HTMLInputElement).files || []);
          if (images.length > 10) {
            setError('Vous pouvez sélectionner jusqu’à 10 images maximum.');
                            return;
          }
          const invalid = images.find(image => !image.type.startsWith('image/'));
          if (invalid) {
            setError('Seules les images sont autorisées.');
            return;
          }
          setSelectedImages(images);
          setError(null);
          setIsLessonImgSheetOpen(true);
        };
        inputimg.click();
        
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
            setSelectedFiles([file]);
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
    
    if (selectedFiles.length === 0  || !language || !size || !params?.id) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    setIsLessonSheetOpen(false);
    setIsBottomSheetOpen(true);
    setUploading(true);
    setError(null);

    // Étape 1: Analyse du document
    updateStepStatus('analyse', 'loading');
    
    try {
      let tailleDocument = "";
      if(size.toString() === "petite") {
        tailleDocument = "Create an ultra-concise sheet that goes straight to the point";
      } else if(size.toString() === "moyenne") {
        tailleDocument = "Create a balanced sheet, striking the right balance between conciseness and detail";
      } else if(size.toString() === "grande") {
        tailleDocument = "Create a complete and detailed sheet for thorough understanding";
      }

      // Récupérer le nombre initial de fiches
      const { count: initialCount } = await supabase
        .from('fiches')
        .select('*', { count: 'exact', head: true })
        .eq('matiere_id', params.id);

    const formData = new FormData();
      selectedFiles.forEach((file, idx) => {
        formData.append('file', file);
      });
    formData.append('matiereId', params.id.toString());
    formData.append('language', language.toString());
      formData.append('size', tailleDocument);
      formData.append('userId', userId);
      formData.append('nom', ficheName);

      const response = await fetch('https://n8n-tb3a.onrender.com/webhook/8c28ab02-e3ae-4aab-ae89-5a182032aa9d', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        await fetch('https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
         
        });
        throw new Error(await response.text());
      }


      // Boucle de vérification
      let isCompleted = false;
      for (let i = 0; i < 10 && !isCompleted; i++) {
        // Attendre 10 secondes
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Vérifier le nouveau nombre de fiches
        const { count: currentCount } = await supabase
          .from('fiches')
          .select('*', { count: 'exact', head: true })
          .eq('matiere_id', params.id);

        console.log(`📊 Vérification ${i + 1}/10 - Fiches initiales: ${initialCount}, Fiches actuelles: ${currentCount}`);

        if (currentCount !== null && initialCount !== null && currentCount > initialCount) {
      updateStepStatus('analyse', 'completed');
          setIsBottomSheetOpen(false);
          
          // Rafraîchir la liste des fiches
          const { data: newFiches, error: fetchError } = await supabase
            .from('fiches')
            .select('id, nom, created_at')
            .eq('matiere_id', params.id)
            .order('created_at', { ascending: false });

          if (!fetchError && newFiches) {
            setFiches(newFiches);
          }

          isCompleted = true;
          break;
        }
      }

      if (!isCompleted) {
        await fetch('https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        console.warn('⚠️ Le nombre de fiches n\'a pas changé après 10 tentatives');
        toast.error('La génération de la fiche prend plus de temps que prévu');
      }

    } catch (err: any) {
      await fetch('https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.error('❌ Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitImg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (selectedImages.length === 0  || !language || !size || !params?.id) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    setIsLessonImgSheetOpen(false);
    setIsBottomSheetOpen(true);
    setUploading(true);
    setError(null);

    // Étape 1: Analyse du document
    updateStepStatus('analyse', 'loading');
    
    try {
      
      let tailleDocument = "";
      if(size.toString() === "petite") {
        tailleDocument = "Create an ultra-concise sheet that goes straight to the point";
      } else if(size.toString() === "moyenne") {
        tailleDocument = "Create a balanced sheet, striking the right balance between conciseness and detail";
      } else if(size.toString() === "grande") {
        tailleDocument = "Create a complete and detailed sheet for thorough understanding";
      }

      // Récupérer le nombre initial de fiches
      const { count: initialCount } = await supabase
        .from('fiches')
        .select('*', { count: 'exact', head: true })
        .eq('matiere_id', params.id);

      const formData = new FormData();
      selectedImages.forEach((image, idx) => {
        formData.append(`image${idx + 1}`, image);
      });
      formData.append('matiereId', params.id.toString());
      formData.append('language', language.toString());
      formData.append('size', tailleDocument);
      formData.append('userId', userId);
      formData.append('nom', ficheNameImg);
      formData.append('nbImg', selectedImages.length.toString());

      const response = await fetch('https://n8n-tb3a.onrender.com/webhook/0fcc4406-8845-4a36-a3d8-f135f2fba20f', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        await fetch('https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
         
        });
        throw new Error(await response.text());
      }


      // Boucle de vérification
      let isCompleted = false;
      for (let i = 0; i < 10 && !isCompleted; i++) {
        // Attendre 10 secondes
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Vérifier le nouveau nombre de fiches
        const { count: currentCount } = await supabase
          .from('fiches')
          .select('*', { count: 'exact', head: true })
          .eq('matiere_id', params.id);

        console.log(`📊 Vérification ${i + 1}/10 - Fiches initiales: ${initialCount}, Fiches actuelles: ${currentCount}`);

        if (currentCount !== null && initialCount !== null && currentCount > initialCount) {
          updateStepStatus('analyse', 'completed');
          setIsBottomSheetOpen(false);
      
      // Rafraîchir la liste des fiches
      const { data: newFiches, error: fetchError } = await supabase
        .from('fiches')
        .select('id, nom, created_at')
        .eq('matiere_id', params.id)
        .order('created_at', { ascending: false });

          if (!fetchError && newFiches) {
            setFiches(newFiches);
          }

          isCompleted = true;
          break;
        }
      }

      if (!isCompleted) {
        await fetch('https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        console.warn('⚠️ Le nombre de fiches n\'a pas changé après 10 tentatives');
        toast.error('La génération de la fiche prend plus de temps que prévu');
      }

    } catch (err: any) {
      await fetch('https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
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
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {((concours === '0' || concours==null) || (concours === '1' && equipe)) && 
            (<button
              onClick={() => setIsMatiereOptionsOpen(true)}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>)}
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
                  onClick={() => router.push(`/matieres/${params?.id}/fiches/${fiche.id}?concours=${concours}`)}
                  className="p-4 bg-gray-50 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg 
                      className="h-8 w-8 text-gray-500 mr-4" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" 
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{fiche.nom}</p>
                    </div>
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
              {((concours === '0' || concours==null)  || (concours === '1' && equipe)) && 
              <button 
                onClick={() => setIsCreateSheetOpen(true)}
                className="w-full max-w-sm py-4 px-6 bg-white rounded-full border border-gray-200 text-center font-medium hover:bg-gray-50 transition-colors"
              >
                Ajouter une fiche
              </button>}
            </div>
          )}
        </div>
      </div>
    
      {fiches.length > 0 && ((concours === '0' || concours==null)  || (concours === '1' && equipe)) && (
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
                PDF de la fiche
              </label>
              {selectedFiles.length === 0 ? (
                <div 
                  className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    type="file"
                    id="file-input"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 10) {
                        setError('Vous pouvez sélectionner jusqu’à 10 images maximum.');
                          return;
                        }
                      const invalid = files.find(file => !file.type.startsWith('.pdf'));
                      if (invalid) {
                        setError('Seules les images sont autorisées.');
                        return;
                      }
                      setSelectedFiles(files);
                      setError(null);
                    }}
                  />
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4-4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 mt-4 justify-center">
                      <div className="text-blue-600 hover:text-blue-500">Sélectionner des images</div>
                      <p className="pl-1">ou glisser-déposer</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Jusqu'à 10 images (jpg, png, ...)</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={file.name } className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                        <svg 
                          className="h-8 w-8 text-gray-500 mr-4" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" 
                          />
                    </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                          const newFiles = selectedFiles.filter((_, i) => i !== idx);
                          setSelectedFiles(newFiles);
                          if (newFiles.length === 0) {
                      const input = document.getElementById('file-input') as HTMLInputElement;
                      if (input) input.value = '';
                          }
                    }}
                    className="ml-4 flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                    </div>
                  ))}
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
                disabled={uploading || selectedFiles.length === 0 || !ficheName}
                className={`w-full px-6 py-4 text-white rounded-full text-lg font-medium transition-colors ${
                  uploading || selectedFiles.length === 0 || !ficheName
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
        isOpen={isLessonImgSheetOpen}
        onClose={() => setIsLessonImgSheetOpen(false)}
        title="Créer une fiche"
      >
        <div className="min-h-[calc(100vh-4rem)] bg-white px-4">
          <form onSubmit={handleSubmitImg} className="space-y-6 py-6">
            <div>
              <label htmlFor="ficheNameImg" className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la fiche
              </label>
              <input
                type="text"
                id="ficheNameImg"
                value={ficheNameImg}
                onChange={(e) => setFicheNameImg(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Entrez le nom de votre document"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images de la fiche
              </label>
              {selectedImages.length === 0 ? (
                <div 
                  className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-input-img')?.click()}
                >
                  <input
                    type="file"
                    id="file-input-img"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const images = Array.from(e.target.files || []);
                      if (images.length > 10) {
                        setError('Vous pouvez sélectionner jusqu’à 10 images maximum.');
                        return;
                      }
                      const invalid = images.find(image => !image.type.startsWith('image/'));
                      if (invalid) {
                        setError('Seules les images sont autorisées.');
                        return;
                      }
                      setSelectedImages(images);
                      setError(null);
                    }}
                  />
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4-4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 mt-4 justify-center">
                      <div className="text-blue-600 hover:text-blue-500">Sélectionner des images</div>
                      <p className="pl-1">ou glisser-déposer</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Jusqu'à 10 images (jpg, png, ...)</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedImages.map((image, idx) => (
                    <div key={image.name + idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <img src={URL.createObjectURL(image)} alt={image.name} className="h-8 w-8 object-cover rounded mr-4" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{image.name}</p>
                          <p className="text-sm text-gray-500">{(image.size / 1024 / 1024).toFixed(2)} Mo</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = selectedImages.filter((_, i) => i !== idx);
                          setSelectedImages(newImages);
                          if (newImages.length === 0) {
                            const input = document.getElementById('file-input-img') as HTMLInputElement;
                            if (input) input.value = '';
                          }
                        }}
                        className="ml-4 flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {selectedImages.length < 10 && (
                    <button
                      type="button"
                      className="mt-2 text-blue-600 hover:text-blue-500 text-sm"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e) => {
                          const images = Array.from((e.target as HTMLInputElement).files || []);
                          if (images.length + selectedImages.length > 10) {
                            setError('Vous pouvez sélectionner jusqu’à 10 images maximum.');
                            return;
                          }
                          const invalid = images.find(image => !image.type.startsWith('image/'));
                          if (invalid) {
                            setError('Seules les images sont autorisées.');
                            return;
                          }
                          setSelectedImages([...selectedImages, ...images]);
                          setError(null);
                      };
                      input.click();
                                    }}
                    >
                      Ajouter une image
                    </button>
                  )}
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
                disabled={uploading || selectedImages.length === 0 || !ficheNameImg}
                className={`w-full px-6 py-4 text-white rounded-full text-lg font-medium transition-colors ${
                  uploading || selectedImages.length === 0 || !ficheNameImg
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
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
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
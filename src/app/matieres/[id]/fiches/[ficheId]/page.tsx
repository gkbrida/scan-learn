'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-hot-toast';
import BottomSheet from '@/app/components/BottomSheet';
import CarteMemo from '@/app/components/CarteMemo';
import Script from 'next/script';

// Déclaration des types pour MathJax
declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: () => Promise<void>;
      tex?: {
        inlineMath: string[][];
        displayMath: string[][];
        processEscapes: boolean;
        packages: string[];
      };
      options?: {
        enableMenu: boolean;
        skipHtmlTags: string[];
        processHtmlClass: string;
      };
      startup?: {
        typeset: boolean;
        ready: () => void;
      };
    };
  }
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Fiche {
  id: string;
  nom: string;
  contenu: string;
  created_at: string;
  language: string;
  file_id: string;
}



interface CarteMemo {
  id: string;
  titre: string;
  contenu: string;
}



const contentStyles = `
  .fiche-content {
    font-family: system-ui, -apple-system, sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
  }

  /* Titres */
  .fiche-content h1 {
    font-size: 2em;
    font-weight: 700;
    margin-top: 2em;
    margin-bottom: 0.8em;
    color: #000;
  }

  .fiche-content h2 {
    font-size: 1.5em;
    font-weight: 600;
    margin-top: 1.8em;
    margin-bottom: 0.6em;
    color: #111;
  }

  .fiche-content h3 {
    font-size: 1.25em;
    font-weight: 600;
    margin-top: 1.6em;
    margin-bottom: 0.5em;
    color: #222;
  }

  /* Paragraphes */
  .fiche-content p {
    margin-bottom: 1.2em;
    line-height: 1.7;
  }

  /* Listes */
  .fiche-content ul {
    list-style-type: disc;
    margin: 1.2em 0;
    padding-left: 1.8em;
  }

  .fiche-content ol {
    list-style-type: decimal;
    margin: 1.2em 0;
    padding-left: 1.8em;
  }

  .fiche-content ul ul {
    list-style-type: circle;
    margin: 0.5em 0;
  }

  .fiche-content ol ol {
    list-style-type: lower-alpha;
    margin: 0.5em 0;
  }

  .fiche-content ul ol {
    margin: 0.5em 0;
  }

  .fiche-content ol ul {
    margin: 0.5em 0;
  }

  .fiche-content li {
    margin-bottom: 0.5em;
    padding-left: 0.5em;
  }

  /* Mise en forme du texte */
  .fiche-content strong {
    font-weight: 600;
    color: #000;
  }

  .fiche-content em {
    font-style: italic;
  }

  /* Citations */
  .fiche-content blockquote {
    border-left: 4px solid #e5e7eb;
    padding: 1em 1.5em;
    margin: 1.5em 0;
    background-color: #f9fafb;
    font-style: italic;
    color: #4b5563;
  }

  /* Code */
  .fiche-content code {
    background-color: #f3f4f6;
    padding: 0.2em 0.4em;
    border-radius: 0.25em;
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
  }

  .fiche-content pre {
    background-color: #f3f4f6;
    padding: 1.2em;
    border-radius: 0.5em;
    overflow-x: auto;
    margin: 1.5em 0;
  }

  .fiche-content pre code {
    background-color: transparent;
    padding: 0;
    font-size: 0.9em;
    line-height: 1.6;
  }

  /* Tableaux */
  .fiche-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    font-size: 0.95em;
  }

  .fiche-content th {
    background-color: #f9fafb;
    font-weight: 600;
    text-align: left;
    padding: 0.8em;
    border: 1px solid #e5e7eb;
  }

  .fiche-content td {
    padding: 0.8em;
    border: 1px solid #e5e7eb;
  }

  /* Sections spécifiques */
  .fiche-content .resume {
    background-color: #f8fafc;
    border-radius: 0.5em;
    padding: 1.5em;
    margin: 1.5em 0;
  }

  .fiche-content .plan {
    margin: 1.5em 0;
  }

  .fiche-content .section {
    margin: 2em 0;
  }

  .fiche-content .synthese {
    background-color: #f0f9ff;
    border-radius: 0.5em;
    padding: 1.5em;
    margin: 1.5em 0;
  }

  .fiche-content .mots-cles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
    margin: 1.5em 0;
  }

  .fiche-content .mot-cle {
    background-color: #f3f4f6;
    padding: 0.4em 0.8em;
    border-radius: 1em;
    font-size: 0.9em;
    color: #4b5563;
  }

  .fiche-content .quiz {
    background-color: #fdf2f8;
    border-radius: 0.5em;
    padding: 1.5em;
    margin: 1.5em 0;
  }

  /* Espacement entre les sections */
  .fiche-content > *:first-child {
    margin-top: 0;
  }

  .fiche-content > *:last-child {
    margin-bottom: 0;
  }

  /* Liens */
  .fiche-content a {
    color: #2563eb;
    text-decoration: none;
  }

  .fiche-content a:hover {
    text-decoration: underline;
  }
`;

export default function FichePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [equipe, setEquipe] = useState(false);
  const concours = searchParams?.get('concours');
  const id = params?.id as string;
  const ficheId = params?.ficheId as string;
  const [activeTab, setActiveTab] = useState<'fiche' | 'cartes'>('fiche');
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [cartesMemo, setCartesMemo] = useState<CarteMemo[]>([]);
  const [isFicheOptionsOpen, setIsFicheOptionsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mathJaxLoaded = useRef(false);

  // Fonction pour nettoyer le contenu des cartes et formater les formules
  const cleanCardContent = (content: string | null) => {
    if (!content) return '';
    let cleanContent = content.replace(/```html\n?/g, '').replace(/```\n?/g, '');
    
    // Traiter les formules mathématiques
    cleanContent = cleanContent.replace(/\\\((.*?)\\\)/g, (match, formula) => {
      return `\\(${formula.trim()}\\)`;
    });
    
    cleanContent = cleanContent.replace(/\\\[(.*?)\\\]/g, (match, formula) => {
      return `\\[${formula.trim()}\\]`;
    });

    return cleanContent;
  };

  useEffect(() => {
    const fetchEquipe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: infoUser, error: infoUserError } = await supabase
      .from('info_users')
      .select('*')
      .eq('user_id', user.id);
    setEquipe(infoUser?.[0].equipe);  
    console.log("equipe",infoUser?.[0].equipe);
    console.log("concours",concours);
    };
    fetchEquipe();


    // Charger MathJax
    if (!mathJaxLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      script.id = 'MathJax-script';
      
      const config = {
        tex: {
          inlineMath: [['\\(', '\\)']],
          displayMath: [['\\[', '\\]']],
          processEscapes: true,
          packages: ['base', 'ams', 'noerrors', 'noundefined']
        },
        options: {
          enableMenu: false,
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
          processHtmlClass: 'fiche-content'
        },
        startup: {
          typeset: false,
          ready: () => {
            console.log('✅ MathJax est prêt');
            (window as any).MathJax?.typesetPromise?.();
          }
        }
      };

      window.MathJax = config;
      document.head.appendChild(script);
      mathJaxLoaded.current = true;
    }
  }, []);

  // Effet pour retraiter les formules quand le contenu change
  useEffect(() => {
    const typeset = async () => {
      if (window.MathJax?.typesetPromise && fiche?.contenu) {
        try {
          await window.MathJax.typesetPromise();
        } catch (err) {
          console.error('❌ Erreur lors du traitement des formules:', err);
        }
      }
    };

    // Attendre un peu pour s'assurer que le contenu est rendu
    const timeoutId = setTimeout(typeset, 100);
    return () => clearTimeout(timeoutId);
  }, [fiche?.contenu]);

  useEffect(() => {
    // Injecter les styles dans le head
    const styleElement = document.createElement('style');
    styleElement.innerHTML = contentStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    const fetchFiche = async () => {
      if (!ficheId) return;

      try {
        const { data, error } = await supabase
          .from('fiches')
          .select('*')
          .eq('id', ficheId)
          .single();

        if (error) {
          console.error('❌ Erreur lors de la récupération de la fiche:', error);
          return;
        }

        setFiche(data);
      } catch (error) {
        console.error('❌ Erreur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiche();

    const checkQuizExists = async () => {
      if (!ficheId) return;
  
      try {
        const { data, error } = await supabase
          .from('qcm')
          .select('id')
          .eq('fiche_id', ficheId);
        
        console.log('💾 Recherche quiz pour UUID:', ficheId);
        console.log('📊 Nombre de quiz trouvés:', data?.length);
  
        if (error) {
          console.error('❌ Erreur lors de la vérification des quiz:', error);
          return;
        }
  
        setHasQuiz(data && data.length > 0);
      } catch (error) {
        console.error('❌ Erreur:', error);
      }
    };
    checkQuizExists();
  }, [ficheId]);

  // Modifier la fonction fetchCards
  const fetchCards = async () => {
    if (!ficheId) return;

    try {
      const { data, error } = await supabase
        .from('cartes_memo')
        .select('id, titre, contenu')
        .eq('fiche_id', ficheId);

      console.log('📊 Nombre de cartes trouvés:', data?.length);
      if (error) {
        console.error('❌ Erreur lors de la récupération des cartes:', error);
        return;
      }

      if (data) {
        // Assurons-nous que les données correspondent à l'interface CarteMemo
        const cartesTypees: CarteMemo[] = data.map(carte => ({
          id: carte.id,
          titre: carte.titre,
          contenu: carte.contenu
        }));
        setCartesMemo(cartesTypees);
      }
    } catch (error) {
      console.error('❌ Erreur inattendue:', error);
    }
  };

  
  // Charger les cartes au montage du composant
  useEffect(() => {
    fetchCards();
  }, [ficheId]);

  const handleGenerateCards = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('💾 Utilisateur connecté:', user);
      if (!user) {
        toast.error('Vous devez être connecté pour générer des cartes mémo');
        return;
      }

      const response = await fetch('https://n8n-tb3a.onrender.com/webhook/c6598750-8b44-44b4-8c1c-f17bfcd97da4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ficheId: ficheId,
          language: fiche?.language,
          matiereId: id,
          userId: user.id,
          fileId: fiche?.file_id
        }),
      });

      if (!response.ok) {
        await fetch(`https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2?ficheId=${ficheId}&matiereId=${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        throw new Error('Erreur lors de la génération des cartes O1');
      }

      // Boucle de polling pour vérifier le nombre de cartes mémo
      let found = false;
      for (let i = 0; i < 10; i++) {
        // Attendre 10 secondes
        await new Promise(res => setTimeout(res, 10000));
        // Vérifier le nombre de cartes mémo pour la fiche
        const { count, error } = await supabase
          .from('cartes_memo')
          .select('*', { count: 'exact', head: true })
          .eq('fiche_id', ficheId);
        if (error) {
          console.error('❌ Erreur lors du comptage des cartes mémo:', error);
        }
        if ((count ?? 0) > 20) {
          setIsLoadingQuiz(false);
          await fetchCards();
          found = true;
          break;
        }
      }
      if (!found) {
        toast.error("Le nombre de cartes mémo n'a pas dépassé 20 après 10 tentatives.");
        // Appel du webhook de fallback
        await fetch(`https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2?ficheId=${ficheId}&matiereId=${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
      }
      toast.success('Cartes générées avec succès !');
      // Recharger les cartes après la génération
      await fetchCards();
    } catch (error) {
      console.error('❌ Erreur 02:', error);
      toast.error('Erreur lors de la génération des cartes 02');
      // Appel du webhook de fallback en cas d'erreur
      await fetch(`https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2?ficheId=${ficheId}&matiereId=${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    } finally {
      setIsLoadingCards(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!ficheId || !id) {
      toast.error('Données manquantes pour la génération du quiz');
      return;
    }

    setIsLoadingQuiz(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Vous devez être connecté pour générer un quiz');
        return;
      }

      const response = await fetch('https://n8n-tb3a.onrender.com/webhook/b955d692-5779-41fd-8725-63c1db99b7e6', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ficheId: ficheId,
          language: fiche?.language,
          matiereId: id,
          userId: user.id,
          fileId: fiche?.file_id
        }),
      });

      if (!response.ok) {
        await fetch(`https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2?ficheId=${ficheId}&matiereId=${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        throw new Error('Erreur lors de la génération du quiz');
      }

      // Boucle de vérification des quiz
      let isCompleted = false;
      for (let i = 0; i < 10 && !isCompleted; i++) {
        // Attendre 10 secondes
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Vérifier le nombre de quiz
        const { count: quizCount } = await supabase
          .from('qcm')
          .select('*', { count: 'exact', head: true })
          .eq('fiche_id', ficheId);

        console.log(`📊 Vérification ${i + 1}/10 - Nombre de quiz: ${quizCount}`);

        if (quizCount !== null && quizCount >= 10) {
          setIsLoadingQuiz(false);
          toast.success('Quiz générés avec succès !');
          router.push(`/matieres/${id}/fiches/${ficheId}/quiz`);
          isCompleted = true;
          break;
        }
      }

      if (!isCompleted) {
        await fetch(`https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2?ficheId=${ficheId}&matiereId=${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        console.warn('⚠️ Le nombre de quiz n\'a pas atteint 20 après 10 tentatives');
        setIsLoadingQuiz(false);
        toast.error('La génération des quiz prend plus de temps que prévu');
      }

    } catch (error) {
      await fetch(`https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2?ficheId=${ficheId}&matiereId=${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la génération du quiz');
      setIsLoadingQuiz(false);
    }
  };


  // Modifier le rendu des cartes
  const renderCardsTab = () => {
    if (isLoadingCards) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3">Génération des cartes en cours...</span>
        </div>
      );
    }

    if (cartesMemo.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cartesMemo.map((carte) => (
            <div 
              key={carte.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="bg-blue-50 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {carte.titre}
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="prose max-w-none">
                  {carte.contenu}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }else{
      return (
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-gray-600 mb-4">
            Aucune carte mémo n'a encore été générée pour cette fiche.
          </p>
          <button
            onClick={handleGenerateCards}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                <span>Génération en cours...</span>
              </div>
            ) : (
              'Générer les cartes mémo'
            )}
          </button>
        </div>
      );
    }

    
  };
  const handleDeleteFiche = async () => {
    if (!fiche || !id) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette fiche ?')) {
      try {
        // Supprimer d'abord tous les QCM associés à cette fiche
        const { error: qcmError } = await supabase
          .from('qcm')
          .delete()
          .eq('fiche_id', fiche.id);

        if (qcmError) {
          console.error('❌ Erreur lors de la suppression des QCM:', qcmError);
          throw qcmError;
        }

        // Ensuite supprimer la fiche
        const { error: ficheError } = await supabase
          .from('fiches')
          .delete()
          .eq('id', fiche.id);

        if (ficheError) throw ficheError;
        
        toast.success('Fiche et QCM associés supprimés avec succès');
        router.push(`/matieres/${id}`);
      } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de la fiche');
      }
      setIsFicheOptionsOpen(false);
    }
  };

  const handleEditFiche = async () => {
    // Pour l'instant, on ne modifie que le nom de la fiche
    const newName = prompt('Nouveau nom de la fiche:', fiche?.nom);
    if (newName && newName !== fiche?.nom) {
      try {
        const { error } = await supabase
          .from('fiches')
          .update({ nom: newName })
          .eq('id', fiche?.id);

        if (error) throw error;
        
        setFiche(prev => prev ? { ...prev, nom: newName } : null);
        toast.success('Nom de la fiche modifié avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de la modification:', error);
        toast.error('Erreur lors de la modification du nom');
      }
    }
    setIsFicheOptionsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!fiche) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-lg text-black">Fiche non trouvée</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center h-16 justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold">{fiche.nom}</h1>
            </div>
            {((concours === '0' || concours==null) || (concours === '1' && equipe)) && (
            <button
              onClick={() => setIsFicheOptionsOpen(true)}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            )}
          </div>

          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('fiche')}
              className={`pb-4 relative ${
                activeTab === 'fiche'
                  ? 'text-black font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Fiche
              {activeTab === 'fiche' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('cartes')}
              className={`pb-4 relative ${
                activeTab === 'cartes'
                  ? 'text-black font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cartes mémo
              {activeTab === 'cartes' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'fiche' ? (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-blue-50 px-6 py-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {fiche.nom}
                </h3>
              </div>
              <div className="px-6 py-4">
                <div 
                  className="prose max-w-none fiche-content"
                  dangerouslySetInnerHTML={{ 
                    __html: fiche?.contenu ? cleanCardContent(fiche.contenu) : '' 
                  }}
                />
              </div>
            </div>
          </div>
        ) : renderCardsTab()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={hasQuiz ? () => router.push(`/matieres/${id}/fiches/${ficheId}/quiz`) : handleGenerateQuiz}
            disabled={isLoadingQuiz}
            className={`w-full py-4 px-6 bg-black text-white rounded-full font-medium transition-colors ${
              isLoadingQuiz ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-900'
            }`}
          >
            {isLoadingQuiz ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                <span>Génération du quiz en cours...</span>
              </div>
            ) : hasQuiz ? (
              'Accéder aux Quiz'
            ) : (
              'Générer mes Quiz'
            )}
          </button>
        </div>
      </div>

      <BottomSheet
        isOpen={isFicheOptionsOpen}
        onClose={() => setIsFicheOptionsOpen(false)}
        title="Options de la fiche"
      >
        <div className="px-4 space-y-4">
          <button
            onClick={handleEditFiche}
            className="w-full p-4 bg-gray-100 rounded-xl flex items-center text-left"
          >
            <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Modifier le nom</span>
          </button>
          
          <button
            onClick={handleDeleteFiche}
            className="w-full p-4 bg-red-50 rounded-xl flex items-center text-left text-red-600"
          >
            <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Supprimer la fiche</span>
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function ResultatPage() {
  const searchParams = useSearchParams();
  const threadId = searchParams?.get('threadId') ?? null;
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Références pour gérer le polling
  const pollingRef = useRef<boolean>(true);
  const attemptRef = useRef<number>(0);
  const MAX_ATTEMPTS = 3; // Limite de tentatives

  useEffect(() => {
    if (!threadId) return;
    
    const fetchContent = async () => {
      // Vérifier si on doit continuer le polling
      if (!pollingRef.current) {
        console.log('🛑 Polling arrêté');
        return;
      }
      
      // Incrémenter le compteur de tentatives
      attemptRef.current += 1;
      
      try {
        const response = await fetch(`/api/thread/${threadId}`);
        
        // Arrêter le polling en cas d'erreur HTTP
        if (!response.ok) {
          console.error(`❌ Erreur HTTP: ${response.status}`);
          setError(`Erreur lors de la récupération des données (${response.status})`);
          pollingRef.current = false;
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log('📊 Réponse API:', data.hasResponse, 'Status:', data.runStatus);
        
        // Vérifier si nous avons une réponse
        if (data.hasResponse && data.messages && data.messages.length > 0) {
          // Extraire le contenu du dernier message de l'assistant
          const assistantMessages = data.messages.filter((m: any) => m.role === 'assistant');
          if (assistantMessages.length > 0) {
            const lastMessage = assistantMessages[assistantMessages.length - 1];
            
            // Extraire le texte selon le format de l'API v2
            let messageText = '';
            if (Array.isArray(lastMessage.content)) {
              const textContent = lastMessage.content.find((part: any) => part.type === 'text');
              if (textContent && textContent.text) {
                messageText = textContent.text.value;
              }
            } else if (typeof lastMessage.content === 'string') {
              messageText = lastMessage.content;
            }
            
            if (messageText) {
              console.log('✅ Réponse trouvée!');
              setContent(messageText);
              pollingRef.current = false;
              setLoading(false);
              return;
            }
          }
        }
        
        // Vérifier si le status est terminal (autre que completed qui est géré au-dessus)
        if (['failed', 'cancelled', 'expired'].includes(data.runStatus)) {
          console.error(`❌ Run terminé avec statut: ${data.runStatus}`);
          setError(`L'analyse s'est terminée avec une erreur (${data.runStatus})`);
          pollingRef.current = false;
          setLoading(false);
          return;
        }
        
        // Vérifier si nous avons atteint le nombre maximum de tentatives
        if (attemptRef.current >= MAX_ATTEMPTS) {
          console.error('⏱️ Nombre maximum de tentatives atteint');
          setError("Délai d'attente dépassé pour l'analyse");
          pollingRef.current = false;
          setLoading(false);
          return;
        }
        
        // Continuer le polling
        setTimeout(fetchContent, 2000);
      } catch (error) {
        console.error('❌ Erreur:', error);
        setError('Une erreur est survenue lors de la communication avec le serveur');
        pollingRef.current = false;
        setLoading(false);
      }
    };

    fetchContent();
    
    // Nettoyage lors du démontage du composant
    return () => {
      pollingRef.current = false;
    };
  }, [threadId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F0FF] p-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="mt-4 text-center text-gray-500">
            Analyse en cours... (Tentative {attemptRef.current}/{MAX_ATTEMPTS})
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#F3F0FF] p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F0FF] p-4">
      <div className="max-w-2xl mx-auto">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h1: ({ node, ...props }) => (
              <h1 className="text-2xl font-bold mb-4" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-xl font-bold mb-3" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-lg font-bold mb-2" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="mb-4" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-5 mb-4" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-5 mb-4" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="mb-1" {...props} />
            ),
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse" {...props} />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th className="border border-gray-300 px-4 py-2 bg-gray-100" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="border border-gray-300 px-4 py-2" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
} 
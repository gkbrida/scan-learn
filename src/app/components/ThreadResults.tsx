'use client';

import { useState, useEffect, useRef } from 'react';

interface MessageContent {
  type: string;
  text?: {
    value: string;
    annotations?: any[];
  };
}

interface Message {
  id: string;
  role: string;
  content: MessageContent[] | string;
}

interface ThreadResultsProps {
  threadId: string;
}

export default function ThreadResults({ threadId }: ThreadResultsProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<string>('loading');
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<boolean>(true);
  const attemptRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_ATTEMPTS = 3; // 30 secondes avec un intervalle de 10 secondes

  useEffect(() => {
    const pollThread = async () => {
      try {
        const response = await fetch(`/api/thread/${threadId}`);
        
        // Incrémenter le compteur de tentatives avant la vérification de la réponse
        attemptRef.current++;
        console.log(`📊 Tentative ${attemptRef.current}/${MAX_ATTEMPTS}`);

        // Vérifier le nombre de tentatives avant de continuer
        if (attemptRef.current >= MAX_ATTEMPTS) {
          console.log('⚠️ Nombre maximum de tentatives atteint');
          pollingRef.current = false;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setError('Le temps d\'analyse maximum a été atteint. Veuillez réessayer.');
          return;
        }

        // Gestion spécifique des erreurs HTTP
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erreur serveur' }));
          console.error(`❌ Erreur API (${response.status}):`, errorData.error);
          
          // En cas d'erreur 500, on arrête immédiatement
          if (response.status === 500) {
            pollingRef.current = false;
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setError(errorData.error || 'Une erreur serveur est survenue. Veuillez réessayer.');
            return;
          }
          
          setError(errorData.error || 'Erreur lors de la récupération des messages');
          return;
        }

        const data = await response.json();

        // Mettre à jour les messages et le statut
        if (data.messages) {
          setMessages(data.messages);
        }
        
        if (data.runStatus) {
          setStatus(data.runStatus);
          console.log(`📊 Statut du run: ${data.runStatus}`);

          // Arrêter immédiatement si le run a échoué
          if (data.runStatus === 'failed') {
            console.log('🛑 Arrêt du polling : Run failed');
            pollingRef.current = false;
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setError('L\'analyse du document a échoué. Veuillez réessayer.');
            return;
          }
        }

        // Arrêter le polling dans ces cas
        const shouldStopPolling = 
          data.hasResponse || // On a une réponse
          ['completed', 'cancelled', 'expired'].includes(data.runStatus); // Statut final

        if (shouldStopPolling) {
          console.log(`🛑 Arrêt du polling : ${data.hasResponse ? 'Réponse reçue' : `Run ${data.runStatus}`}`);
          pollingRef.current = false;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Afficher un message d'erreur approprié si nécessaire
          if (data.runStatus === 'cancelled') {
            setError('L\'analyse du document a été annulée.');
          } else if (data.runStatus === 'expired') {
            setError('L\'analyse a expiré. Veuillez réessayer.');
          }
        }

      } catch (err: any) {
        console.error('❌ Erreur de polling:', err);
        // En cas d'erreur réseau, on arrête aussi le polling
        pollingRef.current = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setError('Erreur de connexion. Veuillez vérifier votre connexion et réessayer.');
      }
    };

    // Réinitialiser les compteurs au démarrage
    pollingRef.current = true;
    attemptRef.current = 0;

    // Premier appel immédiat
    pollThread();

    // Démarrer le polling
    intervalRef.current = setInterval(() => {
      if (pollingRef.current) {
        pollThread();
      } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 10000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      pollingRef.current = false;
    };
  }, [threadId]);

  // Fonction pour obtenir le message de statut
  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Analyse terminée';
      case 'failed':
        return 'Analyse échouée';
      case 'cancelled':
        return 'Analyse annulée';
      case 'expired':
        return 'Analyse expirée';
      default:
        return 'Analyse en cours...';
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
      case 'cancelled':
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="mt-8 space-y-4">
      {/* Panneau de statut */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Statut : </span>
            <span className={getStatusColor(status)}>
              {getStatusMessage(status)}
            </span>
          </div>
          {attemptRef.current > 0 && (
            <div className="text-sm text-gray-500">
              Tentative {attemptRef.current}/{MAX_ATTEMPTS}
            </div>
          )}
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Liste des messages */}
      <div className="space-y-4">
        {messages.map((message) => {
          // Extraire le contenu du message
          let content = '';
          
          if (typeof message.content === 'string') {
            content = message.content;
          } else if (Array.isArray(message.content) && message.content.length > 0) {
            // Pour les messages de l'API v2
            const textContent = message.content.find(part => part.type === 'text');
            if (textContent && textContent.text) {
              content = textContent.text.value;
            }
          }

          console.log(`Message de ${message.role}:`, content ? content.substring(0, 50) + '...' : 'Contenu vide');
          
          return (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.role === 'assistant'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-gray-50 text-gray-700'
              }`}
            >
              {content || "(Message vide)"}
            </div>
          );
        })}
      </div>

      {/* Message de chargement */}
      {status !== 'completed' && !error && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Analyse en cours...</span>
        </div>
      )}
    </div>
  );
} 
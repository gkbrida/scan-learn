'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ThreadResults from '@/app/components/ThreadResults';

export default function ResultatPage() {
  const params = useParams();
  const router = useRouter();
  
  const id = params?.id as string;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollingRef = useRef<boolean>(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptRef = useRef<number>(0);
  const MAX_ATTEMPTS = 3;
  const INITIAL_DELAY = 2000; // Délai initial de 2 secondes
  const MAX_DELAY = 10000; // Délai maximum de 10 secondes

  // Fonction pour arrêter proprement le polling
  const stopPolling = () => {
    console.log('🛑 Arrêt du polling');
    pollingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
  };

  // Fonction pour calculer le délai exponentiel
  const getBackoffDelay = (attempt: number) => {
    return Math.min(INITIAL_DELAY * Math.pow(2, attempt), MAX_DELAY);
  };

  useEffect(() => {
    const fetchContent = async () => {
      // Vérifier si le polling est toujours actif
      if (!pollingRef.current) {
        console.log('⚠️ Polling déjà arrêté');
        return;
      }

      try {
        // Incrémenter le compteur de tentatives
        attemptRef.current++;
        const currentAttempt = attemptRef.current;
        console.log(`📊 Tentative ${currentAttempt}/${MAX_ATTEMPTS}`);

        // Vérifier le nombre maximum de tentatives
        if (currentAttempt >= MAX_ATTEMPTS) {
          console.log('⚠️ Nombre maximum de tentatives atteint');
          stopPolling();
          setError('Le temps d\'analyse maximum a été atteint. Veuillez réessayer.');
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 secondes

        try {
          const response = await fetch(`/api/thread/${id}`, {
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          // Vérifier si le polling n'a pas été arrêté pendant la requête
          if (!pollingRef.current) {
            console.log('⚠️ Polling arrêté pendant la requête');
            return;
          }

          // En cas d'erreur 500 ou timeout
          if (response.status === 500) {
            console.error('❌ Erreur serveur 500');
            const delay = getBackoffDelay(currentAttempt - 1);
            console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative`);
            
            if (currentAttempt < MAX_ATTEMPTS) {
              timeoutRef.current = setTimeout(fetchContent, delay);
              return;
            } else {
              stopPolling();
              setError('Le serveur rencontre des difficultés. Veuillez réessayer plus tard.');
              return;
            }
          }

          // Pour les autres erreurs, on essaie de récupérer le message d'erreur
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
            console.error(`❌ Erreur API (${response.status}):`, errorData.error);
            throw new Error(errorData.error || 'Erreur lors de la récupération des données');
          }

          // Récupérer les données de la réponse
          let data;
          try {
            data = await response.json();
          } catch (err) {
            console.error('❌ Erreur de parsing JSON:', err);
            stopPolling();
            setError('Erreur lors de la lecture des données');
            return;
          }

          // Vérifier à nouveau si le polling n'a pas été arrêté
          if (!pollingRef.current) {
            console.log('⚠️ Polling arrêté pendant le traitement');
            return;
          }

          // Réinitialiser le compteur de tentatives si la requête a réussi
          attemptRef.current = 0;

          // Vérifier si on doit continuer le polling
          if (data.runStatus === 'failed' || data.runStatus === 'completed' || 
              data.runStatus === 'cancelled' || data.runStatus === 'expired') {
            console.log(`🛑 Arrêt du polling : ${data.runStatus}`);
            stopPolling();
            
            if (data.runStatus === 'failed') {
              setError('L\'analyse du document a échoué. Veuillez réessayer.');
            } else if (data.runStatus === 'cancelled') {
              setError('L\'analyse du document a été annulée.');
            } else if (data.runStatus === 'expired') {
              setError('L\'analyse a expiré. Veuillez réessayer.');
            }
            return;
          }

          // Continuer le polling si nécessaire et toujours actif
          if (pollingRef.current) {
            const nextDelay = INITIAL_DELAY; // Revenir au délai initial pour les requêtes réussies
            timeoutRef.current = setTimeout(fetchContent, nextDelay);
          }

        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.error('⏱️ Timeout de la requête');
            const delay = getBackoffDelay(currentAttempt - 1);
            if (currentAttempt < MAX_ATTEMPTS) {
              timeoutRef.current = setTimeout(fetchContent, delay);
              return;
            }
            stopPolling();
            setError('Le serveur met trop de temps à répondre. Veuillez réessayer.');
            return;
          }
          throw fetchError;
        }

      } catch (err: any) {
        console.error('❌ Erreur:', err);
        stopPolling();
        setError(err.message || 'Une erreur est survenue');
      }
    };

    // Réinitialiser l'état
    console.log('🔄 Démarrage du polling');
    pollingRef.current = true;
    attemptRef.current = 0;
    timeoutRef.current = null;

    // Premier appel avec un délai initial
    timeoutRef.current = setTimeout(fetchContent, INITIAL_DELAY);

    // Cleanup
    return () => {
      stopPolling();
    };
  }, [id]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">
            Analyse en cours... (Tentative {attemptRef.current}/{MAX_ATTEMPTS})
          </span>
        </div>
      ) : (
        <ThreadResults threadId={id} />
      )}
    </div>
  );
} 
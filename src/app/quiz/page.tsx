'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import BottomNav from '../components/BottomNav';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Question {
  id: string;
  question: string;
  options: {
    [key: string]: string;
  };
  reponse: string;
  fiche_id: string;
}

export default function AllQuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('❌ Aucun utilisateur connecté');
          return;
        }

        // Récupérer tous les quiz de l'utilisateur
        const { data, error } = await supabase
          .from('qcm')
          .select('*')
          .eq('user_id', user.id); 

        if (error) {
          console.error('❌ Erreur lors de la récupération des questions:', error);
          return;
        }

        setQuestions(data || []);
      } catch (error) {
        console.error('❌ Erreur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswerSelect = async (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);

    const currentQuestion = questions[currentQuestionIndex];
    
    if (answer === currentQuestion.reponse) {
      try {
        const { error } = await supabase
          .from('qcm')
          .update({ resultat: 1 })
          .eq('id', currentQuestion.id);

        if (error) {
          console.error('❌ Erreur lors de la mise à jour du résultat:', error);
        }
      } catch (error) {
        console.error('❌ Erreur inattendue:', error);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="max-w-xl mx-auto px-4">
            <div className="flex items-center h-16">
              <h1 className="text-xl font-semibold">Flash Quiz</h1>
            </div>
          </div>
        </div>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <p className="text-lg text-black">Aucune question à réviser</p>
        </div> 
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-xl mx-auto px-4">
          <div className="flex items-center h-16">
            <h1 className="text-xl font-semibold">Flash Quiz</h1>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-xl mx-auto px-4 py-6 mb-16 pb-16">
        <div className="text-right mb-4">
          Question {currentQuestionIndex + 1}/{questions.length}
        </div>

        <div className="bg-purple-100 rounded-3xl p-6 mb-18">
          <h2 className="text-xl font-semibold mb-6">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleAnswerSelect(key)}
                className={`w-full text-left p-4 rounded-xl border ${
                  !isAnswered
                    ? 'bg-white border-gray-200 hover:border-gray-300'
                    : isAnswered && key === currentQuestion.reponse
                    ? 'bg-white border-green-500'
                    : isAnswered && key === selectedAnswer
                    ? 'bg-white border-red-500'
                    : 'bg-white border-gray-200'
                } transition-colors relative`}
                disabled={isAnswered}
              >
                {value}
                {isAnswered && key === selectedAnswer && key !== currentQuestion.reponse && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                )}
                {isAnswered && key === currentQuestion.reponse && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2">
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 mb-16">
          <div className="max-w-xl mx-auto">
            <button
              onClick={handleNextQuestion}
              disabled={!isAnswered}
              className={`w-full py-4 px-6 bg-black text-white rounded-full font-medium transition-colors ${
                !isAnswered ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-900'
              }`}
            >
              Question suivante
            </button>
          </div>
        </div>
      </div>
      <div className='fixed bottom-0 left-0 right-0'>
        <BottomNav />
      </div>
    </div>
  );
} 
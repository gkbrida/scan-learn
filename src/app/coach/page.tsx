'use client';

import { useRouter } from 'next/navigation';

export default function CoachPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-xl mx-auto px-4">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold">Coach</h1>
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-purple-100 rounded-3xl p-8 text-center">
          <svg 
            className="w-16 h-16 mx-auto mb-6 text-purple-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
            />
          </svg>
          <h2 className="text-2xl font-semibold mb-4">
            Bientôt votre coach vous aidera à réviser pour vos concours et examens
          </h2>
          <p className="text-gray-600">
            Nous travaillons pour vous offrir la meilleure expérience d'apprentissage possible.
          </p>
        </div>
      </div>
    </div>
  );
} 
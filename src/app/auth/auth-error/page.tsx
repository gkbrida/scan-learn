'use client';

import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold mb-6">
          Erreur d'authentification
        </h1>
        
        <p className="text-gray-600 mb-8">
          Une erreur s'est produite lors de l'authentification. 
          Veuillez réessayer ou contacter le support si le problème persiste.
        </p>

        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="inline-block w-full py-3 px-4 bg-gray-200 text-black rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            Retour à la connexion
          </Link>

          <Link
            href="/"
            className="inline-block w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
} 
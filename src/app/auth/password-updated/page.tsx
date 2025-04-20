'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PasswordUpdatedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <svg
            className="mx-auto h-16 w-16 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold mb-6">
          Mot de passe mis à jour !
        </h1>
        
        <p className="text-gray-600 mb-8">
          Ton mot de passe a été modifié avec succès. Tu peux maintenant te connecter avec ton nouveau mot de passe.
        </p>

        <Link
          href="/auth/login"
          className="inline-block w-full py-3 px-4 bg-gray-200 text-black rounded-xl font-medium hover:bg-gray-300 transition-colors"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
} 
'use client';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="mb-8">
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">
          Vérifie ton email
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Nous t'avons envoyé un email de confirmation.
          Clique sur le lien dans l'email pour activer ton compte.
        </p>
        
        <p className="text-base text-gray-500">
          N'oublie pas de vérifier tes spams si tu ne trouves pas l'email.
        </p>

        <div className="mt-12">
          <a
            href="/auth/login"
            className="text-base font-medium text-gray-700 hover:text-gray-900"
          >
            Retourner à la page de connexion
          </a>
        </div>
      </div>
    </div>
  );
} 
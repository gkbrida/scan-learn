import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import LoginButton from './LoginButton';

export default async function LoginPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Connexion à votre compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous pour accéder à vos fiches et quiz
          </p>
        </div>

        <div className="mt-8">
          <LoginButton />
        </div>
      </div>
    </div>
  );
} 
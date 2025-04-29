'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import { toast } from 'sonner';

interface UserProfile {
  prenom: string;
  niveau_etudes: string;
  cursus: string;
  classe_actuelle: string;
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfilPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    prenom: '',
    niveau_etudes: '',
    cursus: '',
    classe_actuelle: ''
  });
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Récupérer l'utilisateur connecté
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Définir l'email
        setEmail(user.email || '');

        // Récupérer les informations depuis info_users
        const { data: userInfo, error: infoError } = await supabase
          .from('info_users')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (infoError) throw infoError;

        if (userInfo) {
          setUserProfile({
            prenom: userInfo.prenom || '',
            niveau_etudes: userInfo.niveau_etude || '',
            cursus: userInfo.cursus || '',
            classe_actuelle: userInfo.classe_actuelle || ''
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        router.push('/auth/login');
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/auth/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          router.push('/auth/login');
          return;
        }
        const {error} = await supabase.from('info_users').delete().eq('user_id', user.id);
        if (error) throw error;
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
        if (authError) throw authError;
        router.push('/auth/login');
      } catch (error) {
        toast.error('Erreur lors de la suppression du compte:');
        console.error('Erreur lors de la suppression du compte:', error);
      }
    }
  };

  return (
    <main>
    <div className="min-h-screen bg-[#F3F0FF] p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="bg-[#F3F0FF]">
          <h1 className="text-[40px] font-bold">Hello {userProfile.prenom}!</h1>
          <div className="flex items-center gap-2 text-[17px] mt-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7Zm8-1v2m-4 3h8m-8 3h8m-8 3h8" />
            </svg>
            <span>Niveau : {userProfile.niveau_etudes}, {userProfile.classe_actuelle}</span>
          </div>
        </div>

        {/* Infos personnelles */}
        <div>
          <h2 className="text-[13px] font-medium text-gray-500 uppercase mb-4">INFOS PERSONNELLES</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/profil/modifier-prenom')}
              className="w-full bg-white rounded-2xl p-4 flex justify-between items-center"
            >
              <div className="flex-1 text-left">
                <div className="text-[17px] font-medium">Prénom</div>
                <div className="text-[17px] text-gray-500">{userProfile.prenom}</div>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/profil/modifier-etudes')}
              className="w-full bg-white rounded-2xl p-4 flex justify-between items-center"
            >
              <div className="flex-1 text-left">
                <div className="text-[17px] font-medium">Niveau d'études</div>
                <div className="text-[17px] text-gray-500">{userProfile.niveau_etudes}</div>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/profil/modifier-cursus')}
              className="w-full bg-white rounded-2xl p-4 flex justify-between items-center"
            >
              <div className="flex-1 text-left">
                <div className="text-[17px] font-medium">Cursus</div>
                <div className="text-[17px] text-gray-500">{userProfile.cursus}</div>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/profil/modifier-classe')}
              className="w-full bg-white rounded-2xl p-4 flex justify-between items-center"
            >
              <div className="flex-1 text-left">
                <div className="text-[17px] font-medium">Classe actuelle</div>
                <div className="text-[17px] text-gray-500">{userProfile.classe_actuelle}</div>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Connexion */}
        <div>
          <h2 className="text-[13px] font-medium text-gray-500 uppercase mb-4">CONNEXION</h2>
          <div className="space-y-3">
            <div className="w-full bg-white rounded-2xl p-4">
              <div className="text-[17px] font-medium">Email</div>
              <div className="text-[17px] text-gray-500">{email}</div>
            </div>

            <button
              onClick={() => router.push('/profil/modifier-password')}
              className="w-full bg-white rounded-2xl p-4 flex justify-between items-center"
            >
              <div className="flex-1 text-left">
                <div className="text-[17px] font-medium">Mot de passe</div>
                <div className="text-[17px] text-gray-500">*********</div>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button 
              onClick={handleLogout}
              className="w-full bg-white rounded-2xl p-4"
            >
              <div className="text-[17px] font-medium">Me déconnecter</div>
            </button>

            <button 
              onClick={handleDeleteAccount}
              className="w-full bg-white rounded-2xl p-4"
            >
              <div className="text-[17px] font-medium text-[#FF6B6B]">Supprimer mon compte</div>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div className='fixed bottom-0 left-0 right-0'>
    <BottomNav />
  </div>
  </main>
  );
} 
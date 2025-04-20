'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function ModifierNiveauPage() {
  const [niveau, setNiveau] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchNiveau = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('niveau_etudes')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ Erreur lors de la récupération du niveau:', error);
          toast.error('Erreur lors de la récupération du niveau');
          return;
        }

        if (data?.niveau_etudes) {
          setNiveau(data.niveau_etudes);
        }
      } catch (err) {
        console.error('❌ Erreur:', err);
        toast.error('Une erreur est survenue');
      }
    };

    fetchNiveau();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ niveau_etudes: niveau })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Erreur lors de la mise à jour du niveau:', error);
        toast.error('Erreur lors de la mise à jour du niveau');
        return;
      }

      toast.success('Niveau d\'études mis à jour avec succès');
      router.push('/profil');
    } catch (err) {
      console.error('❌ Erreur:', err);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push('/profil')}
      >
        ← Retour
      </Button>

      <h1 className="text-2xl font-bold mb-6">Modifier le niveau d'études</h1>

      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="mb-4">
          <label htmlFor="niveau" className="block text-sm font-medium mb-2">
            Niveau d'études
          </label>
          <select
            id="niveau"
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">Sélectionnez un niveau</option>
            <option value="college">Collège</option>
            <option value="lycee">Lycée</option>
            <option value="licence">Licence</option>
            <option value="master">Master</option>
            <option value="doctorat">Doctorat</option>
          </select>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </form>
    </div>
  );
} 
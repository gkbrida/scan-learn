'use client';

import { useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import LanguageSelector from '@/app/components/LanguageSelector';
import SizeSelector from '@/app/components/SizeSelector';
import { FormEvent } from 'react';

function PDFPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams?.get('mode') || 'cours';
  const file = searchParams?.get('file');
  
  const id = params?.id as string;
  const [language, setLanguage] = useState('fr');
  const [size, setSize] = useState('moyenne');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ficheName, setFicheName] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !ficheName) {
      setError('Veuillez saisir un nom pour votre document');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    formData.append('size', size);

    try {
      console.log('📤 Envoi du fichier:', {
        fileName: ficheName,
        language,
        size
      });

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorMessage;
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`;
        } else {
          errorMessage = await response.text();
        }
        console.error('❌ Erreur API:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          error: errorMessage
        });
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }

      const data = await response.json();
      console.log('✅ Fichier envoyé avec succès:', data);
      router.push(`/resultat/${data.threadId}?ficheName=${encodeURIComponent(ficheName)}`);
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'envoi:', err);
      const errorMessage = err.message;
      try {
        const parsedError = JSON.parse(errorMessage);
        setError(parsedError.error || 'Une erreur est survenue lors du téléchargement');
      } catch {
        setError(errorMessage || 'Une erreur est survenue lors du téléchargement');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'cours' ? 'Importer un cours' : 'Créer une fiche de révision'}
          </h1>
          <p className="text-gray-600">
            {mode === 'cours' 
              ? 'Importez votre cours au format PDF pour le transformer en fiches de révision' 
              : 'Créez une nouvelle fiche de révision à partir d\'un document PDF'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="ficheName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom du document
              </label>
              <input
                type="text"
                id="ficheName"
                value={ficheName}
                onChange={(e) => setFicheName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Entrez le nom de votre document"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue de sortie
                </label>
                <LanguageSelector 
                  selectedLanguage={language}
                  onLanguageSelect={setLanguage}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taille de la fiche
                </label>
                <SizeSelector 
                  selectedSize={size}
                  onSizeSelect={setSize}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading || !file || !ficheName}
                className={`px-6 py-3 text-white rounded-md transition-colors ${
                  uploading || !file || !ficheName
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {uploading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Traitement en cours...
                  </div>
                ) : (
                  'Analyser le document'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PDFPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    }>
      <PDFPageContent />
    </Suspense>
  );
} 
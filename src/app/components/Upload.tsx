"use client";

import { useState } from 'react';
import ThreadResults from './ThreadResults';

interface UploadProps {
  onSuccess: (threadId: string) => void;
}

export default function Upload({ onSuccess }: UploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('français');
  const [size, setSize] = useState('court');
  const [niveauEtude, setNiveauEtude] = useState('lycée');
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setError(null);
    setIsUploading(true);
    setThreadId(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      formData.append('size', size);
      formData.append('niveauEtude', niveauEtude);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Une erreur est survenue');
      }

      const data = await response.json();
      setThreadId(data.threadId);
      onSuccess(data.threadId);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fichier PDF
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Langue
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            disabled={isUploading}
          >
            <option value="français">Français</option>
            <option value="anglais">Anglais</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Taille de la fiche
          </label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            disabled={isUploading}
          >
            <option value="court">Courte</option>
            <option value="moyen">Moyenne</option>
            <option value="long">Longue</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Niveau d'études
          </label>
          <select
            value={niveauEtude}
            onChange={(e) => setNiveauEtude(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            disabled={isUploading}
          >
            <option value="collège">Collège</option>
            <option value="lycée">Lycée</option>
            <option value="licence">Licence</option>
            <option value="master">Master</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
          disabled={isUploading || !file}
        >
          {isUploading ? 'Envoi en cours...' : 'Analyser'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {threadId && <ThreadResults threadId={threadId} />}
    </div>
  );
} 
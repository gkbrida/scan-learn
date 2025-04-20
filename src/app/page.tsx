"use client";

import { useRouter } from "next/navigation";
import Upload from "@/app/components/Upload";

export default function Home() {
  const router = useRouter();

  const handleAnalysisSuccess = (threadId: string) => {
    router.push(`/results/${threadId}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Analyse de Documents avec IA
          </h1>
          <p className="text-lg text-gray-600">
            Téléchargez votre document PDF pour obtenir une synthèse structurée et pédagogique
          </p>
        </div>

        <Upload onSuccess={handleAnalysisSuccess} />
      </div>
    </main>
  );
}

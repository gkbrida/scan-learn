"use client";

import { useRouter } from "next/navigation";
import Upload from "@/app/components/Upload";
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  const handleAnalysisSuccess = (threadId: string) => {
    router.push(`/results/${threadId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Transformez vos documents en outils d'apprentissage interactifs en un clic !
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Optimisez votre préparation aux examens avec notre plateforme d'apprentissage intelligente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4">
                <Link href="/auth/register" className="w-full sm:w-auto text-center bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors">
                  Créer un compte
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto text-center bg-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-400 transition-colors border border-blue-400">
                  Se connecter
                </Link>
              </div>
            </div>
            <div className="relative h-96 hidden md:block">
              <Image
                src="/hero-image.png"
                alt="Étudiant utilisant l'application"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Fonctionnalités */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
            Nos Fonctionnalités Principales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto mb-6 text-blue-600">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">Transformation de Documents</h3>
                <p className="text-gray-600">
                  Importez vos PDF et images pour créer instantanément des fiches d'étude interactives.
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto mb-6 text-blue-600">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">Base de Données Riche</h3>
                <p className="text-gray-600">
                  Accédez à une vaste collection de sujets d'examens et de concours officiels.
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto mb-6 text-blue-600">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">Apprentissage Optimisé</h3>
                <p className="text-gray-600">
                  Révisez efficacement avec des cartes mémo et des QCM adaptés à votre niveau.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Avantages */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
            Pourquoi Choisir Notre Plateforme ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Résultats Prouvés</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    90%
                  </div>
                  <p className="text-gray-600">
                    de nos utilisateurs réussissent leurs examens
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    50%
                  </div>
                  <p className="text-gray-600">
                    de temps gagné dans la préparation
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-6">Témoignages</h3>
              <div className="space-y-6">
                <blockquote className="bg-gray-50 p-6 rounded-xl">
                  <p className="text-gray-600 mb-4">
                    "Cette plateforme a révolutionné ma façon de réviser. J'ai réussi mon concours du premier coup !"
                  </p>
                  <footer className="font-medium">
                    - Marie L., Étudiante en médecine
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Matières */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
            Nos Matières et Concours
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold">Médecine</h3>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold">Droit</h3>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold">Ingénierie</h3>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold">Commerce</h3>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link href="/auth/register" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-500 transition-colors">
              Explorer nos ressources
            </Link>
          </div>
        </div>
      </div>

      {/* Section CTA */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Prêt à Révolutionner Votre Façon d'Apprendre ?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Rejoignez des milliers d'étudiants qui ont déjà transformé leur façon d'étudier avec notre plateforme.
          </p>
          <div className="space-x-4">
            <Link href="/auth/register" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors">
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">À propos</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">Notre histoire</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">L'équipe</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Carrières</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">Centre d'aide</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contactez-nous</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Légal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">Confidentialité</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">CGU</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Suivez-nous</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p>&copy; 2024 Scan Learn. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

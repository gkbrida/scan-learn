'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="flex justify-around items-center h-16 px-2">
        {/* Mes fiches */}
        <Link 
          href="/dashboard"
          className={`flex flex-col items-center ${pathname === '/dashboard' ? 'text-black' : 'text-gray-400'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="text-[10px] mt-0.5">Mes matières</span>
        </Link>

        {/* Flash Quiz */}
        <Link 
          href="/quiz"
          className={`flex flex-col items-center ${pathname === '/quiz' ? 'text-black' : 'text-gray-400'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-[10px] mt-0.5">Flash Quiz</span>
        </Link>

        {/* Coach */}
        <Link 
          href="/coach"
          className={`flex flex-col items-center ${pathname === '/coach' ? 'text-black' : 'text-gray-400'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="text-[10px] mt-0.5">Coach</span>
        </Link>

        {/* Profil */}
        <Link 
          href="/profil"
          className={`flex flex-col items-center ${pathname === '/profil' ? 'text-black' : 'text-gray-400'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] mt-0.5">Profil</span>
        </Link>
      </div>
    </nav>
  );
} 
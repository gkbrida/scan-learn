'use client';

import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
export default function CoachPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-xl mx-auto px-4">
          <div className="flex items-center h-16">
            <h1 className="text-xl font-semibold">Coach</h1>
          </div>
        </div>
      </div>

      {/* Section On s'exerce ensemble */}
      <div className="max-w-xl mx-auto px-4 mt-8">
        <h2 className="text-2xl font-bold mb-6">On s'exerce ensemble&nbsp;?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Carte concours et examens */}
        <div
          className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl p-6 flex flex-col justify-between shadow-sm cursor-pointer hover:shadow-md transition"
          onClick={() => router.push('/concours')}
        >
          <div className="flex-1 flex flex-col items-start">
            <div className="flex items-center mb-4">
              <svg className="w-12 h-12 text-blue-400 mr-2" fill="none" viewBox="0 0 48 48" stroke="currentColor">
                <rect x="8" y="12" width="32" height="24" rx="4" fill="#e0e7ff" />
                <path d="M16 20h16M16 26h10" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
                <path d="M36 36l-4-4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
                <circle cx="36" cy="36" r="2" fill="#60a5fa" />
              </svg>
            </div>
            <div className="mt-2">
              <div className="text-lg font-semibold mb-1">Concours et examens</div>
              <div className="text-gray-600 text-sm">Je vous aide à réviser pour vos concours et examens</div>
            </div>
          </div>
        </div>

          {/* Carte Devoir de maths */}
          <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex-1 flex flex-col items-start">
              <div className="flex items-center mb-2">
                <span className="text-[28px] font-mono text-orange-500 mr-2">2x + 3y = 11</span>
              </div>
              <div className="flex items-center mb-2">
                <span className="text-[20px] font-mono text-orange-400">x - y = 1</span>
                <span className="ml-2 bg-white rounded-full px-2 py-0.5 text-[15px] font-bold text-pink-500 shadow">100</span>
              </div>
              <div className="mt-4">
                <div className="text-lg font-semibold mb-1">Devoir de maths</div>
                <div className="text-gray-600 text-sm">Je t'aide à comprendre ton exercice de maths</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      
      <div className='fixed bottom-0 left-0 right-0'>
        <BottomNav />
      </div>
    </div>
  );
} 
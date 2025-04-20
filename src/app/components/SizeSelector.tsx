'use client';

import { useState } from 'react';
import BottomSheet from './BottomSheet';

interface Size {
  id: string;
  name: string;
  description: string;
}

const SIZES: Size[] = [
  { 
    id: 'petite',
    name: 'Petite (essentiel)',
    description: 'Résumé ultra-concis pour aller à l\'essentiel'
  },
  {
    id: 'moyenne',
    name: 'Moyenne (équilibrée)',
    description: 'Juste milieu entre concision et détail'
  },
  {
    id: 'grande',
    name: 'Grande (complète)',
    description: 'Une fiche complète pour bien approfondir'
  }
];

interface SizeSelectorProps {
  selectedSize: string;
  onSizeSelect: (size: string) => void;
}

export default function SizeSelector({ selectedSize, onSizeSelect }: SizeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = SIZES.find(s => s.id === selectedSize) || SIZES[1];
  
  return (
    <>
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        type="button"
        className="w-full h-[52px] px-4 bg-white rounded-[20px] text-[17px] text-left flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
      >
        <span>Taille de la fiche</span>
        <div className="flex items-center gap-3">
          <span>{selected.name.split(' ')[0]}</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Taille de la fiche"
      >
        <div className="space-y-2">
          {SIZES.map((size) => {
            const isSelected = selectedSize === size.id;            
            return (
              <button
                key={size.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSizeSelect(size.id);
                  setIsOpen(false);
                }}
                className={`relative w-full p-4 rounded-[20px] flex flex-col items-start gap-1 text-left ${
                  isSelected ? 'bg-white border-2 border-black' : 'bg-white'
                }`}
              >
                <span className="text-[17px] font-normal">{size.name}</span>
                <span className="text-[15px] text-gray-500">{size.description}</span>
                {isSelected && (
                  <svg 
                    className="w-6 h-6 absolute right-4 top-1/2 -translate-y-1/2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
} 
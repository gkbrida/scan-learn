'use client';

import { useState } from 'react';
import BottomSheet from './BottomSheet';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'FR', name: 'French', flag: '🇫🇷' },
  { code: 'EN', name: 'English', flag: '🇺🇸' },
  { code: 'ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'NL', name: 'Dutch', flag: '🇳🇱' },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageSelect: (code: string) => void;
}

export default function LanguageSelector({ selectedLanguage, onLanguageSelect }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLang = LANGUAGES.find(lang => lang.code.toLowerCase() === selectedLanguage) || LANGUAGES[0];

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
        <span>Langage de la fiche</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span>{selectedLang.flag}</span>
            <span>{selectedLang.code}</span>
          </div>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Langage de la fiche"
      >
        <div className="space-y-2">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLanguageSelect(language.code.toLowerCase());
                setIsOpen(false);
              }}
              className={`w-full p-4 rounded-[20px] flex items-center gap-3 text-[17px] ${
                selectedLanguage === language.code.toLowerCase()
                  ? 'bg-white border-2 border-black' 
                  : 'bg-white'
              }`}
            >
              <span className="text-xl">{language.flag}</span>
              <span>{language.name}</span>
              {selectedLanguage === language.code.toLowerCase() && (
                <svg className="w-6 h-6 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
} 
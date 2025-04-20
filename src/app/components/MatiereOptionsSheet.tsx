'use client';

import { useState } from 'react';
import BottomSheet from './BottomSheet';

interface MatiereOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MatiereOptionsSheet({
  isOpen,
  onClose,
  onEdit,
  onDelete
}: MatiereOptionsSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Options de la matière">
      <div className="px-4 pb-8 space-y-3">
        {/* Option Modifier */}
        <button 
          onClick={onEdit}
          className="w-full bg-[#F6F4F0] rounded-[20px] p-4 flex items-center gap-3 text-left"
        >
          <div className="shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <span className="text-[17px]">Modifier la matière</span>
        </button>

        {/* Option Supprimer */}
        <button 
          onClick={onDelete}
          className="w-full bg-[#F6F4F0] rounded-[20px] p-4 flex items-center gap-3 text-left text-[#FF3B30]"
        >
          <div className="shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <span className="text-[17px]">Supprimer</span>
        </button>
      </div>
    </BottomSheet>
  );
} 
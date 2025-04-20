'use client';

import { useEffect, useRef } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30"
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[20px] transform transition-transform duration-300 ease-out"
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div className="pt-2 pb-4">
          <div className="w-8 h-1 bg-[#D1D1D6] rounded-full mx-auto mb-4" />
          {title && (
            <h2 className="text-[22px] font-semibold text-center mb-6">
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </div>
  );
} 
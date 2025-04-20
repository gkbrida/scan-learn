interface CreateSheetOptionsProps {
  onOptionSelect: (option: string) => void;
}

export default function CreateSheetOptions({ onOptionSelect }: CreateSheetOptionsProps) {
  const options = [
    {
      id: 'scan',
      title: 'Avec ta fiche',
      description: 'Transforme ta fiche de révision en numérique',
      icon: (
        <svg className="w-6 h-6 md:w-8 md:h-8 text-[#B4A7D6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'cours',
      title: 'Avec tes cours',
      description: 'Transforme tes cours en une fiche de révision',
      icon: (
        <svg className="w-6 h-6 md:w-8 md:h-8 text-[#93C47D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: 'ia',
      title: 'Générer par l\'IA',
      description: 'Décris ton sujet et obtiens ta fiche !',
      icon: (
        <svg className="w-6 h-6 md:w-8 md:h-8 text-[#FFD966]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'manual',
      title: 'Rédiger',
      description: 'Écris ta fiche en partant de 0',
      icon: (
        <svg className="w-6 h-6 md:w-8 md:h-8 text-[#F4B4CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onOptionSelect(option.id)}
          className="bg-white rounded-3xl p-4 md:p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#F3F0FF] flex items-center justify-center mb-3 md:mb-4">
            {option.icon}
          </div>
          <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">{option.title}</h3>
          <p className="text-xs md:text-sm text-gray-500">{option.description}</p>
        </button>
      ))}
    </div>
  );
} 
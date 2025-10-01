import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallback: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ fallback }) => {
  const handleBack = () => {
    // Tenta usar history.back(), com fallback para a função fornecida
    if (window.history.length > 1) {
      window.history.back();
    } else {
      fallback();
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center justify-center p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      aria-label="Voltar para a página anterior"
    >
      <ArrowLeft className="w-5 h-5 text-gray-700" />
    </button>
  );
};

export default BackButton;
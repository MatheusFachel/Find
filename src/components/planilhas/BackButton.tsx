import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallback: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ fallback }) => {
  const handleBack = () => {
    // Agora sempre usamos a função fornecida diretamente para garantir o funcionamento
    fallback();
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
      aria-label="Voltar para o Dashboard"
      type="button"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="text-sm font-medium">Voltar ao Dashboard</span>
    </button>
  );
};

export default BackButton;
import React from 'react';
import { TrendingUp, DollarSign, CreditCard, FileSpreadsheet } from 'lucide-react';

interface CreateButtonsProps {
  onCreateInvestments: () => void;
  onCreateExpenses: () => void;
  onCreateIncome: () => void;
}

const CreateButtons: React.FC<CreateButtonsProps> = ({
  onCreateInvestments,
  onCreateExpenses,
  onCreateIncome
}) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {/* Botão Investimentos */}
      <button
        onClick={onCreateInvestments}
        className="flex flex-1 items-center justify-center space-x-2 p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-all group min-w-[140px]"
      >
        <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-900">Investimentos</p>
        </div>
      </button>

      {/* Botão Despesas */}
      <button
        onClick={onCreateExpenses}
        className="flex flex-1 items-center justify-center space-x-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all group min-w-[140px]"
      >
        <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
          <CreditCard className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-red-900">Despesas</p>
        </div>
      </button>

      {/* Botão Entrada de Capital */}
      <button
        onClick={onCreateIncome}
        className="flex flex-1 items-center justify-center space-x-2 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all group min-w-[140px]"
      >
        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
          <DollarSign className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-900">Entrada de Capital</p>
        </div>
      </button>

      {/* Botão Personalizada (Em breve) */}
      <button
        aria-disabled="true"
        className="flex flex-1 items-center justify-center space-x-2 p-3 bg-gray-50 border-2 border-gray-200 rounded-xl opacity-80 cursor-not-allowed min-w-[140px]"
        title="Disponível em breve"
      >
        <div className="p-2 bg-gray-100 rounded-lg">
          <FileSpreadsheet className="w-5 h-5 text-gray-500" />
        </div>
        <div className="relative">
          <p className="text-sm font-medium text-gray-600">Personalizada</p>
          <div className="absolute -top-3 -right-12 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
            Em breve
          </div>
        </div>
      </button>
    </div>
  );
};

export default CreateButtons;
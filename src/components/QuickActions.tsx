import React from 'react';
import { Plus, TrendingUp, TrendingDown, Calculator, FileSpreadsheet } from 'lucide-react';

interface QuickActionsProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onOpenCalculator: () => void;
  onOpenSpreadsheets: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onAddIncome,
  onAddExpense,
  onOpenCalculator,
  onOpenSpreadsheets
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button
        onClick={onAddIncome}
        className="flex items-center justify-center space-x-2 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-all group"
      >
        <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-emerald-900">Nova</p>
          <p className="text-xs text-emerald-700">Entrada</p>
        </div>
      </button>

      <button
        onClick={onAddExpense}
        className="flex items-center justify-center space-x-2 p-4 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all group"
      >
        <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
          <TrendingDown className="w-5 h-5 text-red-600" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-red-900">Nova</p>
          <p className="text-xs text-red-700">Despesa</p>
        </div>
      </button>

      <button
        onClick={onOpenCalculator}
        className="flex items-center justify-center space-x-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all group"
      >
        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
          <Calculator className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-blue-900">Calcular</p>
          <p className="text-xs text-blue-700">Divisão</p>
        </div>
      </button>

      <button
        onClick={onOpenSpreadsheets}
        className="flex items-center justify-center space-x-2 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl hover:bg-purple-100 hover:border-purple-300 transition-all group"
      >
        <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
          <FileSpreadsheet className="w-5 h-5 text-purple-600" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-purple-900">Criar</p>
          <p className="text-xs text-purple-700">Planilhas</p>
        </div>
      </button>
    </div>
  );
};

export default QuickActions;
import React from 'react';
import BackButton from '../../components/planilhas/BackButton';
import CreateButtons from '../../components/planilhas/CreateButtons';
import SheetList from '../../components/planilhas/SheetList';
import AnalyticsPanel from '../../components/planilhas/AnalyticsPanel';
import { SheetType } from '../../types/sheets';

interface SheetsPageProps {
  onBack: () => void;
  onCreateSheet: (type: SheetType) => void;
  onOpenSheet: (id: string) => void;
}

const SheetsPage: React.FC<SheetsPageProps> = ({
  onBack,
  onCreateSheet,
  onOpenSheet
}) => {
  return (
    <div className="py-4">
      {/* Cabeçalho com botão de voltar */}
      <div className="flex items-center mb-6">
        <BackButton fallback={onBack} />
        <h1 className="text-2xl font-bold text-gray-900 ml-4">Planilhas</h1>
      </div>

      {/* Botões de criação */}
      <CreateButtons
        onCreateInvestments={() => onCreateSheet('investments')}
        onCreateExpenses={() => onCreateSheet('expenses')}
        onCreateIncome={() => onCreateSheet('income')}
      />

      {/* Layout responsivo de duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna esquerda - Listas de planilhas */}
        <div className="lg:col-span-5 space-y-6">
          <SheetList
            type="investments"
            onOpenSheet={onOpenSheet}
            onViewAll={() => console.log('Ver todas - Investimentos')}
          />

          <SheetList
            type="expenses"
            onOpenSheet={onOpenSheet}
            onViewAll={() => console.log('Ver todas - Despesas')}
          />

          <SheetList
            type="income"
            onOpenSheet={onOpenSheet}
            onViewAll={() => console.log('Ver todas - Entrada de Capital')}
          />
        </div>

        {/* Coluna direita - Painel de análise */}
        <div className="lg:col-span-7">
          <AnalyticsPanel className="sticky top-4" />
        </div>
      </div>
    </div>
  );
};

export default SheetsPage;
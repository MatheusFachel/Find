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
    <div className="container mx-auto px-4 py-4">
      {/* Botão de voltar */}
      <div className="mb-2">
        <BackButton 
          fallback={() => {
            console.log('Botão Voltar acionado');
            // Chamar a função de retorno passada como prop
            onBack();
          }} 
        />
      </div>
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Planilhas</h1>
      </div>

      {/* Botões de criação */}
      <CreateButtons
        onCreateInvestments={() => onCreateSheet('investments')}
        onCreateExpenses={() => onCreateSheet('expenses')}
        onCreateIncome={() => onCreateSheet('income')}
      />

      {/* Layout responsivo de duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna esquerda - Listas de planilhas */}
        <div className="lg:col-span-5 space-y-8">
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
        <div className="lg:col-span-7 lg:px-2">
          <AnalyticsPanel className="sticky top-4" />
        </div>
      </div>
    </div>
  );
};

export default SheetsPage;
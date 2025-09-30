import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import QuickActions from './components/QuickActions';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import CapitalDivisionCard from './components/CapitalDivisionCard';
import RecentActivity from './components/RecentActivity';
import MonthlyChart from './components/MonthlyChart';
import Calculator from './components/Calculator';
import SpreadsheetCreator from './components/SpreadsheetCreator';
import { useFinancialData } from './hooks/useFinancialData';
import { useResizeObserver } from './hooks/useResizeObserver';
import { supabase } from './lib/supabaseClient';

function App() {
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'spreadsheets'>('dashboard');
  
  const {
    transactions,
    divisions,
    spreadsheets,
    addTransaction,
    updateDivisions,
    updateSpreadsheets,
    getDashboardData,
    getIncomeTransactions,
    getExpenseTransactions,
  } = useFinancialData();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const dashboardData = getDashboardData();
  const incomeTransactions = getIncomeTransactions();
  const expenseTransactions = getExpenseTransactions();

  if (!session) {
    return <LoginScreen />;
  }

  if (currentView === 'spreadsheets') {
    return (
      <SpreadsheetCreator 
        onBack={() => setCurrentView('dashboard')} 
        spreadsheets={spreadsheets}
        onUpdateSpreadsheets={updateSpreadsheets}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumo do Dashboard */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bem-vindo de volta!
            </h2>
            <p className="text-gray-600">
              Aqui está um resumo da sua situação financeira atual.
            </p>
          </div>
          
          <Dashboard data={dashboardData} />
        </div>

        {/* Ações Rápidas */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <QuickActions
            onAddIncome={() => setIsIncomeFormOpen(true)}
            onAddExpense={() => setIsExpenseFormOpen(true)}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
            onOpenSpreadsheets={() => setCurrentView('spreadsheets')}
          />
        </div>

        {/* Grid unificado: 2 colunas no md+, 1 no sm; MonthlyChart full-width abaixo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coluna Esquerda: Históricos empilhados, com rolagem vinculada à altura do card de atividade */}
          <ScrollableHistories
            incomeTransactions={incomeTransactions}
            expenseTransactions={expenseTransactions}
          />

          {/* Coluna Direita: Divisão de Capital + Atividade Recente */}
          <RightColumnContainer>
            <div className="flex flex-col gap-8">
              <CapitalDivisionCard
                divisions={divisions}
                totalIncome={dashboardData.totalIncome}
                onUpdateDivisions={updateDivisions}
              />
              <RecentActivity transactions={transactions} />
            </div>
          </RightColumnContainer>

          {/* Linha Inferior: Evolução Mensal ocupando full-width */}
          <div className="md:col-span-2">
            <MonthlyChart transactions={transactions} />
          </div>
        </div>
      </main>

      {/* Forms */}
      <TransactionForm
        type="income"
        isOpen={isIncomeFormOpen}
        onClose={() => setIsIncomeFormOpen(false)}
        onSubmit={addTransaction}
      />

      <Calculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
      <TransactionForm
        type="expense"
        isOpen={isExpenseFormOpen}
        onClose={() => setIsExpenseFormOpen(false)}
        onSubmit={addTransaction}
      />
    </div>
  );
}

export default App;

// ---- Subcomponentes auxiliares no mesmo arquivo para manter contexto de layout ----
const RightColumnContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ref, size } = useResizeObserver<HTMLDivElement>();
  // Expor altura total da coluna direita via CSS custom property no elemento <main>
  useEffect(() => {
    if (ref.current) {
      const root = ref.current.closest('main') as HTMLElement | null;
      if (root) root.style.setProperty('--right-col-h', `${size.height}px`);
    }
  }, [size.height]);

  return (
    <div ref={ref}>
      {children}
    </div>
  );
};

const ScrollableHistories: React.FC<{ 
  incomeTransactions: ReturnType<typeof useFinancialData>['transactions'],
  expenseTransactions: ReturnType<typeof useFinancialData>['transactions'],
}> = ({ incomeTransactions, expenseTransactions }) => {
  // Em md+, a altura da coluna esquerda iguala a altura total da coluna direita (--right-col-h)
  // Cada card divide o espaço igualmente e rola internamente
  return (
    <section
      role="region"
      aria-label="Históricos"
      className="h-auto md:h-[var(--right-col-h)] min-h-0 flex flex-col gap-8 md:grid md:grid-rows-2 md:gap-8"
    >
      <TransactionList
        transactions={incomeTransactions}
        title="Planilha de Entrada de Caixa"
        type="income"
      />
      <TransactionList
        transactions={expenseTransactions}
        title="Planilha de Faturas (Contas a Pagar)"
        type="expense"
      />
    </section>
  );
};
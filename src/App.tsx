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
import SheetsPage from './pages/planilhas';
import { useFinancialData } from './hooks/useFinancialData';
import { useResizeObserver } from './hooks/useResizeObserver';
import { supabase } from './lib/supabaseClient';
import { SheetType } from './types/sheets';

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
    
    // Adicionar ouvinte de evento para navegação entre telas
    const handleNavigation = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail === 'dashboard') {
        setCurrentView('dashboard');
      } else if (customEvent.detail === 'spreadsheets') {
        setCurrentView('spreadsheets');
      }
    };
    
    window.addEventListener('navigate', handleNavigation);

    return () => { 
      sub.subscription.unsubscribe();
      window.removeEventListener('navigate', handleNavigation);
    };
  }, []);

  const dashboardData = getDashboardData();
  const incomeTransactions = getIncomeTransactions();
  const expenseTransactions = getExpenseTransactions();

  // Estado para o tipo de planilha ativa no criador
  const [activeSheetCreator, setActiveSheetCreator] = useState<SheetType | null>(null);

  // Adiciona logs para depuração da sessão
  console.log('Estado da sessão:', session ? 'Autenticado' : 'Não autenticado');
  
  if (!session) {
    console.log('Renderizando tela de login...');
    return <LoginScreen onLogin={() => console.log('Login bem-sucedido!')} />;
  }

  if (currentView === 'spreadsheets') {
    
    // Se uma tela específica de criação de planilha estiver ativa
    if (activeSheetCreator) {
      return (
        <SpreadsheetCreator 
          onBack={() => setActiveSheetCreator(null)} 
          spreadsheets={spreadsheets}
          onUpdateSpreadsheets={updateSpreadsheets}
          initialType={activeSheetCreator}
        />
      );
    }
    
    // Nova tela principal de planilhas
    return (
      <SheetsPage 
        onBack={() => setCurrentView('dashboard')}
        onCreateSheet={(type) => setActiveSheetCreator(type)}
        onOpenSheet={(id) => {
          // Abrir uma planilha específica para edição
          console.log(`Abrir planilha ${id}`);
          // Implementação real dependeria de como as planilhas são editadas
        }}
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
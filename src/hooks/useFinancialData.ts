import { useState, useEffect } from 'react';
import { Transaction, CapitalDivision, DashboardData, Spreadsheet } from '../types';
import { supabase } from '../lib/supabaseClient';
import { fetchDivisions as sbFetchDivisions, upsertDivisions as sbUpsertDivisions, fetchTransactions as sbFetchTransactions, addTransaction as sbAddTransaction, fetchSpreadsheets as sbFetchSpreadsheets } from '../lib/supabaseQueries';

export const useFinancialData = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [divisions, setDivisions] = useState<CapitalDivision[]>([]);
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Observar sessão
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthenticated(!!data.session);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthenticated(!!session);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  // Carregar dados na montagem e quando autenticado mudar
  useEffect(() => {
    const savedTransactions = localStorage.getItem('financeflow_transactions');
    const savedSpreadsheets = localStorage.getItem('financeflow_spreadsheets');

    if (!isAuthenticated) {
      // modo offline/local
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
      if (savedSpreadsheets) setSpreadsheets(JSON.parse(savedSpreadsheets));
      // carregar divisions (defaults/backend/local)
      const loadDivisionsLocal = () => {
        const defaultDivisions: CapitalDivision[] = [
          { id: '1', name: 'Gastos Essenciais', percentage: 50, amount: 0, color: '#10B981' },
          { id: '2', name: 'Poupança', percentage: 20, amount: 0, color: '#3B82F6' },
          { id: '3', name: 'Investimentos', percentage: 20, amount: 0, color: '#8B5CF6' },
          { id: '4', name: 'Lazer', percentage: 10, amount: 0, color: '#F59E0B' }
        ];
        const savedDivisions = localStorage.getItem('financeflow_divisions');
        if (savedDivisions) {
          try {
            const parsed: CapitalDivision[] = JSON.parse(savedDivisions);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setDivisions(parsed);
              return;
            }
          } catch {}
        }
        setDivisions(defaultDivisions);
      };
      loadDivisionsLocal();
      return;
    }

    // modo autenticado: carregar do Supabase
    const loadFromSupabase = async () => {
      try {
        const [divs, txs, sps] = await Promise.all([
          sbFetchDivisions(),
          sbFetchTransactions(),
          sbFetchSpreadsheets(),
        ]);
        setDivisions(divs);
        setTransactions(txs);
        setSpreadsheets(sps);
      } catch (e) {
        // Se falhar, cai para local
        if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
        if (savedSpreadsheets) setSpreadsheets(JSON.parse(savedSpreadsheets));
        const savedDivisions = localStorage.getItem('financeflow_divisions');
        if (savedDivisions) {
          try { setDivisions(JSON.parse(savedDivisions)); } catch {}
        }
      }
    };
    loadFromSupabase();
  }, [isAuthenticated]);

  // Persistências
  useEffect(() => {
    localStorage.setItem('financeflow_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('financeflow_divisions', JSON.stringify(divisions));
    const persist = async () => {
      try {
        if (isAuthenticated) {
          await sbUpsertDivisions(divisions);
        } else {
          // best-effort antigo para backend local (opcional)
          await fetch('/api/capital-divisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              divisions: divisions.map(d => ({ id: d.id, name: d.name, percentage: d.percentage, color: d.color }))
            })
          });
        }
      } catch {}
    };
    if (divisions && divisions.length > 0) persist();
  }, [divisions, isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('financeflow_spreadsheets', JSON.stringify(spreadsheets));
  }, [spreadsheets]);

  // API pública do hook
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString()
    };
    setTransactions(prev => [
      // otimista: adiciona já na UI
      newTransaction,
      ...prev,
    ]);
    try {
      if (isAuthenticated) {
        await sbAddTransaction(transaction);
        // recarrega do servidor para garantir id/ordem
        const txs = await sbFetchTransactions();
        setTransactions(txs);
      }
    } catch {
      // fallback: já está no local
    }
  };

  const updateDivisions = async (newDivisions: CapitalDivision[]) => {
    setDivisions(newDivisions);
    try {
      if (isAuthenticated) {
        await sbUpsertDivisions(newDivisions);
        const fresh = await sbFetchDivisions();
        setDivisions(fresh);
      }
    } catch {
      // manter estado local
    }
  };

  // Cálculos
  const getSpreadsheetTotals = () => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalInvestmentReturns = 0;

    spreadsheets.forEach(spreadsheet => {
      if (spreadsheet.type === 'income') {
        totalIncome += spreadsheet.rows.reduce((sum, row) => {
          return sum + (parseFloat(row.amount) || 0);
        }, 0);
      } else if (spreadsheet.type === 'expenses') {
        totalExpenses += spreadsheet.rows.reduce((sum, row) => {
          return sum + (parseFloat(row.amount) || 0);
        }, 0);
      } else if (spreadsheet.type === 'investments') {
        totalInvestmentReturns += spreadsheet.rows.reduce((sum, row) => {
          const quantity = parseFloat(row.quantity) || 0;
          const avgPrice = parseFloat(row.avgPrice) || 0;
          const yieldPercent = parseFloat(row.yield) || 0;
          const investmentValue = quantity * avgPrice;
          return sum + (investmentValue * yieldPercent / 100);
        }, 0);
      }
    });

    return { totalIncome, totalExpenses, totalInvestmentReturns };
  };

  const getDashboardData = (): DashboardData => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const spreadsheetTotals = getSpreadsheetTotals();
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const transactionIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const transactionExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactionIncome + spreadsheetTotals.totalIncome + spreadsheetTotals.totalInvestmentReturns;
    const totalExpenses = transactionExpenses + spreadsheetTotals.totalExpenses;

    const pendingBills = transactions
      .filter(t => t.type === 'expense' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const overdueCount = transactions
      .filter(t => {
        if (t.type !== 'expense' || !t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        const today = new Date();
        return dueDate < today && t.status !== 'paid';
      }).length;

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      pendingBills,
      overdueCount
    };
  };

  const getIncomeTransactions = () => transactions.filter(t => t.type === 'income');
  const getExpenseTransactions = () => transactions.filter(t => t.type === 'expense');

  return {
    transactions,
    divisions,
    spreadsheets,
    addTransaction,
    updateDivisions,
    updateSpreadsheets: setSpreadsheets,
    getDashboardData,
    getIncomeTransactions,
    getExpenseTransactions,
    getSpreadsheetTotals
  };
};
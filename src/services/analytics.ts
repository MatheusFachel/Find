import { SheetAnalytics, AnalyticsParams } from '../types/sheets';
import { fetchSpreadsheets } from '../lib/supabaseQueries';

// Cores para os datasets
const CHART_COLORS = {
  blue: 'rgba(53, 162, 235, 0.5)',
  green: 'rgba(75, 192, 192, 0.5)',
  purple: 'rgba(153, 102, 255, 0.5)',
  orange: 'rgba(255, 159, 64, 0.5)',
  red: 'rgba(255, 99, 132, 0.5)',
  yellow: 'rgba(255, 205, 86, 0.5)',
};

const CHART_BORDER_COLORS = {
  blue: 'rgb(53, 162, 235)',
  green: 'rgb(75, 192, 192)',
  purple: 'rgb(153, 102, 255)',
  orange: 'rgb(255, 159, 64)',
  red: 'rgb(255, 99, 132)',
  yellow: 'rgb(255, 205, 86)',
};

// Gerar categorias para agrupamento por período
const generatePeriodLabels = (params: AnalyticsParams): string[] => {
  const now = new Date();
  const labels = [];
  
  // Se for um período específico
  if (typeof params.period === 'object') {
    return ['Período selecionado'];
  }
  
  // Últimos 6 meses
  if (params.period === '6months') {
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
    }
  }
  
  // Último ano
  else if (params.period === '1year') {
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
    }
  }
  
  // Todo o período (simplificado)
  else {
    labels.push('Total');
  }
  
  return labels;
};

// Função para verificar se uma data está dentro do período especificado
const isDateInPeriod = (date: string, params: AnalyticsParams): boolean => {
  const dateObj = new Date(date);
  const now = new Date();
  
  if (typeof params.period === 'object') {
    const start = new Date(params.period.start);
    const end = new Date(params.period.end);
    return dateObj >= start && dateObj <= end;
  }
  
  if (params.period === '6months') {
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    return dateObj >= sixMonthsAgo;
  }
  
  if (params.period === '1year') {
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    return dateObj >= oneYearAgo;
  }
  
  return true; // all time
};

// Agrupar dados por mês
const groupByMonth = (data: any[], dateField: string): Record<string, any[]> => {
  return data.reduce((acc, item) => {
    const date = new Date(item[dateField]);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);
};

// Agrupar dados por categoria
const groupByCategory = (data: any[], categoryField: string): Record<string, any[]> => {
  return data.reduce((acc, item) => {
    const category = item[categoryField] || 'Outros';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    
    acc[category].push(item);
    return acc;
  }, {} as Record<string, any[]>);
};

// Obter análises consolidadas
export async function fetchAnalytics(params: AnalyticsParams): Promise<SheetAnalytics[]> {
  try {
    const spreadsheets = await fetchSpreadsheets();
    const result: SheetAnalytics[] = [];
    
    // Filtrar dados pelo período selecionado
    const filteredSheets = spreadsheets.map(sheet => ({
      ...sheet,
      rows: sheet.rows.filter(row => {
        const dateField = sheet.type === 'expenses' ? 'dueDate' : 'date';
        return row[dateField] && isDateInPeriod(row[dateField], params);
      })
    }));
    
    // 1. Fluxo de caixa consolidado (Entradas vs Despesas)
    const incomeSheets = filteredSheets.filter(s => s.type === 'income');
    const expenseSheets = filteredSheets.filter(s => s.type === 'expenses');
    
    const labels = generatePeriodLabels(params);
    let incomeData: number[] = [];
    let expenseData: number[] = [];
    
    if (params.groupBy === 'month' && labels.length > 1) {
      // Agrupar por mês para análise temporal
      const allIncomeRows = incomeSheets.flatMap(s => s.rows);
      const allExpenseRows = expenseSheets.flatMap(s => s.rows);
      
      const incomeByMonth = groupByMonth(allIncomeRows, 'date');
      const expenseByMonth = groupByMonth(allExpenseRows, 'dueDate');
      
      // Preencher dados para cada mês
      const now = new Date();
      labels.forEach((_, idx) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (labels.length - 1 - idx), 1);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        const monthIncome = incomeByMonth[key]?.reduce((sum, row) => sum + (row.amount || 0), 0) || 0;
        const monthExpense = expenseByMonth[key]?.reduce((sum, row) => sum + (row.amount || 0), 0) || 0;
        
        incomeData.push(monthIncome);
        expenseData.push(monthExpense);
      });
    } else {
      // Soma total para o período
      const totalIncome = incomeSheets.reduce((sum, sheet) => 
        sum + sheet.rows.reduce((s, row) => s + (row.amount || 0), 0), 0);
      
      const totalExpense = expenseSheets.reduce((sum, sheet) => 
        sum + sheet.rows.reduce((s, row) => s + (row.amount || 0), 0), 0);
      
      incomeData = [totalIncome];
      expenseData = [totalExpense];
    }
    
    result.push({
      type: 'cashflow',
      title: 'Fluxo de Caixa Consolidado',
      period: typeof params.period === 'string' ? params.period : 'custom',
      data: {
        labels,
        datasets: [
          {
            label: 'Entradas',
            data: incomeData,
            backgroundColor: CHART_COLORS.green,
            borderColor: CHART_BORDER_COLORS.green,
          },
          {
            label: 'Despesas',
            data: expenseData,
            backgroundColor: CHART_COLORS.red,
            borderColor: CHART_BORDER_COLORS.red,
          }
        ]
      }
    });
    
    // 2. Alocação de gastos por categoria
    const allExpenseRows = expenseSheets.flatMap(s => s.rows);
    const expensesByCategory = groupByCategory(allExpenseRows, 'category');
    
    const categories = Object.keys(expensesByCategory);
    const expensesByCategoryData = categories.map(cat => 
      expensesByCategory[cat].reduce((sum, row) => sum + (row.amount || 0), 0)
    );
    
    result.push({
      type: 'expenses',
      title: 'Alocação de Gastos por Categoria',
      period: typeof params.period === 'string' ? params.period : 'custom',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Despesas',
            data: expensesByCategoryData,
            backgroundColor: [
              CHART_COLORS.red,
              CHART_COLORS.orange,
              CHART_COLORS.yellow,
              CHART_COLORS.green,
              CHART_COLORS.blue,
              CHART_COLORS.purple,
            ],
            borderColor: [
              CHART_BORDER_COLORS.red,
              CHART_BORDER_COLORS.orange,
              CHART_BORDER_COLORS.yellow,
              CHART_BORDER_COLORS.green,
              CHART_BORDER_COLORS.blue,
              CHART_BORDER_COLORS.purple,
            ],
          }
        ]
      }
    });
    
    // 3. Evolução de investimentos
    const investmentSheets = filteredSheets.filter(s => s.type === 'investments');
    const allInvestmentRows = investmentSheets.flatMap(s => s.rows);
    
    let investmentData: number[] = [];
    
    if (params.groupBy === 'month' && labels.length > 1) {
      // Simulação simplificada da evolução dos investimentos ao longo dos meses
      let cumulativeValue = 0;
      
      labels.forEach(() => {
        // Simples incremento para mostrar crescimento - na prática, isso viria de dados reais
        cumulativeValue += Math.random() * 5000;
        investmentData.push(cumulativeValue);
      });
    } else {
      // Total investido
      const totalInvested = allInvestmentRows.reduce((sum, row) => 
        sum + ((row.quantity || 0) * (row.avgPrice || 0)), 0);
      
      investmentData = [totalInvested];
    }
    
    result.push({
      type: 'investments',
      title: 'Evolução de Investimentos',
      period: typeof params.period === 'string' ? params.period : 'custom',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Investido',
            data: investmentData,
            backgroundColor: CHART_COLORS.blue,
            borderColor: CHART_BORDER_COLORS.blue,
          }
        ]
      }
    });
    
    // 4. Metas vs Realizado (simplificado - simulação)
    const goalData = incomeData.map((income) => {
      // Simular uma meta como sendo 20% maior que a entrada real
      return income * 1.2;
    });
    
    result.push({
      type: 'goals',
      title: 'Metas vs Realizado',
      period: typeof params.period === 'string' ? params.period : 'custom',
      data: {
        labels,
        datasets: [
          {
            label: 'Realizado',
            data: incomeData,
            backgroundColor: CHART_COLORS.green,
            borderColor: CHART_BORDER_COLORS.green,
          },
          {
            label: 'Meta',
            data: goalData,
            backgroundColor: CHART_COLORS.purple,
            borderColor: CHART_BORDER_COLORS.purple,
          }
        ]
      }
    });
    
    return result;
  } catch (error) {
    console.error('Erro ao buscar análises:', error);
    throw new Error('Não foi possível carregar as análises');
  }
}
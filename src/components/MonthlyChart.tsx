import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Transaction } from '../types';

interface MonthlyChartProps {
  transactions: Transaction[];
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ transactions }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Get last 6 months data
  const getMonthlyData = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        income,
        expenses,
        balance: income - expenses
      });
    }
    
    return months;
  };

  const monthlyData = getMonthlyData();
  const maxValue = Math.max(...monthlyData.map(m => Math.max(m.income, m.expenses)));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Evolução Mensal</h3>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {monthlyData.map((month, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {month.month}
                </span>
                <span className={`text-sm font-medium ${
                  month.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {formatCurrency(month.balance)}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${maxValue > 0 ? (month.income / maxValue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-emerald-600 font-medium min-w-max">
                    {formatCurrency(month.income)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${maxValue > 0 ? (month.expenses / maxValue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-red-600 font-medium min-w-max">
                    {formatCurrency(month.expenses)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-gray-600">Receitas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-gray-600">Despesas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyChart;
import React from 'react';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  title: string;
  type: 'income' | 'expense';
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  title,
  type
}) => {
  // Mapeamento de títulos conforme requisito
  const getUpdatedTitle = (originalTitle: string) => {
    if (originalTitle === 'Planilha de Entrada de Caixa') {
      return 'Histórico de Entrada';
    }
    if (originalTitle === 'Planilha de Faturas (Contas a Pagar)') {
      return 'Histórico de Despesas';
    }
    return originalTitle;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Calendar className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'text-emerald-600 bg-emerald-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-orange-600 bg-orange-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full min-h-0">
      {/* Header fixo */}
      <div className="p-6 border-b border-gray-200 shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">{getUpdatedTitle(title)}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {transactions.length} {transactions.length === 1 ? 'transação' : 'transações'}
        </p>
      </div>

      {/* Conteúdo rolável (somente em md+) */}
      <div className="min-h-0 divide-y divide-gray-200 md:overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma transação encontrada</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {type === 'expense' && transaction.status && (
                    <div className="flex-shrink-0">
                      {getStatusIcon(transaction.status)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{transaction.category}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{formatDate(transaction.date)}</span>
                      {transaction.dueDate && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">Vence: {formatDate(transaction.dueDate)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-lg font-semibold ${
                    type === 'income' ? 'text-emerald-600' : 'text-gray-900'
                  }`}>
                    {type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </span>
                  {type === 'expense' && transaction.status && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status === 'paid' ? 'Pago' : transaction.status === 'overdue' ? 'Vencido' : 'Pendente'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;

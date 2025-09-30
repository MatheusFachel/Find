import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Calendar
} from 'lucide-react';
import DashboardCard from './DashboardCard';
import { DashboardData } from '../types';

interface DashboardProps {
  data: DashboardData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardCard
        title="Receitas do Mês"
        value={formatCurrency(data.totalIncome)}
        icon={TrendingUp}
        trend="+12% vs mês anterior"
        trendDirection="up"
        className="border-l-4 border-emerald-500"
      />
      
      <DashboardCard
        title="Despesas do Mês"
        value={formatCurrency(data.totalExpenses)}
        icon={TrendingDown}
        trend="-5% vs mês anterior"
        trendDirection="down"
        className="border-l-4 border-red-500"
      />
      
      <DashboardCard
        title="Saldo Atual"
        value={formatCurrency(data.balance)}
        icon={DollarSign}
        trend={data.balance >= 0 ? "Positivo" : "Negativo"}
        trendDirection={data.balance >= 0 ? "up" : "down"}
        className={`border-l-4 ${data.balance >= 0 ? 'border-blue-500' : 'border-orange-500'}`}
      />
      
      <DashboardCard
        title="Contas Pendentes"
        value={formatCurrency(data.pendingBills)}
        icon={data.overdueCount > 0 ? AlertTriangle : Calendar}
        trend={data.overdueCount > 0 ? `${data.overdueCount} vencidas` : "Em dia"}
        trendDirection={data.overdueCount > 0 ? "down" : "up"}
        className={`border-l-4 ${data.overdueCount > 0 ? 'border-red-500' : 'border-green-500'}`}
      />
    </div>
  );
};

export default Dashboard;
import React from 'react';
import { DollarSign, TrendingUp, Calendar, Settings } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FinanceFlow</h1>
              <p className="text-sm text-gray-500">Gestão Financeira Pessoal</p>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition-colors">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Dashboard</span>
            </a>
            <a href="#" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Planilhas</span>
            </a>
            <a href="#" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Settings className="w-4 h-4" />
              <span className="font-medium">Configurações</span>
            </a>
          </nav>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
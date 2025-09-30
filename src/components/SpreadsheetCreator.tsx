import React, { useState } from 'react';
import { Plus, FileSpreadsheet, TrendingUp, DollarSign, CreditCard, ArrowLeft, RefreshCcw } from 'lucide-react';
import SpreadsheetEditor from './SpreadsheetEditor';
import { Spreadsheet } from '../types';
import { createSpreadsheet as sbCreateSpreadsheet, deleteSpreadsheet as sbDeleteSpreadsheet, fetchSpreadsheets as sbFetchSpreadsheets } from '../lib/supabaseQueries';
import { supabase } from '../lib/supabaseClient';

interface SpreadsheetCreatorProps {
  onBack: () => void;
  spreadsheets: Spreadsheet[];
  onUpdateSpreadsheets: (spreadsheets: Spreadsheet[]) => void;
}

const SpreadsheetCreator: React.FC<SpreadsheetCreatorProps> = ({ 
  onBack, 
  spreadsheets, 
  onUpdateSpreadsheets 
}) => {
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<Spreadsheet | null>(null);
  const [syncing, setSyncing] = useState(false);

  const spreadsheetTypes = [
    {
      id: 'investments',
      title: 'Investimentos',
      description: 'Controle seus investimentos e rendimentos',
      icon: TrendingUp,
      color: 'emerald',
      columns: [
        { key: 'asset', label: 'Ativo', type: 'text' as const },
        { key: 'quantity', label: 'Quantidade', type: 'number' as const },
        { key: 'avgPrice', label: 'Preço Médio', type: 'number' as const },
        { key: 'purchaseDate', label: 'Data Compra', type: 'date' as const },
        { key: 'yield', label: 'Rendimentos (%)', type: 'number' as const }
      ]
    },
    {
      id: 'income',
      title: 'Entrada de Capital',
      description: 'Registre suas receitas e salários',
      icon: DollarSign,
      color: 'blue',
      columns: [
        { key: 'source', label: 'Fonte', type: 'text' as const },
        { key: 'amount', label: 'Valor', type: 'number' as const },
        { key: 'date', label: 'Data', type: 'date' as const },
        { key: 'category', label: 'Categoria', type: 'select' as const, options: ['Salário', 'Freelance', 'Investimentos', 'Vendas', 'Outros'] },
        { key: 'notes', label: 'Observações', type: 'text' as const }
      ]
    },
    {
      id: 'expenses',
      title: 'Despesas/Contas',
      description: 'Controle seus gastos e contas a pagar',
      icon: CreditCard,
      color: 'red',
      columns: [
        { key: 'description', label: 'Descrição', type: 'text' as const },
        { key: 'amount', label: 'Valor', type: 'number' as const },
        { key: 'dueDate', label: 'Vencimento', type: 'date' as const },
        { key: 'status', label: 'Status', type: 'select' as const, options: ['Pendente', 'Pago', 'Vencido'] },
        { key: 'category', label: 'Categoria', type: 'select' as const, options: ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'] }
      ]
    }
  ];

  const createSpreadsheet = async (type: string) => {
    const typeConfig = spreadsheetTypes.find(t => t.id === type);
    if (!typeConfig) return;

    const session = (await supabase.auth.getSession()).data.session;
    if (session) {
      try {
        const id = await sbCreateSpreadsheet(`Nova ${typeConfig.title}`, type as any, typeConfig.columns);
        const newSpreadsheet: Spreadsheet = {
          id,
          name: `Nova ${typeConfig.title}`,
          type: type as 'investments' | 'income' | 'expenses',
          columns: typeConfig.columns,
          rows: [],
          createdAt: new Date().toISOString()
        };
        onUpdateSpreadsheets([...spreadsheets, newSpreadsheet]);
        setSelectedSpreadsheet(newSpreadsheet);
        return;
      } catch {}
    }

    // fallback local
    const newSpreadsheet: Spreadsheet = {
      id: Date.now().toString(),
      name: `Nova ${typeConfig.title}`,
      type: type as 'investments' | 'income' | 'expenses',
      columns: typeConfig.columns,
      rows: [],
      createdAt: new Date().toISOString()
    };

    onUpdateSpreadsheets([...spreadsheets, newSpreadsheet]);
    setSelectedSpreadsheet(newSpreadsheet);
  };

  const updateSpreadsheet = (updatedSpreadsheet: Spreadsheet) => {
    onUpdateSpreadsheets(
      spreadsheets.map(s => s.id === updatedSpreadsheet.id ? updatedSpreadsheet : s)
    );
  };

  const deleteSpreadsheet = async (id: string) => {
    const session = (await supabase.auth.getSession()).data.session;
    onUpdateSpreadsheets(spreadsheets.filter(s => s.id !== id));
    setSelectedSpreadsheet(null);
    if (session) {
      try { await sbDeleteSpreadsheet(id); } catch {}
    }
  };

  const syncFromSupabase = async () => {
    setSyncing(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (session) {
        const sps = await sbFetchSpreadsheets();
        onUpdateSpreadsheets(sps);
      }
    } finally {
      setSyncing(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      emerald: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-900',
      blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-900',
      red: 'bg-red-50 border-red-200 hover:bg-red-100 text-red-900'
    };
    return colors[color as keyof typeof colors] || colors.emerald;
  };

  const getIconColorClasses = (color: string) => {
    const colors = {
      emerald: 'bg-emerald-100 text-emerald-600',
      blue: 'bg-blue-100 text-blue-600',
      red: 'bg-red-100 text-red-600'
    };
    return colors[color as keyof typeof colors] || colors.emerald;
  };

  if (selectedSpreadsheet) {
    return (
      <SpreadsheetEditor
        spreadsheet={selectedSpreadsheet}
        onUpdate={updateSpreadsheet}
        onDelete={deleteSpreadsheet}
        onBack={() => setSelectedSpreadsheet(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Dashboard</span>
            </button>
            <button
              onClick={syncFromSupabase}
              disabled={syncing}
              className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
              title="Sincronizar com o Supabase"
            >
              <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
          
          <div className="flex items-center space-x-3 mb-2">
            <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">Criador de Planilhas</h1>
          </div>
          <p className="text-gray-600">
            Crie e gerencie planilhas personalizadas para diferentes aspectos das suas finanças
          </p>
        </div>

        {/* Spreadsheet Types */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Criar Nova Planilha</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spreadsheetTypes.map((type) => {
              const Icon = type.icon;
              const existingSpreadsheetsCount = spreadsheets.filter(s => s.type === type.id).length;
              
              return (
                <div
                  key={type.id}
                  className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${getColorClasses(type.color)}`}
                  onClick={() => createSpreadsheet(type.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${getIconColorClasses(type.color)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{type.title}</h3>
                  <p className="text-sm opacity-80 mb-4">{type.description}</p>
                  
                  <div className="text-xs opacity-70">
                    <p className="font-medium mb-1">Colunas incluídas:</p>
                    <p>{type.columns.map(col => col.label).join(', ')}</p>
                  </div>
                  
                  {existingSpreadsheetsCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                      <p className="text-xs opacity-80">
                        {existingSpreadsheetsCount} {existingSpreadsheetsCount === 1 ? 'planilha criada' : 'planilhas criadas'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Existing Spreadsheets */}
        {spreadsheets.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Minhas Planilhas</h2>
            
            {/* Group spreadsheets by type */}
            {spreadsheetTypes.map((type) => {
              const typeSpreadsheets = spreadsheets.filter(s => s.type === type.id);
              if (typeSpreadsheets.length === 0) return null;
              
              const Icon = type.icon;
              
              return (
                <div key={type.id} className="mb-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className={`p-2 rounded-lg ${getIconColorClasses(type.color)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{type.title}</h3>
                    <span className="text-sm text-gray-500">({typeSpreadsheets.length})</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeSpreadsheets.map((spreadsheet) => (
                      <div
                        key={spreadsheet.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedSpreadsheet(spreadsheet)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{spreadsheet.name}</h4>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {spreadsheet.rows.length} {spreadsheet.rows.length === 1 ? 'linha' : 'linhas'}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-400 mb-2">
                          Criada em {new Date(spreadsheet.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        
                        {/* Show summary based on type */}
                        {spreadsheet.type === 'investments' && spreadsheet.rows.length > 0 && (
                          <div className="text-sm text-emerald-600 font-medium">
                            Valor: R$ {spreadsheet.rows.reduce((sum, row) => {
                              const quantity = parseFloat(row.quantity) || 0;
                              const price = parseFloat(row.avgPrice) || 0;
                              return sum + (quantity * price);
                            }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                        
                        {(spreadsheet.type === 'income' || spreadsheet.type === 'expenses') && spreadsheet.rows.length > 0 && (
                          <div className={`text-sm font-medium ${
                            spreadsheet.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            Total: R$ {spreadsheet.rows.reduce((sum, row) => {
                              return sum + (parseFloat(row.amount) || 0);
                            }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpreadsheetCreator;
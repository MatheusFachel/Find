import React, { useState, useEffect, useCallback } from 'react';
import { SheetListItem, SheetType, SheetSearchParams } from '../../types/sheets';
import { Calendar, Search, MoreVertical, Eye } from 'lucide-react';
import { fetchSheetsByType, renameSheet, deleteSheet, duplicateSheet } from '../../services/planilhas';

interface SheetListProps {
  type: SheetType;
  onOpenSheet: (id: string) => void;
  onViewAll?: () => void;
}

const typeTitles: Record<SheetType, string> = {
  investments: 'Investimentos',
  expenses: 'Despesas',
  income: 'Entrada de Capital'
};

const typeColors: Record<SheetType, {
  bg: string,
  border: string,
  text: string,
  icon: string
}> = {
  investments: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    icon: 'text-emerald-600'
  },
  expenses: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-600'
  },
  income: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600'
  }
};

const SheetList: React.FC<SheetListProps> = ({ type, onOpenSheet, onViewAll }) => {
  const [sheets, setSheets] = useState<SheetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SheetSearchParams>({
    query: '',
    period: 'all'
  });
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const colors = typeColors[type];
  
  // Formatar moeda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Formatar data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  // Buscar planilhas
  const loadSheets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSheetsByType(type, searchParams);
      setSheets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar planilhas');
    } finally {
      setLoading(false);
    }
  }, [type, searchParams]);
  
  useEffect(() => {
    loadSheets();
  }, [loadSheets]);
  
  // Manipulação de busca
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchParams(prev => ({ ...prev, query }));
  };
  
  // Manipulação de período
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value === 'all') {
      setSearchParams(prev => ({ ...prev, period: 'all' }));
    } else {
      const [month, year] = value.split('-');
      setSearchParams(prev => ({ 
        ...prev, 
        period: {
          month: parseInt(month),
          year: parseInt(year)
        }
      }));
    }
  };
  
  // Fechar menu
  const closeMenu = () => {
    setShowMenu(null);
  };
  
  // Iniciar edição de nome
  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setNewName(currentName);
    setShowMenu(null);
  };
  
  // Salvar novo nome
  const handleRename = async (id: string) => {
    if (newName.trim()) {
      try {
        await renameSheet(id, newName.trim());
        setSheets(prev => prev.map(sheet => 
          sheet.id === id ? { ...sheet, name: newName.trim() } : sheet
        ));
      } catch (err) {
        console.error('Erro ao renomear:', err);
        // Exibir alguma mensagem de erro, se necessário
      } finally {
        setEditingId(null);
      }
    } else {
      setEditingId(null);
    }
  };
  
  // Duplicar planilha
  const handleDuplicate = async (id: string) => {
    try {
      await duplicateSheet(id);
      loadSheets();
    } catch (err) {
      console.error('Erro ao duplicar:', err);
      // Exibir alguma mensagem de erro, se necessário
    } finally {
      setShowMenu(null);
    }
  };
  
  // Excluir planilha
  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta planilha?')) {
      try {
        await deleteSheet(id);
        setSheets(prev => prev.filter(sheet => sheet.id !== id));
      } catch (err) {
        console.error('Erro ao excluir:', err);
        // Exibir alguma mensagem de erro, se necessário
      } finally {
        setShowMenu(null);
      }
    } else {
      setShowMenu(null);
    }
  };
  
  // Conteúdo de loading
  if (loading && !sheets.length) {
    return (
      <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 mb-8`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-semibold ${colors.text}`}>{typeTitles[type]}</h3>
          <div className="w-8 h-5 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Skeleton para os filtros */}
        <div className="flex justify-between items-center mb-4">
          <div className="w-40 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Skeletons para os itens */}
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-3 mb-2 flex justify-between items-center">
            <div className="flex flex-col space-y-2">
              <div className="w-40 h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Conteúdo de erro
  if (error) {
    return (
      <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 mb-8`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-semibold ${colors.text}`}>{typeTitles[type]}</h3>
        </div>
        
        <div className="text-center py-8">
          <p className="text-gray-600 mb-3">{error}</p>
          <button 
            onClick={loadSheets}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
  
  // Conteúdo de lista vazia
  if (!sheets.length) {
    return (
      <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 mb-8`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-semibold ${colors.text}`}>{typeTitles[type]}</h3>
          <span className="text-sm text-gray-500">0 planilhas</span>
        </div>
        
        <div className="text-center py-8 px-4">
          <p className="text-gray-600 mb-4">
            Você ainda não possui nenhuma planilha de {typeTitles[type].toLowerCase()}.
          </p>
          <button 
            className={`px-4 py-2 bg-${colors.text.split('-')[1]}-500 text-white rounded hover:bg-${colors.text.split('-')[1]}-600 transition-colors`}
          >
            Criar planilha de {typeTitles[type].toLowerCase()}
          </button>
        </div>
      </div>
    );
  }
  
  // Gerar opções para o seletor de períodos
  const generatePeriodOptions = () => {
    const options = [];
    const now = new Date();
    
    // Opção "Todos"
    options.push(
      <option key="all" value="all">Todos os períodos</option>
    );
    
    // Últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      options.push(
        <option key={`${month}-${year}`} value={`${month}-${year}`}>
          {label}
        </option>
      );
    }
    
    return options;
  };

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 mb-8`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-semibold ${colors.text}`}>{typeTitles[type]}</h3>
        <span className="text-sm text-gray-500">{sheets.length} planilhas</span>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchParams.query}
            onChange={handleSearch}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onChange={handlePeriodChange}
            value={searchParams.period === 'all' || !searchParams.period ? 'all' : `${searchParams.period.month}-${searchParams.period.year}`}
          >
            {generatePeriodOptions()}
          </select>
        </div>
      </div>
      
      {/* Lista de planilhas */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {sheets.map(sheet => (
          <div
            key={sheet.id}
            className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center hover:shadow-sm transition-shadow"
          >
            {editingId === sheet.id ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => handleRename(sheet.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(sheet.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
                className="border border-gray-300 rounded px-2 py-1 mr-2"
              />
            ) : (
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{sheet.name}</h4>
                <p className="text-sm text-gray-500">Criada em {formatDate(sheet.createdAt)}</p>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-700">
                {formatCurrency(sheet.metrics.total)}
              </span>
              
              <button
                onClick={() => onOpenSheet(sheet.id)}
                className="p-1.5 rounded-full hover:bg-gray-100"
                aria-label="Abrir planilha"
              >
                <Eye className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowMenu(showMenu === sheet.id ? null : sheet.id)}
                  className="p-1.5 rounded-full hover:bg-gray-100"
                  aria-label="Mais opções"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                
                {showMenu === sheet.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={closeMenu}
                    />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-40">
                      <button
                        onClick={() => startRename(sheet.id, sheet.name)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        Renomear
                      </button>
                      <button
                        onClick={() => handleDuplicate(sheet.id)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        Duplicar
                      </button>
                      <button
                        onClick={() => handleDelete(sheet.id)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 text-sm"
                      >
                        Apagar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Botão "Ver todas" no final da lista */}
      {sheets.length > 0 && onViewAll && (
        <div className="mt-4 text-center">
          <button
            onClick={onViewAll}
            className={`text-${colors.text.split('-')[1]}-600 hover:text-${colors.text.split('-')[1]}-800 font-medium text-sm`}
          >
            Ver todas
          </button>
        </div>
      )}
    </div>
  );
};

export default SheetList;
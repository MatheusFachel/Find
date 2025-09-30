import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { Spreadsheet, SpreadsheetRow, SpreadsheetColumn } from '../types';
import { supabase } from '../lib/supabaseClient';
import { renameSpreadsheet as sbRenameSpreadsheet, insertRow as sbInsertRow, updateRow as sbUpdateRow, deleteRow as sbDeleteRow, upsertColumns as sbUpsertColumns } from '../lib/supabaseQueries';

interface SpreadsheetEditorProps {
  spreadsheet: Spreadsheet;
  onUpdate: (spreadsheet: Spreadsheet) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({
  spreadsheet,
  onUpdate,
  onDelete,
  onBack
}) => {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(spreadsheet.name);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingColumns, setEditingColumns] = useState(false);
  const [columnsDraft, setColumnsDraft] = useState<SpreadsheetColumn[]>([...spreadsheet.columns]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const addRow = async () => {
    const row: SpreadsheetRow = {
      id: Date.now().toString(),
      ...spreadsheet.columns.reduce((acc, col) => {
        acc[col.key] = '';
        return acc;
      }, {} as any)
    };

    const updatedSpreadsheet = {
      ...spreadsheet,
      rows: [...spreadsheet.rows, row]
    };

    onUpdate(updatedSpreadsheet);
    setEditingRow(row.id);

    const session = (await supabase.auth.getSession()).data.session;
    if (session) {
      try {
        await sbInsertRow(spreadsheet.id, row);
      } catch {}
    }
  };

  const updateRow = async (rowId: string, data: Partial<SpreadsheetRow>) => {
    const updatedSpreadsheet = {
      ...spreadsheet,
      rows: spreadsheet.rows.map(row => 
        row.id === rowId ? { ...row, ...data } : row
      )
    };
    onUpdate(updatedSpreadsheet);

    const session = (await supabase.auth.getSession()).data.session;
    if (session) {
      try {
        await sbUpdateRow(spreadsheet.id, rowId, updatedSpreadsheet.rows.find(r => r.id === rowId)!);
      } catch {}
    }
  };

  const deleteRow = async (rowId: string) => {
    const updatedSpreadsheet = {
      ...spreadsheet,
      rows: spreadsheet.rows.filter(row => row.id !== rowId)
    };
    onUpdate(updatedSpreadsheet);

    const session = (await supabase.auth.getSession()).data.session;
    if (session) {
      try {
        await sbDeleteRow(spreadsheet.id, rowId);
      } catch {}
    }
  };

  const saveName = async () => {
    const updatedSpreadsheet = {
      ...spreadsheet,
      name: newName
    };
    onUpdate(updatedSpreadsheet);
    setEditingName(false);

    const session = (await supabase.auth.getSession()).data.session;
    if (session) {
      try {
        await sbRenameSpreadsheet(spreadsheet.id, newName);
      } catch {}
    }
  };

  const addColumn = () => {
    const key = `col_${Date.now()}`;
    setColumnsDraft([...columnsDraft, { key, label: 'Nova Coluna', type: 'text' }]);
  };

  const removeColumn = (key: string) => {
    setColumnsDraft(columnsDraft.filter(c => c.key !== key));
  };

  const updateColumn = (key: string, patch: Partial<SpreadsheetColumn>) => {
    setColumnsDraft(columnsDraft.map(c => c.key === key ? { ...c, ...patch } : c));
  };

  const saveColumns = async () => {
    const updatedSpreadsheet: Spreadsheet = { ...spreadsheet, columns: columnsDraft };
    onUpdate(updatedSpreadsheet);
    setEditingColumns(false);

    const session = (await supabase.auth.getSession()).data.session;
    if (session) {
      try { await sbUpsertColumns(spreadsheet.id, columnsDraft); } catch {}
    }
  };

  const renderCellValue = (row: SpreadsheetRow, column: any) => {
    const value = row[column.key];
    
    if (column.type === 'number' && column.key.includes('amount') || column.key.includes('Price')) {
      return value ? formatCurrency(parseFloat(value)) : '-';
    }
    
    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString('pt-BR');
    }
    
    return value || '-';
  };

  const renderEditCell = (row: SpreadsheetRow, column: any) => {
    const value = row[column.key];

    if (column.type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => updateRow(row.id, { [column.key]: e.target.value })}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Selecione...</option>
          {column.options?.map((option: string) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={column.type}
        value={value}
        onChange={(e) => updateRow(row.id, { [column.key]: e.target.value })}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        placeholder={column.label}
        step={column.type === 'number' ? '0.01' : undefined}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar às Planilhas</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {editingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-2xl font-bold bg-transparent border-b-2 border-emerald-500 focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && saveName()}
                  />
                  <button
                    onClick={saveName}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Save className="w-4 h-4 text-emerald-600" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNewName(spreadsheet.name);
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">{spreadsheet.name}</h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={addRow}
                className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                title="Adicionar linha"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Linha</span>
              </button>
              <button
                onClick={() => setEditingColumns(true)}
                className="flex items-center space-x-2 px-3 py-2 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                title="Editar colunas"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Colunas</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta planilha? Esta ação não pode ser desfeita.')) {
                    onDelete(spreadsheet.id);
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 text-red-700 hover:bg-red-50 rounded-lg"
                title="Excluir planilha"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Editor de colunas */}
        {editingColumns && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Colunas</h3>
            <div className="space-y-3">
              {columnsDraft.map((col) => (
                <div key={col.key} className="flex items-center gap-3">
                  <input
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    value={col.label}
                    onChange={(e) => updateColumn(col.key, { label: e.target.value })}
                    placeholder="Rótulo"
                  />
                  <select
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                    value={col.type}
                    onChange={(e) => updateColumn(col.key, { type: e.target.value as SpreadsheetColumn['type'] })}
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="date">Data</option>
                    <option value="select">Seleção</option>
                  </select>
                  {col.type === 'select' && (
                    <input
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      value={(col.options || []).join(', ')}
                      onChange={(e) => updateColumn(col.key, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Opções separadas por vírgula"
                    />
                  )}
                  <button onClick={() => removeColumn(col.key)} className="p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button onClick={addColumn} className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <Plus className="w-4 h-4" />
                Adicionar Coluna
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => { setColumnsDraft([...spreadsheet.columns]); setEditingColumns(false); }} className="px-3 py-2 border rounded-lg">Cancelar</button>
                <button onClick={saveColumns} className="px-3 py-2 bg-emerald-600 text-white rounded-lg">Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Spreadsheet Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {spreadsheet.columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 w-20">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {spreadsheet.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={spreadsheet.columns.length + 1}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Nenhuma linha adicionada. Clique em "Adicionar Linha" para começar.
                    </td>
                  </tr>
                ) : (
                  spreadsheet.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {spreadsheet.columns.map((column) => (
                        <td key={column.key} className="px-4 py-3">
                          {editingRow === row.id ? (
                            renderEditCell(row, column)
                          ) : (
                            <span className="text-sm text-gray-900">
                              {renderCellValue(row, column)}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {editingRow === row.id ? (
                            <button
                              onClick={() => setEditingRow(null)}
                              className="p-1 hover:bg-emerald-100 rounded transition-colors"
                            >
                              <Save className="w-4 h-4 text-emerald-600" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingRow(row.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteRow(row.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        {spreadsheet.rows.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{spreadsheet.rows.length}</p>
                <p className="text-sm text-gray-600">Total de Linhas</p>
              </div>
              
              {spreadsheet.type === 'investments' && (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {spreadsheet.rows.filter(row => row.asset).length}
                    </p>
                    <p className="text-sm text-gray-600">Ativos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(
                        spreadsheet.rows.reduce((sum, row) => {
                          const quantity = parseFloat(row.quantity) || 0;
                          const price = parseFloat(row.avgPrice) || 0;
                          return sum + (quantity * price);
                        }, 0)
                      )}
                    </p>
                    <p className="text-sm text-gray-600">Valor Investido</p>
                  </div>
                </>
              )}

              {(spreadsheet.type === 'income' || spreadsheet.type === 'expenses') && (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(
                        spreadsheet.rows.reduce((sum, row) => {
                          return sum + (parseFloat(row.amount) || 0);
                        }, 0)
                      )}
                    </p>
                    <p className="text-sm text-gray-600">Valor Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {new Set(spreadsheet.rows.map(row => row.category).filter(Boolean)).size}
                    </p>
                    <p className="text-sm text-gray-600">Categorias</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpreadsheetEditor;
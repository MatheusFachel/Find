import React, { useState } from 'react';
import { PieChart, Edit2, Plus, Trash2 } from 'lucide-react';
import { CapitalDivision } from '../types';

interface CapitalDivisionCardProps {
  divisions: CapitalDivision[];
  totalIncome: number;
  onUpdateDivisions: (divisions: CapitalDivision[]) => void;
}

const CapitalDivisionCard: React.FC<CapitalDivisionCardProps> = ({
  divisions,
  totalIncome,
  onUpdateDivisions
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newDivision, setNewDivision] = useState({ name: '', percentage: 0 });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const handleAddDivision = () => {
    if (newDivision.name && newDivision.percentage > 0) {
      const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];
      const color = colors[divisions.length % colors.length];
      
      const updatedDivisions = [
        ...divisions,
        {
          id: Date.now().toString(),
          name: newDivision.name,
          percentage: newDivision.percentage,
          // amount é derivado de totalIncome e percentage; manter 0 aqui evita inconsistência persistida
          amount: 0,
          color
        }
      ];

      onUpdateDivisions(updatedDivisions);
      setNewDivision({ name: '', percentage: 0 });
    }
  };

  const handleRemoveDivision = (id: string) => {
    const updatedDivisions = divisions.filter(d => d.id !== id);
    onUpdateDivisions(updatedDivisions);
  };

  const handlePercentageChange = (id: string, percentage: number) => {
    const updatedDivisions = divisions.map(d => 
      d.id === id ? { ...d, percentage } : d
    );
    onUpdateDivisions(updatedDivisions);
  };

  const totalPercentage = divisions.reduce((sum, d) => sum + d.percentage, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Divisão de Capital</h3>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Total: {formatCurrency(totalIncome)}
        </p>
      </div>

      <div className="p-6">
        {divisions.length === 0 ? (
          <div className="text-center py-8">
            <PieChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">Configure como dividir seu capital</p>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Configurar Divisão
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {divisions.map((division) => (
              <div key={division.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: division.color }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{division.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(Math.max(0, (totalIncome * division.percentage) / 100))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={division.percentage}
                        onChange={(e) => handlePercentageChange(division.id, parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <span className="text-sm text-gray-500">%</span>
                      <button
                        onClick={() => handleRemoveDivision(division.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      {division.percentage}%
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isEditing && (
              <div className="flex items-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                <input
                  type="text"
                  placeholder="Nome da divisão"
                  value={newDivision.name}
                  onChange={(e) => setNewDivision({ ...newDivision, name: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={newDivision.percentage || ''}
                  onChange={(e) => setNewDivision({ ...newDivision, percentage: parseFloat(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <span className="text-sm text-gray-500">%</span>
                <button
                  onClick={handleAddDivision}
                  className="p-1 hover:bg-emerald-100 rounded transition-colors"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total alocado:</span>
                <span className={`text-sm font-medium ${
                  totalPercentage === 100 ? 'text-emerald-600' : 
                  totalPercentage > 100 ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {totalPercentage}%
                </span>
              </div>
              {totalPercentage !== 100 && (
                <p className="text-xs text-gray-500 mt-1">
                  {totalPercentage > 100 ? 
                    'Total excede 100%. Ajuste as porcentagens.' :
                    `Restam ${100 - totalPercentage}% para alocar.`
                  }
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CapitalDivisionCard;
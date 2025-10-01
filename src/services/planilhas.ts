import { Spreadsheet } from '../types';
import { SheetType, SheetListItem, SheetSearchParams } from '../types/sheets';
// supabase é importado indiretamente via funções do supabaseQueries
import { fetchSpreadsheets, 
  renameSpreadsheet as sbRenameSpreadsheet, 
  deleteSpreadsheet as sbDeleteSpreadsheet,
  createSpreadsheet as sbCreateSpreadsheet } from '../lib/supabaseQueries';

// Helper para converter uma planilha completa em item de lista com métricas
const convertToListItem = (sheet: Spreadsheet): SheetListItem => {
  let total = 0;

  if (sheet.type === 'investments') {
    total = sheet.rows.reduce((sum, row) => {
      return sum + ((row.quantity || 0) * (row.avgPrice || 0));
    }, 0);
  } else if (sheet.type === 'income') {
    total = sheet.rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  } else if (sheet.type === 'expenses') {
    total = sheet.rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  }

  return {
    id: sheet.id,
    name: sheet.name,
    type: sheet.type,
    createdAt: sheet.createdAt,
    metrics: {
      total,
      count: sheet.rows.length
    }
  };
};

// Obter planilhas por tipo com filtros
export async function fetchSheetsByType(
  type: SheetType, 
  params: SheetSearchParams = {}
): Promise<SheetListItem[]> {
  try {
    // Buscar todas as planilhas do usuário
    const allSheets = await fetchSpreadsheets();
    
    // Filtrar pelo tipo
    let filteredSheets = allSheets.filter(sheet => sheet.type === type);
    
    // Aplicar filtro de busca se existir
    if (params.query && params.query.trim()) {
      const query = params.query.toLowerCase().trim();
      filteredSheets = filteredSheets.filter(sheet => 
        sheet.name.toLowerCase().includes(query)
      );
    }
    
    // Aplicar filtro de período se existir
    if (params.period && params.period !== 'all') {
      const { month, year } = params.period;
      filteredSheets = filteredSheets.filter(sheet => {
        const createdDate = new Date(sheet.createdAt);
        return createdDate.getMonth() + 1 === month && 
               createdDate.getFullYear() === year;
      });
    }
    
    // Converter para lista com métricas
    const listItems = filteredSheets.map(convertToListItem);
    
    // Aplicar ordenação
    if (params.sortBy) {
      const direction = params.sortDirection === 'desc' ? -1 : 1;
      
      listItems.sort((a, b) => {
        switch(params.sortBy) {
          case 'name':
            return direction * a.name.localeCompare(b.name);
          case 'date':
            return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          case 'total':
            return direction * (a.metrics.total - b.metrics.total);
          default:
            return 0;
        }
      });
    } else {
      // Ordenação padrão por data de criação (mais recente primeiro)
      listItems.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    
    return listItems;
  } catch (error) {
    console.error('Erro ao buscar planilhas:', error);
    throw new Error('Não foi possível carregar as planilhas');
  }
}

// Obter uma planilha por ID
export async function fetchSheetById(id: string): Promise<Spreadsheet | null> {
  try {
    const allSheets = await fetchSpreadsheets();
    return allSheets.find(sheet => sheet.id === id) || null;
  } catch (error) {
    console.error('Erro ao buscar planilha:', error);
    throw new Error('Não foi possível carregar a planilha');
  }
}

// Renomear planilha
export async function renameSheet(id: string, name: string): Promise<void> {
  try {
    await sbRenameSpreadsheet(id, name);
  } catch (error) {
    console.error('Erro ao renomear planilha:', error);
    throw new Error('Não foi possível renomear a planilha');
  }
}

// Duplicar planilha
export async function duplicateSheet(id: string): Promise<string> {
  try {
    const sheet = await fetchSheetById(id);
    if (!sheet) throw new Error('Planilha não encontrada');
    
    // Criar nova planilha com nome indicando que é uma cópia
    const newName = `${sheet.name} (cópia)`;
    const newId = await sbCreateSpreadsheet(newName, sheet.type, sheet.columns);
    
    // Copiar as linhas da planilha original
    if (sheet.rows.length > 0) {
      const rowsData = sheet.rows.map(row => {
        const { id: _, ...rowData } = row;
        return rowData;
      });
      
      // Inserir as linhas na nova planilha
      // Nota: isso depende de uma função para inserir linhas que não está implementada
      // no código original disponível. Precisaria ser implementada.
      
      // await insertRows(newId, rowsData);
    }
    
    return newId;
  } catch (error) {
    console.error('Erro ao duplicar planilha:', error);
    throw new Error('Não foi possível duplicar a planilha');
  }
}

// Excluir planilha
export async function deleteSheet(id: string): Promise<void> {
  try {
    await sbDeleteSpreadsheet(id);
  } catch (error) {
    console.error('Erro ao excluir planilha:', error);
    throw new Error('Não foi possível excluir a planilha');
  }
}
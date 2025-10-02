// Esta linha foi removida porque React já é importado automaticamente
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BackButton from '../components/planilhas/BackButton';
import CreateButtons from '../components/planilhas/CreateButtons';
import SheetList from '../components/planilhas/SheetList';

// Mock da função window.history.back
const mockHistoryBack = jest.fn();
Object.defineProperty(window.history, 'back', { value: mockHistoryBack });
Object.defineProperty(window.history, 'length', { value: 2 });

describe('BackButton', () => {
  it('should render correctly', () => {
    const mockFallback = jest.fn();
    render(<BackButton fallback={mockFallback} />);
    
    const button = screen.getByRole('button', { name: /voltar para a página anterior/i });
    expect(button).toBeInTheDocument();
  });
  
  it('should call history.back when clicked and history is available', () => {
    const mockFallback = jest.fn();
    render(<BackButton fallback={mockFallback} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockHistoryBack).toHaveBeenCalled();
    expect(mockFallback).not.toHaveBeenCalled();
  });
  
  it('should call fallback when history is not available', () => {
    // Temporarily set history.length to 0
    const originalLength = window.history.length;
    Object.defineProperty(window.history, 'length', { value: 0 });
    
    const mockFallback = jest.fn();
    render(<BackButton fallback={mockFallback} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockFallback).toHaveBeenCalled();
    
    // Reset history.length
    Object.defineProperty(window.history, 'length', { value: originalLength });
  });
});

describe('CreateButtons', () => {
  it('should render all buttons correctly', () => {
    const mockFns = {
      onCreateInvestments: jest.fn(),
      onCreateExpenses: jest.fn(),
      onCreateIncome: jest.fn(),
    };
    
    render(<CreateButtons {...mockFns} />);
    
    expect(screen.getByText(/investimentos/i)).toBeInTheDocument();
    expect(screen.getByText(/despesas/i)).toBeInTheDocument();
    expect(screen.getByText(/entrada de capital/i)).toBeInTheDocument();
    expect(screen.getByText(/personalizada/i)).toBeInTheDocument();
    expect(screen.getByText(/em breve/i)).toBeInTheDocument();
  });
  
  it('should call appropriate handlers when buttons are clicked', () => {
    const mockFns = {
      onCreateInvestments: jest.fn(),
      onCreateExpenses: jest.fn(),
      onCreateIncome: jest.fn(),
    };
    
    render(<CreateButtons {...mockFns} />);
    
    fireEvent.click(screen.getByText(/investimentos/i));
    expect(mockFns.onCreateInvestments).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText(/despesas/i));
    expect(mockFns.onCreateExpenses).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText(/entrada de capital/i));
    expect(mockFns.onCreateIncome).toHaveBeenCalled();
  });
  
  it('should have "Em breve" badge on the customized button', () => {
    const mockFns = {
      onCreateInvestments: jest.fn(),
      onCreateExpenses: jest.fn(),
      onCreateIncome: jest.fn(),
    };
    
    render(<CreateButtons {...mockFns} />);
    
    const customButton = screen.getByText(/personalizada/i).closest('button');
    expect(customButton).toHaveAttribute('aria-disabled', 'true');
    expect(customButton).toHaveAttribute('title', 'Disponível em breve');
  });
});

// Mock para dados de planilhas
const mockSheets = [
  {
    id: '1',
    name: 'Investimentos 2023',
    type: 'investments' as const,
    createdAt: '2023-06-10T10:00:00Z',
    metrics: {
      total: 5000,
      count: 3
    }
  },
  {
    id: '2',
    name: 'Despesas Mensais',
    type: 'expenses' as const,
    createdAt: '2023-07-15T14:30:00Z',
    metrics: {
      total: 2500,
      count: 8
    }
  }
];

// Mock de funções para testar SheetList
jest.mock('../../services/planilhas', () => ({
  fetchSheetsByType: jest.fn().mockResolvedValue(mockSheets),
  renameSheet: jest.fn(),
  deleteSheet: jest.fn(),
  duplicateSheet: jest.fn()
}));

describe('SheetList', () => {
  it('should render list of sheets', async () => {
    const onOpenSheet = jest.fn();
    
    render(
      <SheetList 
        type="investments" 
        onOpenSheet={onOpenSheet} 
      />
    );
    
    // Verificar se os itens da lista são renderizados
    expect(await screen.findByText('Investimentos 2023')).toBeInTheDocument();
    expect(await screen.findByText('R$ 5.000,00')).toBeInTheDocument();
  });
  
  it('should call onOpenSheet when clicking open button', async () => {
    const onOpenSheet = jest.fn();
    
    render(
      <SheetList 
        type="investments" 
        onOpenSheet={onOpenSheet} 
      />
    );
    
    // Aguardar carregamento dos itens
    await screen.findByText('Investimentos 2023');
    
    // Clicar no botão de abrir
    const openButtons = await screen.findAllByLabelText('Abrir planilha');
    fireEvent.click(openButtons[0]);
    
    expect(onOpenSheet).toHaveBeenCalledWith('1');
  });
  
  it('should display search and filter controls', async () => {
    render(
      <SheetList 
        type="investments" 
        onOpenSheet={jest.fn()} 
      />
    );
    
    // Verificar se os controles de busca e filtro estão presentes
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
    expect(screen.getByText('Todos os períodos')).toBeInTheDocument();
  });
});

// Nota: Os testes para AnalyticsPanel seriam mais complexos e
// envolveriam mocks para renderização de gráficos, portanto
// não estão incluídos neste exemplo básico
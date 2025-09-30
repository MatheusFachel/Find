export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  isRecurring: boolean;
  dueDate?: string;
  status?: 'pending' | 'paid' | 'overdue';
}

export interface CapitalDivision {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  pendingBills: number;
  overdueCount: number;
}

export interface SpreadsheetRow {
  id: string;
  [key: string]: any;
}

export interface SpreadsheetColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
}

export interface Spreadsheet {
  id: string;
  name: string;
  type: 'investments' | 'income' | 'expenses';
  columns: SpreadsheetColumn[];
  rows: SpreadsheetRow[];
  createdAt: string;
}
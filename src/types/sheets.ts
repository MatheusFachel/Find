// Tipos expandidos para a nova interface de planilhas
export type SheetType = 'investments' | 'income' | 'expenses';

export interface SheetListItem {
  id: string;
  name: string;
  type: SheetType;
  createdAt: string;
  metrics: {
    total: number;
    count?: number;
    additionalMetric?: {
      label: string;
      value: number | string;
    };
  };
}

export interface SheetSearchParams {
  query?: string;
  period?: {
    month: number;
    year: number;
  } | 'all';
  sortBy?: 'name' | 'date' | 'total';
  sortDirection?: 'asc' | 'desc';
}

export interface SheetAnalytics {
  type: 'cashflow' | 'expenses' | 'investments' | 'goals';
  title: string;
  period: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }[];
  };
}

export interface AnalyticsParams {
  period: string | { start: string; end: string };
  groupBy: 'month' | 'year' | 'category';
  currency?: string;
}
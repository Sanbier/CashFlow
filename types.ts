
export interface Income {
  id: number;
  source: string;
  amount: number;
  date: string;
  note?: string;
  relatedDebtId?: number | null;
  debtAction?: 'collect' | null;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
  note?: string;
  relatedDebtId?: number | null;
  debtAction?: 'repay' | 'lend' | null;
}

export interface FixedTemplateItem {
  category: string;
  amount: number;
}

export interface Debt {
  id: number;
  name: string;
  total: number;
  paid: number;
  note?: string;
  type: 'payable' | 'receivable';
  updatedAt: string;
}

export type TabType = 'add' | 'debt' | 'report' | 'savings' | 'history' | 'settings';

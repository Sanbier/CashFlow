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

export type HistoryItem =
  | (Income & { type: 'income' })
  | (Expense & { type: 'expense' });

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

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface FamilyCloudData {
  incomes: Income[];
  expenses: Expense[];
  fixedTemplate: FixedTemplateItem[];
  categories: string[];
  debts: Debt[];
  fixedTracking: Record<string, string[]>;
  lastUpdate: string;
  encrypted?: boolean;
  cipherPayload?: string;
  iv?: string;
  salt?: string;
}

export type UpdateDebtsHandler = (
  newDebts: Debt[] | null,
  newItem?: Debt,
  isEditId?: number | null,
  autoCreateTransaction?: boolean
) => void;

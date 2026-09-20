export interface Income {
  id: number;
  source: string;
  amount: number;
  date: string;
  note?: string;
  relatedDebtId?: number | null;
  debtAction?: 'collect' | null;
  incomeType?: 'salary' | 'loan' | 'other';
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
  monthlyQuota?: number; // Trả / Thu mỗi tháng (VD: 1.500.000đ)
  deadline?: string;     // Hạn trả / thu (VD: "01/12/2029")
}

export type TabType =
  | 'add'
  | 'budget'
  | 'childSchool'
  | 'cashflow12M'
  | 'history'
  | 'settings'
  // Legacy aliases for backward compatibility:
  | 'debt'
  | 'report'
  | 'savings';

export type BudgetWarningStatus = 'surplus' | 'deficit' | 'balanced';

export interface CategoryBudgetStatus {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetWarningStatus;
  statusText: string;
}

// Child Education Interfaces (Sheet 3: Theo dõi lịch học con)
export type AttendanceStatus = 'hoc' | 'nghi';

export interface DayAttendanceRecord {
  status: AttendanceStatus;
  note?: string;
}

export interface AllowanceItem {
  id: string;
  name: string;
  amount: number;
  enabled: boolean;
}

export interface ChildEducationConfig {
  regularDayFee: number;      // Đơn giá 1 ngày học thường (VD: 32.000đ)
  saturdayFee: number;        // Đơn giá học thêm Thứ 7 / buổi (VD: 50.000đ)
  monthlyAllowances: AllowanceItem[]; // Phụ cấp cố định hàng tháng (Ăn, Bán trú, Nước, Anh văn...)
  annualAllowances: AllowanceItem[];  // Phụ cấp đầu năm (Sách vở, Dụng cụ, Đồng phục, Bảo hiểm...)
  applyAnnualAllowanceMonth?: number | null; // Tháng áp dụng phụ cấp đầu năm (mặc định: tháng 9)
}

export interface ChildTuitionPayment {
  month: number;
  year: number;
  calculatedFee: number;
  actualPaid: number;
  status: 'paid' | 'partial' | 'unpaid';
  note?: string;
}

export interface ChildEducationData {
  config: ChildEducationConfig;
  attendance: Record<string, DayAttendanceRecord>; // Key: "YYYY-MM-DD"
  payments: Record<string, ChildTuitionPayment>;     // Key: "YYYY-M"
}

// 12-Month Cashflow Interfaces (Sheet 2: THU CHI NAM 2026)
export interface MonthCashFlowRow {
  month: number;
  year: number;
  startingBalance: number;
  salaryIncome: number;
  loanIncome: number;
  otherIncome: number;
  totalIncome: number;
  expensesByCategory: Record<string, number>;
  totalLivingExpense: number;
  savingsAllocation: number;
  totalExpense: number;
  netBalance: number;
  closingBalance: number;
  status: 'surplus' | 'deficit' | 'balanced';
  statusText: string;
}

export interface AnnualDashboardKPI {
  totalAnnualIncome: number;
  totalAnnualExpense: number;
  totalAnnualSavings: number;
  highestExpenseMonth: { month: number; amount: number } | null;
  lowestExpenseMonth: { month: number; amount: number } | null;
  highestSurplusMonth: { month: number; amount: number } | null;
  averageMonthlyExpense: number;
  savingsRate: number;
}

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
  categoryBudgets?: Record<string, number>;
  childEducation?: ChildEducationData;
  initialYearBalance?: Record<number, number>;
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

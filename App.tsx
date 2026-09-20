import React, { useState, useMemo } from 'react';
import { TabType, UpdateDebtsHandler, MonthCashFlowRow } from './types';
import { formatCurrency, formatDate, getMonthDateRange, computeAnnualCashFlow } from './utils';
import { useFinancialData } from './hooks/useFinancialData';
import { DEFAULT_FIREBASE_CONFIG_STR, DEFAULT_FAMILY_CODE } from './constants';

// Components
import TabAdd from './components/TabAdd';
import TabBudget from './components/TabBudget';
import TabChildSchool from './components/TabChildSchool';
import TabCashFlow12M from './components/TabCashFlow12M';
import TabHistory from './components/TabHistory';
import TabSettings from './components/TabSettings';
import AppLayout from './components/AppLayout';

// Modals
import ModalCloudConfig from './components/modals/ModalCloudConfig';
import ModalReloadConfirm from './components/modals/ModalReloadConfirm';

const App: React.FC = () => {
  // 1. Master View & UI States (Single source of truth for Month & Year)
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [activeTab, setActiveTab] = useState<TabType>('add');
  const [autoCreateTransaction, setAutoCreateTransaction] = useState(true);

  // Month Navigation Handlers (Synchronized across all tabs)
  const handlePrevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const handleSelectMonth = (month: number, year: number) => {
    setViewDate(new Date(year, month - 1, 1));
    setActiveTab('budget');
  };

  // Modal Visibility States
  const [showReloadConfirm, setShowReloadConfirm] = useState(false);
  const [showCloudForm, setShowCloudForm] = useState(false);

  // 2. Data Logic (Load from Custom Hook - Default to Provided Firebase Config)
  const [firebaseConfigStr] = useState(() => {
    const saved = (localStorage.getItem('fb_config') || '').trim();
    if (saved) {
      try {
        JSON.parse(saved);
        return saved;
      } catch {
        // Fall back to default if saved value is invalid
      }
    }
    return DEFAULT_FIREBASE_CONFIG_STR;
  });

  const [familyCode] = useState(() => {
    const saved = (localStorage.getItem('fb_family_code') || '').trim().toUpperCase();
    return saved || DEFAULT_FAMILY_CODE;
  });

  const {
    incomes,
    expenses,
    debts,
    categories,
    categoryBudgets,
    childEducation,
    initialYearBalance,
    isConnected,
    isSyncing,
    syncError,
    projectId,
    addIncome,
    addExpense,
    updateDebts,
    deleteItem,
    updateNote,
    updateTransaction,
    updateCategories,
    updateCategoryBudgets,
    toggleChildAttendance,
    updateChildEducationConfig,
    updateChildPayment,
    syncChildFeeToExpense,
    updateInitialYearBalance,
  } = useFinancialData(firebaseConfigStr, familyCode);

  // 3. Strict Calendar Month Range ("Tháng nào ra tháng đó": 01/MM/YYYY -> lastDay/MM/YYYY)
  const { startDate, endDate } = useMemo(
    () => getMonthDateRange(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  // 4. Continuous 12-Month Rollover Cash Flow Engine (Sheet 2: THU CHI NAM)
  const { monthRows } = useMemo(() => {
    return computeAnnualCashFlow(
      viewDate.getFullYear(),
      incomes,
      expenses,
      initialYearBalance
    );
  }, [viewDate, incomes, expenses, initialYearBalance]);

  const currentMonthCashFlow: MonthCashFlowRow = useMemo(() => {
    const m = viewDate.getMonth() + 1;
    return (
      monthRows.find((r) => r.month === m) || {
        month: m,
        year: viewDate.getFullYear(),
        startingBalance: 0,
        salaryIncome: 0,
        loanIncome: 0,
        otherIncome: 0,
        totalNewIncome: 0,
        totalIncome: 0,
        expensesByCategory: {},
        totalLivingExpense: 0,
        savingsAllocation: 0,
        totalExpense: 0,
        netBalance: 0,
        closingBalance: 0,
        status: 'balanced',
        statusText: 'CÂN BẰNG',
      }
    );
  }, [monthRows, viewDate]);

  // Filter transactions for History & Monthly Paid in Active Month
  const { filteredIncomes, filteredExpenses } = useMemo(() => {
    const filter = <T extends { date: string }>(items: T[]): T[] =>
      items.filter((item) => {
        const d = new Date(item.date);
        return d >= startDate && d <= endDate;
      });
    return { filteredIncomes: filter(incomes), filteredExpenses: filter(expenses) };
  }, [incomes, expenses, startDate, endDate]);

  const isOverBudget =
    currentMonthCashFlow.totalIncome > 0 &&
    currentMonthCashFlow.totalExpense / currentMonthCashFlow.totalIncome > 0.9;

  // 5. Handlers
  const handleUpdateDebtsWrapper: UpdateDebtsHandler = (
    newDebts,
    newItem,
    isEditId,
    autoCreate = autoCreateTransaction
  ) => {
    updateDebts(newDebts, newItem, isEditId, autoCreate);
  };

  return (
    <AppLayout
      viewDate={viewDate}
      onPrevMonth={handlePrevMonth}
      onNextMonth={handleNextMonth}
      startDate={startDate}
      endDate={endDate}
      sumIncome={currentMonthCashFlow.totalIncome}
      sumExpense={currentMonthCashFlow.totalExpense}
      startingBalance={currentMonthCashFlow.startingBalance}
      balance={currentMonthCashFlow.closingBalance}
      isConnected={isConnected}
      isSyncing={isSyncing}
      syncError={syncError}
      familyCode={familyCode}
      onOpenCloud={() => setShowCloudForm(true)}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isOverBudget={isOverBudget}
      onReload={() => setShowReloadConfirm(true)}
      modals={
        <>
          <ModalCloudConfig
            isOpen={showCloudForm}
            onClose={() => setShowCloudForm(false)}
            currentCode={familyCode}
            currentConfig={firebaseConfigStr}
          />
          <ModalReloadConfirm
            isOpen={showReloadConfirm}
            onClose={() => setShowReloadConfirm(false)}
            onConfirm={() => window.location.reload()}
          />
        </>
      }
    >
      {/* 1. Tab Nhập (Add) */}
      {activeTab === 'add' && (
        <TabAdd
          viewDate={viewDate}
          categories={categories}
          debts={debts}
          categoryBudgets={categoryBudgets}
          onAddIncome={addIncome}
          onAddExpense={addExpense}
          getMonthlyPaid={(cat) =>
            filteredExpenses
              .filter((e) => e.category === cat)
              .reduce((sum, item) => sum + item.amount, 0)
          }
          onUpdateCategories={updateCategories}
        />
      )}

      {/* 2. Tab Sinh Hoạt (Sheet 1: Ngân Sách 9 Nhóm & Sổ Nợ) */}
      {activeTab === 'budget' && (
        <TabBudget
          viewDate={viewDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          monthCashFlow={currentMonthCashFlow}
          incomes={incomes}
          expenses={expenses}
          debts={debts}
          categoryBudgets={categoryBudgets}
          onUpdateCategoryBudgets={updateCategoryBudgets}
          onUpdateDebts={handleUpdateDebtsWrapper}
          autoCreateTransaction={autoCreateTransaction}
          setAutoCreateTransaction={setAutoCreateTransaction}
        />
      )}

      {/* 3. Tab Lịch Học (Sheet 3: Điểm Danh & Biểu Phí Con) */}
      {activeTab === 'childSchool' && (
        <TabChildSchool
          viewDate={viewDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          childEducation={childEducation}
          onToggleAttendance={toggleChildAttendance}
          onUpdateConfig={updateChildEducationConfig}
          onUpdatePayment={updateChildPayment}
          onSyncToExpense={syncChildFeeToExpense}
        />
      )}

      {/* 4. Tab Dòng Tiền (Sheet 2: Ma Trận 12 Tháng & 8 KPI Năm) */}
      {activeTab === 'cashflow12M' && (
        <TabCashFlow12M
          viewDate={viewDate}
          onSelectMonth={handleSelectMonth}
          incomes={incomes}
          expenses={expenses}
          initialYearBalance={initialYearBalance}
          onUpdateInitialBalance={updateInitialYearBalance}
        />
      )}

      {/* 5. Tab Lịch Sử (History) */}
      {activeTab === 'history' && (
        <TabHistory
          incomes={filteredIncomes}
          expenses={filteredExpenses}
          allIncomes={incomes}
          allExpenses={expenses}
          viewDate={viewDate}
          onDelete={deleteItem}
          onUpdateNote={updateNote}
          onUpdateTransaction={updateTransaction}
          categories={categories}
        />
      )}

      {/* 6. Tab Cài Đặt (Settings) */}
      {activeTab === 'settings' && (
        <TabSettings
          isConnected={isConnected}
          projectId={projectId}
          familyCode={familyCode}
          onReload={() => window.location.reload()}
          onOpenCloudForm={() => setShowCloudForm(true)}
        />
      )}
    </AppLayout>
  );
};

export default App;

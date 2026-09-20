import React, { useState, useMemo } from 'react';
import { SAVING_CATEGORIES } from './constants';
import { TabType, UpdateDebtsHandler } from './types';
import { formatCurrency, formatDate } from './utils';
import { useFinancialData } from './hooks/useFinancialData';

// Components
import TabAdd from './components/TabAdd';
import TabBudget from './components/TabBudget';
import TabChildSchool from './components/TabChildSchool';
import TabCashFlow12M from './components/TabCashFlow12M';
import TabHistory from './components/TabHistory';
import TabSettings from './components/TabSettings';
import AppLayout from './components/AppLayout';

// Legacy fallbacks
import TabDebt from './components/TabDebt';
import TabReport from './components/TabReport';
import TabSavings from './components/TabSavings';

// Modals
import ModalSaving from './components/modals/ModalSaving';
import ModalCloudConfig from './components/modals/ModalCloudConfig';
import ModalReloadConfirm from './components/modals/ModalReloadConfirm';
import ModalFixedTracking from './components/modals/ModalFixedTracking';
import ModalFixedConfig from './components/modals/ModalFixedConfig';

const App: React.FC = () => {
  // 1. View & UI States
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    if (today.getDate() > 30) {
      today.setMonth(today.getMonth() + 1);
      today.setDate(1);
    }
    return today;
  });
  const [activeTab, setActiveTab] = useState<TabType>('add');
  const [autoCreateTransaction, setAutoCreateTransaction] = useState(true);

  // Modal Visibility States
  const [showReloadConfirm, setShowReloadConfirm] = useState(false);
  const [showFixedConfig, setShowFixedConfig] = useState(false);
  const [showFixedTrackingModal, setShowFixedTrackingModal] = useState(false);
  const [showSavingForm, setShowSavingForm] = useState(false);
  const [showCloudForm, setShowCloudForm] = useState(false);

  // 2. Data Logic (Load from Custom Hook)
  const [firebaseConfigStr] = useState(() => localStorage.getItem('fb_config') || '');
  const [familyCode] = useState(() =>
    (localStorage.getItem('fb_family_code') || '').trim().toUpperCase()
  );

  const {
    incomes,
    expenses,
    debts,
    fixedTemplate,
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
    addSavings,
    updateCategories,
    confirmFixedItem,
    saveFixedConfig,
    updateCategoryBudgets,
    toggleChildAttendance,
    updateChildEducationConfig,
    updateChildPayment,
    syncChildFeeToExpense,
    updateInitialYearBalance,
  } = useFinancialData(firebaseConfigStr, familyCode);

  // 3. Derived State (Fiscal range for month summary)
  const getFiscalRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDate = new Date(year, month, 0);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  };

  const { startDate, endDate } = useMemo(() => getFiscalRange(viewDate), [viewDate]);

  const { filteredIncomes, filteredExpenses } = useMemo(() => {
    const filter = <T extends { date: string }>(items: T[]): T[] =>
      items.filter((item) => {
        const d = new Date(item.date);
        return d >= startDate && d <= endDate;
      });
    return { filteredIncomes: filter(incomes), filteredExpenses: filter(expenses) };
  }, [incomes, expenses, startDate, endDate]);

  const sumIncomeMonth = useMemo(
    () => filteredIncomes.reduce((a, c) => a + c.amount, 0),
    [filteredIncomes]
  );
  const sumExpenseMonth = useMemo(
    () => filteredExpenses.reduce((a, c) => a + c.amount, 0),
    [filteredExpenses]
  );
  const balance = sumIncomeMonth - sumExpenseMonth;
  const isOverBudget = sumIncomeMonth > 0 && sumExpenseMonth / sumIncomeMonth > 0.9;
  const totalAccumulatedSavings = useMemo(
    () =>
      SAVING_CATEGORIES.map((cat) =>
        expenses.filter((e) => e.category === cat).reduce((sum, item) => sum + item.amount, 0)
      ).reduce((acc, curr) => acc + curr, 0),
    [expenses]
  );

  // 4. Handlers
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
      onPrevMonth={() =>
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 15))
      }
      onNextMonth={() =>
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 15))
      }
      startDate={startDate}
      endDate={endDate}
      sumIncome={sumIncomeMonth}
      sumExpense={sumExpenseMonth}
      isConnected={isConnected}
      isSyncing={isSyncing}
      syncError={syncError}
      familyCode={familyCode}
      onOpenCloud={() => setShowCloudForm(true)}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isOverBudget={isOverBudget}
      balance={balance}
      onOpenFixedTracking={() => setShowFixedTrackingModal(true)}
      onReload={() => setShowReloadConfirm(true)}
      modals={
        <>
          <ModalSaving
            isOpen={showSavingForm}
            onClose={() => setShowSavingForm(false)}
            onSave={addSavings}
          />
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
          <ModalFixedTracking
            isOpen={showFixedTrackingModal}
            onClose={() => setShowFixedTrackingModal(false)}
            viewDate={viewDate}
            fixedTemplate={fixedTemplate}
            expenses={filteredExpenses}
            onConfirmPayment={(item, amt) => confirmFixedItem(item, amt, viewDate)}
          />
          <ModalFixedConfig
            isOpen={showFixedConfig}
            onClose={() => setShowFixedConfig(false)}
            categories={categories}
            fixedTemplate={fixedTemplate}
            onSave={saveFixedConfig}
          />
        </>
      }
    >
      {/* 1. Tab Nhập (Add) */}
      {activeTab === 'add' && (
        <TabAdd
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
      {(activeTab === 'budget' || activeTab === 'debt') && (
        <TabBudget
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
          childEducation={childEducation}
          onToggleAttendance={toggleChildAttendance}
          onUpdateConfig={updateChildEducationConfig}
          onUpdatePayment={updateChildPayment}
          onSyncToExpense={syncChildFeeToExpense}
        />
      )}

      {/* 4. Tab Dòng Tiền (Sheet 2: Ma Trận 12 Tháng & 8 KPI Năm) */}
      {(activeTab === 'cashflow12M' || activeTab === 'report') && (
        <TabCashFlow12M
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
          onDelete={deleteItem}
          onUpdateNote={updateNote}
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
          onOpenFixedConfig={() => setShowFixedConfig(true)}
          onOpenCloudForm={() => setShowCloudForm(true)}
        />
      )}

      {/* Legacy Savings Tab support if accessed directly */}
      {activeTab === 'savings' && (
        <TabSavings
          totalAccumulated={totalAccumulatedSavings}
          expenses={expenses}
          onOpenSavingForm={() => setShowSavingForm(true)}
        />
      )}
    </AppLayout>
  );
};

export default App;

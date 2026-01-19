
import React, { useState, useMemo } from 'react';
import { SAVING_CATEGORIES } from './constants';
import { TabType } from './types';
import { formatCurrency, formatDate } from './utils';
import { useFinancialData } from './hooks/useFinancialData';

// Components
import TabAdd from './components/TabAdd';
import TabDebt from './components/TabDebt';
import TabHistory from './components/TabHistory';
import TabReport from './components/TabReport';
import TabSavings from './components/TabSavings';
import TabSettings from './components/TabSettings';
import AppLayout from './components/AppLayout';

// Modals
import ModalSaving from './components/modals/ModalSaving';
import ModalCloudConfig from './components/modals/ModalCloudConfig';
import ModalReloadConfirm from './components/modals/ModalReloadConfirm';
import ModalFixedTracking from './components/modals/ModalFixedTracking';
import ModalFixedConfig from './components/modals/ModalFixedConfig';

declare const XLSX: any;

const App: React.FC = () => {
    // 1. View & UI States (Chỉ giữ lại State liên quan đến View)
    const [viewDate, setViewDate] = useState(() => {
        const today = new Date();
        if (today.getDate() > 30) { today.setMonth(today.getMonth() + 1); today.setDate(1); }
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
    const [familyCode] = useState(() => (localStorage.getItem('fb_family_code') || '').trim().toUpperCase());

    const {
        incomes, expenses, debts, fixedTemplate, categories,
        isConnected, isSyncing, syncError, projectId,
        addIncome, addExpense, updateDebts, deleteItem, updateNote, addSavings, updateCategories, confirmFixedItem, saveFixedConfig
    } = useFinancialData(firebaseConfigStr, familyCode);

    // 3. Derived State (Tính toán dựa trên ViewDate)
    const getFiscalRange = (date: Date) => { 
        const year = date.getFullYear(), month = date.getMonth(); 
        const startDate = new Date(year, month, 0); 
        startDate.setHours(0,0,0,0); 
        const endDate = new Date(year, month + 1, 0); 
        endDate.setDate(endDate.getDate() - 1); 
        endDate.setHours(23,59,59,999); 
        return { startDate, endDate }; 
    };
    
    const { startDate, endDate } = useMemo(() => getFiscalRange(viewDate), [viewDate]);

    const { filteredIncomes, filteredExpenses } = useMemo(() => {
        const filter = (items: any[]) => items.filter(item => {
            const d = new Date(item.date);
            return (d >= startDate && d <= endDate);
        });
        return { filteredIncomes: filter(incomes), filteredExpenses: filter(expenses) };
    }, [incomes, expenses, startDate, endDate]);

    const sumIncomeMonth = useMemo(() => filteredIncomes.reduce((a, c) => a + c.amount, 0), [filteredIncomes]);
    const sumExpenseMonth = useMemo(() => filteredExpenses.reduce((a, c) => a + c.amount, 0), [filteredExpenses]);
    const balance = sumIncomeMonth - sumExpenseMonth;
    const isOverBudget = sumIncomeMonth > 0 && (sumExpenseMonth / sumIncomeMonth) > 0.9;
    const totalAccumulatedSavings = useMemo(() => SAVING_CATEGORIES.map(cat => expenses.filter(e => e.category === cat).reduce((sum, item) => sum + item.amount, 0)).reduce((acc, curr) => acc + curr, 0), [expenses]);

    // 4. Handlers (Chỉ là cầu nối UI -> Hook)
    const handleUpdateDebtsWrapper = (newDebts: any, newItem: any, isEditId: any) => {
        updateDebts(newDebts, newItem, isEditId, autoCreateTransaction);
    };

    const handleExportExcel = () => {
        if (typeof XLSX === 'undefined') { alert("Lỗi tải thư viện"); return; }
        const wb = XLSX.utils.book_new();
        const incData = filteredIncomes.map(i => ({ "Ngày": formatDate(i.date), "Nguồn": i.source, "Số tiền": i.amount, "Ghi chú": i.note }));
        const expData = filteredExpenses.map(e => ({ "Ngày": formatDate(e.date), "Danh mục": e.category, "Số tiền": e.amount, "Ghi chú": e.note }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incData), "Thu Nhập");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expData), "Chi Tiêu");
        XLSX.writeFile(wb, `BaoCao_${viewDate.getMonth()+1}.xlsx`);
    };

    return (
        <AppLayout
            viewDate={viewDate}
            onPrevMonth={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 15))}
            onNextMonth={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 15))}
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
                    <ModalSaving isOpen={showSavingForm} onClose={() => setShowSavingForm(false)} onSave={addSavings} />
                    <ModalCloudConfig isOpen={showCloudForm} onClose={() => setShowCloudForm(false)} currentCode={familyCode} currentConfig={firebaseConfigStr} />
                    <ModalReloadConfirm isOpen={showReloadConfirm} onClose={() => setShowReloadConfirm(false)} onConfirm={() => window.location.reload()} />
                    <ModalFixedTracking isOpen={showFixedTrackingModal} onClose={() => setShowFixedTrackingModal(false)} viewDate={viewDate} fixedTemplate={fixedTemplate} expenses={filteredExpenses} onConfirmPayment={(item, amt) => confirmFixedItem(item, amt, viewDate)} />
                    <ModalFixedConfig isOpen={showFixedConfig} onClose={() => setShowFixedConfig(false)} categories={categories} fixedTemplate={fixedTemplate} onSave={saveFixedConfig} />
                </>
            }
        >
            {activeTab === 'add' && <TabAdd categories={categories} debts={debts} onAddIncome={addIncome} onAddExpense={addExpense} getMonthlyPaid={(cat) => filteredExpenses.filter(e => e.category === cat).reduce((sum, item) => sum + item.amount, 0)} onUpdateCategories={updateCategories} />}
            {activeTab === 'debt' && <TabDebt debts={debts} onUpdateDebts={handleUpdateDebtsWrapper} autoCreateTransaction={autoCreateTransaction} setAutoCreateTransaction={setAutoCreateTransaction} />}
            {/* Đã sửa prop từ sumIncome sang sumExpense */}
            {activeTab === 'report' && <TabReport expenses={filteredExpenses} sumExpense={sumExpenseMonth} />}
            {activeTab === 'savings' && <TabSavings totalAccumulated={totalAccumulatedSavings} expenses={expenses} onOpenSavingForm={()=>setShowSavingForm(true)} />}
            {activeTab === 'history' && <TabHistory incomes={filteredIncomes} expenses={filteredExpenses} onDelete={deleteItem} onUpdateNote={updateNote} categories={categories} />}
            {activeTab === 'settings' && <TabSettings isConnected={isConnected} projectId={projectId} familyCode={familyCode} onReload={()=>window.location.reload()} onOpenFixedConfig={()=>setShowFixedConfig(true)} onExportExcel={handleExportExcel} onOpenCloudForm={()=>setShowCloudForm(true)} />}
        </AppLayout>
    );
};

export default App;


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  DEBT_CATEGORY_NAME, 
  SAVING_CATEGORIES, 
  DEFAULT_CATEGORIES, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CalendarIcon, 
  RefreshCw, 
  SettingsIcon, 
  AlertTriangle, 
  X, 
  Cloud, 
  CloudOff, 
  PiggyBank, 
  MessageCircle, 
  Clock,
  ChevronLeft,
  ChevronRight
} from './constants';
import { Income, Expense, Debt, FixedTemplateItem, TabType } from './types';
import { formatCurrency, formatDate, parseAmount, handleAmountInput, getCombinedDate, handleTextInput } from './utils';
import CustomDatePicker from './components/CustomDatePicker';
import TabAdd from './components/TabAdd';
import TabDebt from './components/TabDebt';
import TabHistory from './components/TabHistory';
import TabReport from './components/TabReport';
import TabSavings from './components/TabSavings';
import TabSettings from './components/TabSettings';

declare const firebase: any;
declare const XLSX: any;

const App: React.FC = () => {
    const getLocalToday = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // States
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [fixedTemplate, setFixedTemplate] = useState<FixedTemplateItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [fixedTracking, setFixedTracking] = useState<Record<string, string[]>>({}); 
    
    const [viewDate, setViewDate] = useState(() => {
        const today = new Date();
        if (today.getDate() > 30) { today.setMonth(today.getMonth() + 1); today.setDate(1); }
        return today;
    });
    
    const [activeTab, setActiveTab] = useState<TabType>('add');
    const [showReloadConfirm, setShowReloadConfirm] = useState(false);
    const [showFixedConfig, setShowFixedConfig] = useState(false);
    const [showFixedTrackingModal, setShowFixedTrackingModal] = useState(false); 
    const [tempFixedList, setTempFixedList] = useState<Record<string, number>>({});
    const [fixedPaymentInputs, setFixedPaymentInputs] = useState<Record<string, string>>({});

    // Saving States for Modal
    const [showSavingForm, setShowSavingForm] = useState(false);
    const [savingAmount, setSavingAmount] = useState('');
    const [savingCategory, setSavingCategory] = useState(SAVING_CATEGORIES[0]);
    const [savingNote, setSavingNote] = useState('');
    const [savingDate, setSavingDate] = useState(getLocalToday());

    // Firebase Sync States
    const [firebaseConfigStr, setFirebaseConfigStr] = useState(() => localStorage.getItem('fb_config') || '');
    const [familyCode, setFamilyCode] = useState(() => (localStorage.getItem('fb_family_code') || '').trim().toUpperCase());
    const [isConnected, setIsConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showCloudForm, setShowCloudForm] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [projectId, setProjectId] = useState<string>('');
    const [autoCreateTransaction, setAutoCreateTransaction] = useState(true);

    const dbRef = useRef<any>(null);

    // Initial Load & Firebase Handlers
    useEffect(() => {
        const loadLocal = () => {
            const localIncomes = JSON.parse(localStorage.getItem('family_incomes') || '[]');
            const localExpenses = JSON.parse(localStorage.getItem('family_expenses') || '[]');
            const localFixed = JSON.parse(localStorage.getItem('family_fixed_template') || '[]');
            const localFixedTracking = JSON.parse(localStorage.getItem('family_fixed_tracking') || '{}');
            const localCats = JSON.parse(localStorage.getItem('family_categories') || JSON.stringify(DEFAULT_CATEGORIES));
            const localDebts = JSON.parse(localStorage.getItem('family_debts') || '[]');
            
            setIncomes(localIncomes); 
            setExpenses(localExpenses); 
            setFixedTemplate(localFixed); 
            setCategories(localCats); 
            setDebts(localDebts); 
            setFixedTracking(localFixedTracking);
            
            return { incomes: localIncomes, expenses: localExpenses, fixedTemplate: localFixed, categories: localCats, debts: localDebts, fixedTracking: localFixedTracking };
        };

        const localData = loadLocal();

        if (firebaseConfigStr && familyCode) {
            try {
                const config = JSON.parse(firebaseConfigStr);
                setProjectId(config.projectId || 'Unknown');
                
                if (!firebase.apps.length) {
                    firebase.initializeApp(config);
                }
                const db = firebase.firestore();
                dbRef.current = db;
                
                setIsConnected(true);
                setIsSyncing(true);
                setSyncError(null);

                const unsubscribe = db.collection('families').doc(familyCode).onSnapshot((doc: any) => {
                    if (doc.exists) { 
                        const data = doc.data(); 
                        setIncomes(data.incomes || []); 
                        setExpenses(data.expenses || []); 
                        setFixedTemplate(data.fixedTemplate || []);
                        setCategories(data.categories || DEFAULT_CATEGORIES);
                        setDebts(data.debts || []);
                        setFixedTracking(data.fixedTracking || {});

                        localStorage.setItem('family_incomes', JSON.stringify(data.incomes || []));
                        localStorage.setItem('family_expenses', JSON.stringify(data.expenses || []));
                        localStorage.setItem('family_fixed_template', JSON.stringify(data.fixedTemplate || []));
                        localStorage.setItem('family_categories', JSON.stringify(data.categories || DEFAULT_CATEGORIES));
                        localStorage.setItem('family_debts', JSON.stringify(data.debts || []));
                        localStorage.setItem('family_fixed_tracking', JSON.stringify(data.fixedTracking || {}));
                        setSyncError(null);
                    } else { 
                        if (localData.incomes.length > 0 || localData.expenses.length > 0 || localData.debts.length > 0) {
                            db.collection('families').doc(familyCode).set({ 
                                incomes: localData.incomes, 
                                expenses: localData.expenses, 
                                fixedTemplate: localData.fixedTemplate, 
                                categories: localData.categories, 
                                debts: localData.debts, 
                                fixedTracking: localData.fixedTracking, 
                                lastUpdate: new Date().toISOString()
                            });
                        }
                    }
                    setIsSyncing(false);
                }, (error: any) => { 
                    console.error("Firebase Sync Error:", error); 
                    setIsConnected(false);
                    setIsSyncing(false);
                    setSyncError(error.message || "Lỗi quyền truy cập Firebase");
                });
                return () => unsubscribe();
            } catch (e) { 
                setIsConnected(false); 
                setSyncError("Cấu hình JSON không hợp lệ");
            }
        }
    }, [firebaseConfigStr, familyCode]);

    const saveData = (newIncomes: Income[], newExpenses: Expense[], newFixed = fixedTemplate, newCats = categories, newDebts = debts, newTracking = fixedTracking) => {
        setIncomes(newIncomes); 
        setExpenses(newExpenses); 
        setFixedTemplate(newFixed); 
        setCategories(newCats); 
        setDebts(newDebts); 
        setFixedTracking(newTracking);

        localStorage.setItem('family_incomes', JSON.stringify(newIncomes));
        localStorage.setItem('family_expenses', JSON.stringify(newExpenses));
        localStorage.setItem('family_fixed_template', JSON.stringify(newFixed));
        localStorage.setItem('family_categories', JSON.stringify(newCats));
        localStorage.setItem('family_debts', JSON.stringify(newDebts));
        localStorage.setItem('family_fixed_tracking', JSON.stringify(newTracking));
        
        if (isConnected && dbRef.current && familyCode) {
            setIsSyncing(true);
            dbRef.current.collection('families').doc(familyCode).set({ 
                incomes: newIncomes, 
                expenses: newExpenses, 
                fixedTemplate: newFixed, 
                categories: newCats, 
                debts: newDebts, 
                fixedTracking: newTracking,
                lastUpdate: new Date().toISOString()
            }).then(() => {
                setIsSyncing(false);
            }).catch((err: any) => {
                setIsSyncing(false);
                setSyncError(err.message);
            });
        }
    };

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

    const getMonthlyPaidForCategory = (catName: string) => {
        return filteredExpenses.filter(e => e.category === catName).reduce((acc, item) => acc + item.amount, 0);
    };

    // Handlers passed to Tabs
    const onAddIncome = (source: string, amount: number, dateInput: string, note: string) => {
         const newItem: Income = { id: Date.now(), source, amount, date: getCombinedDate(dateInput), note };
         saveData([newItem, ...incomes], expenses);
    };

    const onAddExpense = (category: string, amount: number, dateInput: string, note: string, whoSpent: 'Ba' | 'Mẹ', selectedDebtorId: string) => {
        let updatedDebts = debts; 
        let finalNote = note; 
        let linkedDebtId = null; 
        let actionType: any = null;
        
        if (category === "Cá Nhân (Ba-Mẹ)") {
            finalNote = `[${whoSpent}] ${note}`.trim();
        }

        if (category === DEBT_CATEGORY_NAME) {
            if (!selectedDebtorId) { alert("Vui lòng chọn người liên quan!"); return; }
            const debtItem = debts.find(d => d.id === Number(selectedDebtorId));
            if (debtItem) {
                linkedDebtId = debtItem.id;
                if (debtItem.type === 'receivable') {
                    const newPaid = debtItem.paid + amount;
                    updatedDebts = debts.map(d => d.id === debtItem.id ? { ...d, paid: newPaid, updatedAt: new Date().toISOString() } : d);
                    const newItem: Income = { id: Date.now(), source: `Thu nợ: ${debtItem.name}`, amount: amount, date: getCombinedDate(dateInput), note: `Nhận lại nợ: ${debtItem.name} ${note ? '- ' + note : ''}`, relatedDebtId: linkedDebtId, debtAction: 'collect' }; 
                    saveData([newItem, ...incomes], expenses, fixedTemplate, categories, updatedDebts);
                    alert("Đã ghi nhận thu nhập từ thu nợ!"); return;
                } else {
                    const newPaid = debtItem.paid + amount;
                    updatedDebts = debts.map(d => d.id === debtItem.id ? { ...d, paid: newPaid, updatedAt: new Date().toISOString() } : d);
                    finalNote = `Trả nợ: ${debtItem.name} ${note ? '- ' + note : ''}`;
                    actionType = 'repay';
                }
            }
        }
        const newItem: Expense = { id: Date.now(), category: category, amount: amount, date: getCombinedDate(dateInput), note: finalNote, relatedDebtId: linkedDebtId, debtAction: actionType };
        saveData(incomes, [newItem, ...expenses], fixedTemplate, categories, updatedDebts);
    };

    const handleAddSavings = () => {
        const amt = parseAmount(savingAmount);
        if (!savingCategory || amt <= 0) { alert('Vui lòng nhập số tiền và chọn mục tiết kiệm.'); return; }
        const newItem: Expense = {
            id: Date.now(),
            category: savingCategory,
            amount: amt,
            date: getCombinedDate(savingDate),
            note: savingNote
        };
        saveData(incomes, [newItem, ...expenses], fixedTemplate, categories, debts);
        setSavingAmount(''); setSavingNote(''); setShowSavingForm(false);
    };

    // Callback from TabDebt logic
    // We overload onUpdateDebts slightly to pass signals from TabDebt
    const handleUpdateDebts = (newDebts: Debt[] | null, newItem?: Debt, isEditId?: number | null) => {
        if (newDebts) {
            // This is a delete action or direct update
            saveData(incomes, expenses, fixedTemplate, categories, newDebts);
            return;
        }

        if (newItem) {
            // Logic for Saving/Creating Debt Item and AutoSync
            let currentIncomes = [...incomes]; 
            let currentExpenses = [...expenses];
            
            if (autoCreateTransaction) {
                const old = isEditId ? debts.find(d => d.id === isEditId) : null;
                const oldPaid = old ? old.paid : 0; 
                const oldTotal = old ? old.total : 0;
                
                if (newItem.type === 'receivable') {
                    if (newItem.total > oldTotal) currentExpenses.unshift({ id: Date.now(), category: DEBT_CATEGORY_NAME, amount: newItem.total - oldTotal, date: new Date().toISOString(), note: `Cho vay thêm: ${newItem.name}`, debtAction: 'lend' });
                    if (newItem.paid > oldPaid) currentIncomes.unshift({ id: Date.now() + 1, source: `Thu nợ: ${newItem.name}`, amount: newItem.paid - oldPaid, date: new Date().toISOString(), debtAction: 'collect' });
                } else if (newItem.paid > oldPaid) {
                    currentExpenses.unshift({ id: Date.now(), category: DEBT_CATEGORY_NAME, amount: newItem.paid - oldPaid, date: new Date().toISOString(), note: `Trả nợ: ${newItem.name}`, debtAction: 'repay' });
                }
            }

            const finalDebts = isEditId ? debts.map(d => d.id === isEditId ? newItem : d) : [newItem, ...debts];
            saveData(currentIncomes, currentExpenses, fixedTemplate, categories, finalDebts);
        }
    };

    const deleteItem = (id: number, type: 'income' | 'expense') => {
        if (!confirm('Xóa giao dịch này?')) return;
        if (type === 'income') saveData(incomes.filter(i => i.id !== id), expenses);
        else saveData(incomes, expenses.filter(e => e.id !== id));
    };

    const updateNote = (id: number, type: 'income' | 'expense', newNote: string) => {
        if (type === 'income') saveData(incomes.map(i => i.id === id ? { ...i, note: newNote } : i), expenses);
        else saveData(incomes, expenses.map(e => e.id === id ? { ...e, note: newNote } : e));
    };

    const handleConfirmFixedItem = (item: FixedTemplateItem, confirmedAmount: number) => {
        if (!confirmedAmount || confirmedAmount <= 0) return;
        if (!confirm(`Xác nhận chi khoản "${item.category}" với số tiền ${formatCurrency(confirmedAmount)} VNĐ?`)) return;
        const newExpense: Expense = { id: Date.now(), category: item.category, amount: confirmedAmount, date: new Date().toISOString(), note: `Khoản chi cố định` };
        const newExpenses = [newExpense, ...expenses];
        const trackingKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;
        const currentTracking = fixedTracking[trackingKey] || [];
        const newTrackingList = currentTracking.includes(item.category) ? currentTracking : [...currentTracking, item.category];
        saveData(incomes, newExpenses, fixedTemplate, categories, debts, { ...fixedTracking, [trackingKey]: newTrackingList });
        setFixedPaymentInputs(prev => ({...prev, [item.category]: ''}));
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
        <div className="min-h-screen pb-24 md:pb-0 relative font-sans overflow-x-hidden">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
                {isOverBudget && <div className="bg-red-50 text-red-600 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-pulse-red border-b border-red-100"><AlertTriangle size={16} /> CHI TIÊU QUÁ HẠN MỨC 90%!</div>}
                
                {/* Header Section */}
                <div className={`bg-gradient-to-r ${isConnected ? 'from-blue-800 to-indigo-900' : 'from-slate-700 to-gray-800'} p-6 pb-6 text-white rounded-b-3xl shadow-lg relative`}>
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={()=>setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 15))} className="p-2 text-white/70 hover:text-white btn-effect"><ChevronLeft size={24}/></button>
                        <div className="text-center">
                            <span className="text-[10px] font-medium text-white/60 block mb-0.5 tracking-wider">{formatDate(startDate.toISOString())} - {formatDate(endDate.toISOString())}</span>
                            <div className="font-bold text-xl text-white flex items-center gap-2 justify-center uppercase tracking-wide"><CalendarIcon size={18}/> Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}</div>
                        </div>
                        <button onClick={()=>setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 15))} className="p-2 text-white/70 hover:text-white btn-effect"><ChevronRight size={24}/></button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/30 backdrop-blur-sm p-4 rounded-2xl border border-green-500/30 shadow-inner">
                            <div className="text-green-300 text-[10px] font-black uppercase mb-1 flex items-center gap-1"><TrendingUp size={12}/> Thu Nhập</div>
                            <div className="font-bold text-lg">{formatCurrency(sumIncomeMonth)} VNĐ</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-500/20 to-orange-500/30 backdrop-blur-sm p-4 rounded-2xl border border-red-500/30 shadow-inner">
                            <div className="text-red-300 text-[10px] font-black uppercase mb-1 flex items-center gap-1"><TrendingDown size={12}/> Chi Tiêu</div>
                            <div className="font-bold text-lg">{formatCurrency(sumExpenseMonth)} VNĐ</div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-1">
                        {!isConnected ? (
                            <button onClick={()=>setShowCloudForm(true)} className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all backdrop-blur-md btn-effect opacity-90 hover:opacity-100">
                                <CloudOff size={14}/> <span>Kết Nối Cloud</span>
                            </button>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-3 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                                    <div className="text-[10px] text-blue-200 uppercase font-black tracking-widest">Mã: <span className="text-white">{familyCode}</span></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                    <button onClick={()=>setShowCloudForm(true)} className="text-[10px] text-white/60 font-bold border-l border-white/10 pl-3">Sửa</button>
                                </div>
                                {isSyncing && <span className="text-[8px] text-green-300 font-bold uppercase mt-1 tracking-widest">Đang tải dữ liệu...</span>}
                            </div>
                        )}
                        {syncError && <div className="text-[9px] bg-red-500/90 text-white px-3 py-1 rounded-full mt-2 font-bold animate-bounce shadow-lg">LỖI: {syncError}</div>}
                    </div>
                </div>

                <div className="px-4 -mt-6 relative z-10">
                    <div className="bg-white rounded-xl shadow-xl p-1.5 flex border border-gray-100 overflow-x-auto no-scrollbar">
                        {(['add', 'debt', 'report', 'savings', 'history', 'settings'] as TabType[]).map(tab => (
                            <button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-1 min-w-[60px] py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all btn-effect flex flex-col items-center gap-1 ${activeTab === tab ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-md animate-scale-loop' : 'text-gray-400 hover:bg-gray-50'}`}>
                                {tab === 'add' ? 'Nhập' : tab === 'debt' ? 'Sổ Nợ' : tab === 'report' ? 'Báo Cáo' : tab === 'savings' ? 'Heo Đất' : tab === 'history' ? 'Lịch Sử' : <SettingsIcon size={16}/>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 pb-32">
                    {activeTab === 'add' && <TabAdd categories={categories} debts={debts} onAddIncome={onAddIncome} onAddExpense={onAddExpense} getMonthlyPaid={(cat) => filteredExpenses.filter(e => e.category === cat).reduce((sum, item) => sum + item.amount, 0)} onUpdateCategories={(cats) => saveData(incomes, expenses, fixedTemplate, cats)} />}
                    {activeTab === 'debt' && <TabDebt debts={debts} onUpdateDebts={handleUpdateDebts as any} autoCreateTransaction={autoCreateTransaction} setAutoCreateTransaction={setAutoCreateTransaction} />}
                    {activeTab === 'report' && <TabReport expenses={filteredExpenses} sumIncome={sumIncomeMonth} />}
                    {activeTab === 'savings' && <TabSavings totalAccumulated={totalAccumulatedSavings} expenses={expenses} onOpenSavingForm={()=>setShowSavingForm(true)} />}
                    {activeTab === 'history' && <TabHistory incomes={filteredIncomes} expenses={filteredExpenses} onDelete={deleteItem} onUpdateNote={updateNote} />}
                    {activeTab === 'settings' && <TabSettings isConnected={isConnected} projectId={projectId} familyCode={familyCode} onReload={()=>window.location.reload()} onOpenFixedConfig={()=>setShowFixedConfig(true)} onExportExcel={handleExportExcel} onOpenCloudForm={()=>setShowCloudForm(true)} />}
                </div>

                {/* FAB & Bottom Overlays */}
                <div className="fixed bottom-8 left-4 z-50 flex flex-col gap-3">
                    <button onClick={()=>setShowFixedTrackingModal(true)} className="bg-gradient-to-br from-slate-800 to-black text-white p-4 rounded-3xl shadow-2xl border-2 border-white/20 transform hover:rotate-12 transition-all ring-8 ring-slate-900/5">
                        <MessageCircle size={22}/>
                    </button>
                </div>

                <div onClick={()=>setShowReloadConfirm(true)} className="fixed bottom-8 right-4 z-50">
                    <div className={`shadow-2xl rounded-[24px] px-6 py-4 flex items-center gap-4 border-2 border-white/40 transform active:scale-90 transition-all ring-8 ${balance>=0?'bg-gradient-to-r from-blue-700 to-indigo-600 ring-blue-500/10':'bg-gradient-to-r from-red-700 to-orange-600 ring-red-500/10'}`}>
                        <div className="bg-white/20 p-2 rounded-xl"><Wallet size={22} className="text-white"/></div>
                        <div className="flex flex-col items-start text-white font-black text-xl leading-none tracking-tight">{formatCurrency(balance)} VNĐ</div>
                    </div>
                </div>

                {/* MODALS */}
                {showSavingForm && (
                    <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6 backdrop-blur-md animate-fadeIn">
                        <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative border border-gray-100">
                            <button onClick={()=>setShowSavingForm(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
                            <h3 className="font-black text-rose-600 text-lg mb-6 uppercase tracking-tighter flex items-center gap-2"><PiggyBank size={24}/> Nạp Heo Đất</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 pl-2">Chọn Hũ:</label>
                                    <select value={savingCategory} onChange={e=>setSavingCategory(e.target.value)} className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs font-black outline-none shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all">
                                        {SAVING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 pl-2">Số tiền:</label>
                                        <input type="text" value={savingAmount} onChange={e=>handleAmountInput(e.target.value, setSavingAmount)} className="w-full p-3 bg-white border border-gray-300 rounded-xl font-black text-lg text-rose-600 outline-none shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="0 VNĐ"/>
                                    </div>
                                    <div className="flex-1">
                                         <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 pl-2">Ngày:</label>
                                         <CustomDatePicker value={savingDate} onChange={e=>setSavingDate(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 pl-2">Ghi chú:</label>
                                    <input type="text" value={savingNote} onChange={e=>handleTextInput(e.target.value, setSavingNote)} className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium outline-none shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Ví dụ: Tiền thưởng tết..."/>
                                </div>
                                <button onClick={handleAddSavings} className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200 uppercase text-xs tracking-[0.2em] active:scale-95 transition-all mt-2">Xác Nhận Nạp</button>
                            </div>
                        </div>
                    </div>
                )}

                {showCloudForm && (
                    <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-6 backdrop-blur-md animate-fadeIn">
                        <div className="bg-white rounded-[48px] w-full max-w-sm p-8 shadow-2xl text-left border border-white/20 relative">
                            <button onClick={()=>setShowCloudForm(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
                            <div className="flex items-center gap-3 mb-8"><Cloud size={28} className="text-blue-600"/><h3 className="font-black text-gray-800 text-xl uppercase tracking-tighter">Đám mây Riêng</h3></div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-2">Mã Gia Đình (Dùng chung 2 máy)</label>
                                    <input type="text" value={familyCode} onChange={e=>setFamilyCode(e.target.value.trim().toUpperCase())} className="w-full p-4 bg-white border-2 border-gray-300 rounded-2xl text-sm font-black outline-none focus:border-blue-500 transition-all" placeholder="VÍ DỤ: GIADINH001" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-2">Firebase Config (Dán đúng JSON)</label>
                                    <textarea value={firebaseConfigStr} onChange={e=>setFirebaseConfigStr(e.target.value)} className="w-full p-4 bg-white border-2 border-gray-300 rounded-2xl text-[9px] h-40 outline-none resize-none font-mono focus:border-blue-500 transition-all" placeholder='{"apiKey": "...", "projectId": "...", ...}'></textarea>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                                    <p className="text-[8px] text-yellow-700 font-black uppercase leading-relaxed">Lưu ý: Bạn phải thiết lập Firebase Rules thành "allow read, write: if true;" để đồng bộ được.</p>
                                </div>
                                <button onClick={()=>{
                                    const code = familyCode.trim().toUpperCase();
                                    if(!code || !firebaseConfigStr) { alert("Thiếu thông tin"); return; }
                                    localStorage.setItem('fb_config', firebaseConfigStr); 
                                    localStorage.setItem('fb_family_code', code); 
                                    window.location.reload();
                                }} className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-[24px] shadow-xl shadow-blue-100 uppercase text-xs tracking-[0.3em] active:scale-95 transition-all">Lưu & Kết Nối</button>
                            </div>
                        </div>
                    </div>
                )}

                {showReloadConfirm && (
                    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
                        <div className="bg-white rounded-[40px] p-8 shadow-2xl text-center max-w-[300px] w-full border border-gray-100">
                            <div className="bg-slate-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"><RefreshCw size={28} className="text-blue-600"/></div>
                            <h3 className="font-black text-lg mb-2 text-gray-800 uppercase tracking-tighter">Tải lại App?</h3>
                            <p className="text-[10px] text-gray-400 font-bold mb-8 uppercase tracking-tight">Dữ liệu sẽ được cập nhật mới nhất từ Đám mây.</p>
                            <div className="flex gap-4">
                                <button onClick={()=>setShowReloadConfirm(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 font-black rounded-2xl text-[10px] uppercase tracking-widest">Hủy</button>
                                <button onClick={()=>window.location.reload()} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100">Đồng ý</button>
                            </div>
                        </div>
                    </div>
                )}

                {showFixedTrackingModal && (
                    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-end justify-center backdrop-blur-md animate-fadeIn">
                        <div className="bg-slate-50 rounded-t-[40px] w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border-t border-white/20">
                            
                            {/* Header */}
                            <div className="p-6 pb-2 bg-white rounded-t-[40px] flex justify-between items-center shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200"><Clock size={20}/></div>
                                    <div>
                                        <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight leading-none">Chi Cố Định</h3>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}</span>
                                    </div>
                                </div>
                                <button onClick={()=>setShowFixedTrackingModal(false)} className="bg-gray-100 p-2.5 rounded-full text-gray-400 hover:bg-gray-200 transition-colors"><X size={20}/></button>
                            </div>

                            {/* Dashboard Summary */}
                            <div className="px-6 py-4 bg-white border-b border-gray-100">
                                {(() => {
                                    const totalFixedBudget = fixedTemplate.reduce((acc, item) => acc + item.amount, 0);
                                    const totalFixedPaid = fixedTemplate.reduce((acc, item) => acc + getMonthlyPaidForCategory(item.category), 0);
                                    const totalFixedRemaining = totalFixedBudget - totalFixedPaid;
                                    const overallProgress = totalFixedBudget > 0 ? (totalFixedPaid / totalFixedBudget) * 100 : 0;

                                    return (
                                        <div className="bg-gradient-to-r from-slate-800 to-gray-900 rounded-[28px] p-5 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-end mb-4">
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng Ngân Sách</div>
                                                        <div className="text-2xl font-black tracking-tight">{formatCurrency(totalFixedBudget)}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đã chi</div>
                                                        <div className="text-lg font-bold text-white/90">{formatCurrency(totalFixedPaid)}</div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-700/50 rounded-full h-2 mb-3 overflow-hidden backdrop-blur-sm">
                                                    <div className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-700" style={{width: `${Math.min(100, overallProgress)}%`}}></div>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                                    <span className="text-emerald-400">Còn lại: {formatCurrency(totalFixedRemaining)}</span>
                                                    <span className="text-slate-500">{Math.round(overallProgress)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* List Items */}
                            <div className="p-6 overflow-y-auto flex-1 space-y-4 no-scrollbar pb-32 bg-slate-50">
                                {fixedTemplate.map(item => {
                                    const paid = getMonthlyPaidForCategory(item.category); 
                                    const rem = item.amount - paid; 
                                    const done = rem <= 0;
                                    const progress = Math.min(100, (paid/item.amount)*100);
                                    const inp = fixedPaymentInputs[item.category] || (rem > 0 ? formatCurrency(rem) : '');
                                    
                                    return (
                                        <div key={item.category} className={`bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm transition-all ${done ? 'opacity-60 grayscale' : 'hover:shadow-md'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-8 rounded-full ${done ? 'bg-green-500' : 'bg-gradient-to-b from-indigo-500 to-purple-500'}`}></div>
                                                    <div>
                                                        <h4 className="font-black text-gray-800 text-sm uppercase tracking-tight">{item.category}</h4>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Mục tiêu: {formatCurrency(item.amount)}</p>
                                                    </div>
                                                </div>
                                                {done ? (
                                                     <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Hoàn thành</span>
                                                ) : (
                                                     <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Còn: {formatCurrency(rem)}</span>
                                                )}
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                                                <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${done ? 'bg-green-500' : (progress > 80 ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-indigo-400 to-purple-500')}`} style={{width: `${progress}%`}}></div>
                                            </div>

                                            {/* Input Action */}
                                            {!done && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex-1 relative group">
                                                        <input 
                                                            type="text" 
                                                            inputMode="numeric" 
                                                            value={inp} 
                                                            onChange={(e) => handleAmountInput(e.target.value, (v)=>setFixedPaymentInputs(p=>({...p, [item.category]: v})))} 
                                                            className="w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300" 
                                                            placeholder="Nhập số tiền..." 
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">VNĐ</div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleConfirmFixedItem(item, parseAmount(inp))} 
                                                        className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-indigo-200 uppercase tracking-widest active:scale-95 transition-all hover:to-purple-700"
                                                    >
                                                        Chi
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {fixedTemplate.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
                                        <Clock size={48} className="text-gray-300 mb-4"/>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Chưa có mục cố định nào</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {showFixedConfig && (
                    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-fadeIn">
                        <div className="bg-white rounded-[48px] w-full max-w-sm p-8 shadow-2xl relative border border-gray-100">
                            <button onClick={()=>setShowFixedConfig(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
                            <h3 className="font-black text-gray-800 text-lg mb-8 uppercase tracking-tighter flex items-center gap-3"><Clock size={24} className="text-purple-600"/> Thiết lập hạn mức</h3>
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                                {categories.map(cat => (
                                    <div key={cat} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 group">
                                        <span className="flex-1 text-[10px] font-black text-gray-500 uppercase truncate tracking-tighter">{cat}</span>
                                        <input type="text" inputMode="numeric" value={tempFixedList[cat] ? formatCurrency(tempFixedList[cat]) : (fixedTemplate.find(f => f.category === cat)?.amount ? formatCurrency(fixedTemplate.find(f => f.category === cat)!.amount) : '')} onChange={(e) => handleAmountInput(e.target.value, (v)=>setTempFixedList(p=>({...p, [cat]: parseAmount(v)})))} className="w-24 p-2 bg-white border-2 border-gray-300 rounded-xl text-[11px] font-black text-right text-purple-700 outline-none focus:border-purple-300 transition-all" placeholder="0 VNĐ"/>
                                    </div>
                                ))}
                            </div>
                            <button onClick={()=>{saveData(incomes, expenses, Object.entries(tempFixedList).filter(([,a])=>(a as number)>0).map(([c,a])=>({category:c, amount:a as number}))); setShowFixedConfig(false);}} className="w-full py-5 bg-gradient-to-r from-slate-800 to-black text-white font-black rounded-[24px] mt-8 uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-slate-200 active:scale-95 transition-all">Lưu Cấu Hình</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;

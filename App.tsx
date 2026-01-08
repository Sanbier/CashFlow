
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  DEBT_CATEGORY_NAME, 
  SAVING_CATEGORIES, 
  DEFAULT_CATEGORIES, 
  Plus, 
  Trash2, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CalendarIcon, 
  PieChart, 
  History, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  RefreshCw, 
  SettingsIcon, 
  Download, 
  Upload, 
  Edit2, 
  Search, 
  AlertTriangle, 
  X, 
  Cloud, 
  CloudOff, 
  FileSpreadsheet, 
  BookOpen, 
  PiggyBank, 
  Users, 
  MessageCircle, 
  Clock,
  Activity
} from './constants';
import { Income, Expense, Debt, FixedTemplateItem, TabType } from './types';

declare const firebase: any;
declare const XLSX: any;

const CustomDatePicker: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string }> = ({ value, onChange, className="" }) => {
    const displayDate = value ? value.split('-').reverse().join('/') : '';
    return (
        <div className={`relative h-12 ${className}`}> 
            <input type="date" value={value} onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
            <div className="w-full h-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-500 flex items-center justify-center pointer-events-none gap-2 transition-all duration-200"> 
                <span>{displayDate}</span><CalendarIcon size={16} className="opacity-70"/>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const getLocalToday = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // --- STATES ---
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [fixedTemplate, setFixedTemplate] = useState<FixedTemplateItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [fixedTracking, setFixedTracking] = useState<Record<string, string[]>>({}); 
    
    // --- REFS (Crucial for avoiding stale closures during sync) ---
    const dataRef = useRef({ incomes, expenses, fixedTemplate, categories, debts, fixedTracking });
    useEffect(() => {
        dataRef.current = { incomes, expenses, fixedTemplate, categories, debts, fixedTracking };
    }, [incomes, expenses, fixedTemplate, categories, debts, fixedTracking]);

    const [viewDate, setViewDate] = useState(() => {
        const today = new Date();
        if (today.getDate() > 30) { today.setMonth(today.getMonth() + 1); today.setDate(1); }
        return today;
    });
    
    // Form States
    const [incomeSource, setIncomeSource] = useState(''); 
    const [incomeAmount, setIncomeAmount] = useState(''); 
    const [incomeDate, setIncomeDate] = useState(getLocalToday()); 
    const [incomeNote, setIncomeNote] = useState('');
    const [expenseCategory, setExpenseCategory] = useState(''); 
    const [expenseAmount, setExpenseAmount] = useState(''); 
    const [expenseDate, setExpenseDate] = useState(getLocalToday()); 
    const [expenseNote, setExpenseNote] = useState('');
    const [selectedDebtorId, setSelectedDebtorId] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('add');
    const [searchTerm, setSearchTerm] = useState(''); 
    const [filterCategory, setFilterCategory] = useState('all');

    // Modal & Config States
    const [showReloadConfirm, setShowReloadConfirm] = useState(false);
    const [showFixedConfig, setShowFixedConfig] = useState(false);
    const [showFixedTrackingModal, setShowFixedTrackingModal] = useState(false); 
    const [tempFixedList, setTempFixedList] = useState<Record<string, number>>({});
    const [fixedPaymentInputs, setFixedPaymentInputs] = useState<Record<string, string>>({});

    // Firebase States
    const [firebaseConfigStr, setFirebaseConfigStr] = useState(() => localStorage.getItem('fb_config') || '');
    const [familyCode, setFamilyCode] = useState(() => (localStorage.getItem('fb_family_code') || '').trim().toUpperCase());
    const [isConnected, setIsConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [showCloudForm, setShowCloudForm] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    const [isCategoryManageMode, setIsCategoryManageMode] = useState(false);
    const [debtName, setDebtName] = useState('');
    const [debtTotal, setDebtTotal] = useState('');
    const [debtPaid, setDebtPaid] = useState('');
    const [debtNote, setDebtNote] = useState('');
    const [debtType, setDebtType] = useState<'payable' | 'receivable'>('payable');
    const [isEditingDebt, setIsEditingDebt] = useState<number | null>(null);
    const [showDebtForm, setShowDebtForm] = useState(false);
    const [activeDebtTab, setActiveDebtTab] = useState<'payable' | 'receivable'>('payable');
    const [autoCreateTransaction, setAutoCreateTransaction] = useState(true);

    const dbRef = useRef<any>(null);

    // --- CLOUD SYNC CORE ---
    useEffect(() => {
        if (firebaseConfigStr && familyCode) {
            try {
                const config = JSON.parse(firebaseConfigStr);
                if (!firebase.apps.length) firebase.initializeApp(config);
                const db = firebase.firestore();
                dbRef.current = db;
                setIsConnected(true);
                setSyncError(null);

                // REAL-TIME LISTENER
                const unsubscribe = db.collection('families').doc(familyCode).onSnapshot((doc: any) => {
                    if (doc.exists) { 
                        const data = doc.data(); 
                        
                        // Cập nhật State từ Cloud
                        setIncomes(data.incomes || []); 
                        setExpenses(data.expenses || []); 
                        setFixedTemplate(data.fixedTemplate || []);
                        setCategories(data.categories || DEFAULT_CATEGORIES);
                        setDebts(data.debts || []);
                        setFixedTracking(data.fixedTracking || {});
                        setLastSyncTime(data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString() : 'Vừa xong');

                        // Sync to Local Storage for offline persistence
                        localStorage.setItem('family_incomes', JSON.stringify(data.incomes || []));
                        localStorage.setItem('family_expenses', JSON.stringify(data.expenses || []));
                        localStorage.setItem('family_fixed_template', JSON.stringify(data.fixedTemplate || []));
                        localStorage.setItem('family_categories', JSON.stringify(data.categories || DEFAULT_CATEGORIES));
                        localStorage.setItem('family_debts', JSON.stringify(data.debts || []));
                        localStorage.setItem('family_fixed_tracking', JSON.stringify(data.fixedTracking || {}));
                    } else {
                        // Khởi tạo tài liệu trên Cloud nếu máy này có dữ liệu
                        const localIncomes = JSON.parse(localStorage.getItem('family_incomes') || '[]');
                        if (localIncomes.length > 0) {
                            db.collection('families').doc(familyCode).set({
                                incomes: localIncomes,
                                expenses: JSON.parse(localStorage.getItem('family_expenses') || '[]'),
                                fixedTemplate: JSON.parse(localStorage.getItem('family_fixed_template') || '[]'),
                                categories: JSON.parse(localStorage.getItem('family_categories') || JSON.stringify(DEFAULT_CATEGORIES)),
                                debts: JSON.parse(localStorage.getItem('family_debts') || '[]'),
                                fixedTracking: JSON.parse(localStorage.getItem('family_fixed_tracking') || '{}'),
                                lastUpdate: new Date().toISOString()
                            });
                        }
                    }
                }, (err: any) => setSyncError(err.message));
                return () => unsubscribe();
            } catch (e) { setSyncError("JSON Config lỗi"); }
        } else {
            // Load offline data if no cloud
            setIncomes(JSON.parse(localStorage.getItem('family_incomes') || '[]'));
            setExpenses(JSON.parse(localStorage.getItem('family_expenses') || '[]'));
            setFixedTemplate(JSON.parse(localStorage.getItem('family_fixed_template') || '[]'));
            setCategories(JSON.parse(localStorage.getItem('family_categories') || JSON.stringify(DEFAULT_CATEGORIES)));
            setDebts(JSON.parse(localStorage.getItem('family_debts') || '[]'));
            setFixedTracking(JSON.parse(localStorage.getItem('family_fixed_tracking') || '{}'));
        }
    }, [firebaseConfigStr, familyCode]);

    // Hàm lưu dữ liệu CHÍNH: Đẩy mọi thứ lên Cloud cùng lúc
    const performSave = (updates: { 
        incomes?: Income[], 
        expenses?: Expense[], 
        fixed?: FixedTemplateItem[], 
        cats?: string[], 
        debts?: Debt[], 
        tracking?: any 
    }) => {
        const finalData = {
            incomes: updates.incomes ?? dataRef.current.incomes,
            expenses: updates.expenses ?? dataRef.current.expenses,
            fixedTemplate: updates.fixed ?? dataRef.current.fixedTemplate,
            categories: updates.cats ?? dataRef.current.categories,
            debts: updates.debts ?? dataRef.current.debts,
            fixedTracking: updates.tracking ?? dataRef.current.fixedTracking,
            lastUpdate: new Date().toISOString()
        };

        // Cập nhật State Local trước cho mượt
        if (updates.incomes) setIncomes(updates.incomes);
        if (updates.expenses) setExpenses(updates.expenses);
        if (updates.fixed) setFixedTemplate(updates.fixed);
        if (updates.cats) setCategories(updates.cats);
        if (updates.debts) setDebts(updates.debts);
        if (updates.tracking) setFixedTracking(updates.tracking);

        // Lưu Local Storage
        localStorage.setItem('family_incomes', JSON.stringify(finalData.incomes));
        localStorage.setItem('family_expenses', JSON.stringify(finalData.expenses));
        localStorage.setItem('family_fixed_template', JSON.stringify(finalData.fixedTemplate));
        localStorage.setItem('family_categories', JSON.stringify(finalData.categories));
        localStorage.setItem('family_debts', JSON.stringify(finalData.debts));
        localStorage.setItem('family_fixed_tracking', JSON.stringify(finalData.fixedTracking));

        // Đẩy Cloud
        if (isConnected && dbRef.current && familyCode) {
            setIsSyncing(true);
            dbRef.current.collection('families').doc(familyCode).set(finalData)
                .then(() => setIsSyncing(false))
                .catch((e: any) => { setIsSyncing(false); setSyncError(e.message); });
        }
    };

    // --- LOGIC HANDLERS ---
    const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);
    const formatDate = (date: string) => { if(!date) return ''; const d = new Date(date); return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`; };
    
    const { startDate, endDate } = useMemo(() => {
        const year = viewDate.getFullYear(), month = viewDate.getMonth(); 
        const start = new Date(year, month, 1); start.setHours(0,0,0,0); 
        const end = new Date(year, month + 1, 0); end.setHours(23,59,59,999); 
        return { startDate: start, endDate: end };
    }, [viewDate]);

    const { filteredIncomes, filteredExpenses } = useMemo(() => {
        const filter = (items: any[], isIncome: boolean) => items.filter(item => {
            const d = new Date(item.date);
            if (!(d >= startDate && d <= endDate)) return false;
            const searchLower = searchTerm.toLowerCase();
            const text = (isIncome ? item.source : item.category).toLowerCase();
            const note = (item.note || '').toLowerCase();
            const matchSearch = searchTerm === '' || text.includes(searchLower) || note.includes(searchLower) || item.amount.toString().includes(searchLower);
            const matchCat = filterCategory === 'all' || (isIncome ? filterCategory === 'income_type' : item.category === filterCategory);
            return matchSearch && matchCat;
        });
        return { filteredIncomes: filter(incomes, true), filteredExpenses: filter(expenses, false) };
    }, [incomes, expenses, startDate, endDate, searchTerm, filterCategory]);

    const sumIn = useMemo(() => filteredIncomes.reduce((a, c) => a + c.amount, 0), [filteredIncomes]);
    const sumOut = useMemo(() => filteredExpenses.reduce((a, c) => a + c.amount, 0), [filteredExpenses]);
    const balance = sumIn - sumOut;

    const parseAmount = (val: string) => val ? parseInt(val.replace(/\./g,''), 10) : 0;
    const handleAmountInput = (val: string, setter: (v: string) => void) => { const raw = val.replace(/\D/g,''); setter(raw === '' ? '' : Number(raw).toLocaleString('vi-VN')); };
    const getCombinedDate = (dateInput: string) => { const d = new Date(dateInput); const now = new Date(); d.setHours(now.getHours(), now.getMinutes(), now.getSeconds()); return d.toISOString(); };

    const handleAddIncome = () => {
        const amt = parseAmount(incomeAmount); if(!incomeSource || amt <= 0) return;
        const newItem: Income = { id: Date.now(), source: incomeSource, amount: amt, date: getCombinedDate(incomeDate), note: incomeNote };
        performSave({ incomes: [newItem, ...incomes] });
        setIncomeSource(''); setIncomeAmount(''); setIncomeNote('');
    };

    const handleAddExpense = () => {
        const amt = parseAmount(expenseAmount); if(!expenseCategory || amt <= 0) return;
        let finalDebts = debts; let finalIncomes = incomes; let finalExpenses = expenses;
        let note = expenseNote; let action: any = null;

        if (expenseCategory === DEBT_CATEGORY_NAME) {
            if (!selectedDebtorId) return alert("Chọn người liên quan!");
            const debt = debts.find(d => d.id === Number(selectedDebtorId));
            if (debt) {
                const newPaid = debt.paid + amt;
                finalDebts = debts.map(d => d.id === debt.id ? { ...d, paid: newPaid, updatedAt: new Date().toISOString() } : d);
                if (debt.type === 'receivable') {
                    finalIncomes = [{ id: Date.now(), source: `Thu nợ: ${debt.name}`, amount: amt, date: getCombinedDate(expenseDate), note: `Nhận nợ ${expenseNote}`, debtAction: 'collect' }, ...incomes];
                    return performSave({ incomes: finalIncomes, debts: finalDebts });
                } else {
                    note = `Trả nợ: ${debt.name} ${expenseNote}`;
                    action = 'repay';
                }
            }
        }
        const newItem: Expense = { id: Date.now(), category: expenseCategory, amount: amt, date: getCombinedDate(expenseDate), note, debtAction: action };
        performSave({ expenses: [newItem, ...expenses], debts: finalDebts, incomes: finalIncomes });
        setExpenseAmount(''); setExpenseNote('');
    };

    const deleteItem = (id: number, type: 'income' | 'expense') => {
        if (!confirm('Xóa giao dịch?')) return;
        if (type === 'income') performSave({ incomes: incomes.filter(i => i.id !== id) });
        else performSave({ expenses: expenses.filter(e => e.id !== id) });
    };

    const handleSaveDebt = () => {
        const total = parseAmount(debtTotal); const paid = parseAmount(debtPaid);
        if (!debtName || total <= 0) return alert("Nhập đủ thông tin!");
        
        const newItem: Debt = { id: isEditingDebt || Date.now(), name: debtName, total, paid, note: debtNote, type: debtType, updatedAt: new Date().toISOString() };
        let newDebts = isEditingDebt ? debts.map(d => d.id === isEditingDebt ? newItem : d) : [newItem, ...debts];
        
        let newIncomes = [...incomes]; let newExpenses = [...expenses];
        if (autoCreateTransaction) {
            const diff = paid - (isEditingDebt ? (debts.find(d => d.id === isEditingDebt)?.paid || 0) : 0);
            if (diff > 0) {
                if (debtType === 'receivable') newIncomes.unshift({ id: Date.now(), source: `Thu nợ: ${debtName}`, amount: diff, date: new Date().toISOString(), debtAction: 'collect' });
                else newExpenses.unshift({ id: Date.now(), category: DEBT_CATEGORY_NAME, amount: diff, date: new Date().toISOString(), note: `Trả nợ: ${debtName}`, debtAction: 'repay' });
            }
        }
        performSave({ debts: newDebts, incomes: newIncomes, expenses: newExpenses });
        setShowDebtForm(false); setIsEditingDebt(null);
    };

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredIncomes.map(i => ({ "Ngày": formatDate(i.date), "Nguồn": i.source, "Số tiền": i.amount }))), "Thu");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredExpenses.map(e => ({ "Ngày": formatDate(e.date), "Mục": e.category, "Số tiền": e.amount }))), "Chi");
        XLSX.writeFile(wb, `BaoCao_${viewDate.getMonth()+1}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col">
                {/* --- HEADER --- */}
                <div className={`p-6 pb-8 text-white rounded-b-[40px] shadow-xl relative overflow-hidden transition-colors duration-500 ${isConnected ? 'bg-slate-900' : 'bg-red-900'}`}>
                    <div className="flex justify-between items-center relative z-10 mb-6">
                        <button onClick={()=>setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 1))} className="p-2 hover:bg-white/10 rounded-full transition-all"><ChevronLeft/></button>
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Quản lý tài chính</p>
                            <h1 className="text-xl font-black uppercase flex items-center gap-2 justify-center">Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}</h1>
                        </div>
                        <button onClick={()=>setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 1))} className="p-2 hover:bg-white/10 rounded-full transition-all"><ChevronRight/></button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                            <p className="text-[9px] font-black uppercase text-green-400 mb-1 tracking-widest">Tổng Thu</p>
                            <p className="text-lg font-black">{formatCurrency(sumIn)} đ</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                            <p className="text-[9px] font-black uppercase text-red-400 mb-1 tracking-widest">Tổng Chi</p>
                            <p className="text-lg font-black">{formatCurrency(sumOut)} đ</p>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col items-center gap-2 relative z-10">
                        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-xl">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 animate-pulse'}`}></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {isConnected ? `Cloud: ${familyCode}` : 'Ngoại tuyến'}
                            </span>
                            {lastSyncTime && <span className="text-[8px] opacity-40 italic ml-2">Cập nhật: {lastSyncTime}</span>}
                            {isSyncing && <RefreshCw size={10} className="animate-spin ml-1 text-blue-400"/>}
                        </div>
                        {syncError && <p className="text-[8px] text-red-300 font-bold uppercase animate-bounce">Lỗi: {syncError}</p>}
                    </div>
                </div>

                {/* --- NAVIGATION --- */}
                <div className="px-4 -mt-6 relative z-20">
                    <div className="bg-white rounded-2xl shadow-2xl p-1.5 flex border border-gray-100 overflow-x-auto no-scrollbar">
                        {(['add', 'debt', 'report', 'history', 'settings'] as TabType[]).map(tab => (
                            <button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-1 min-w-[70px] py-3 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center gap-1.5 ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-gray-50'}`}>
                                {tab === 'add' ? 'Nhập' : tab === 'debt' ? 'Sổ Nợ' : tab === 'report' ? 'Báo Cáo' : tab === 'history' ? 'Lịch Sử' : <SettingsIcon size={16}/>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- CONTENT --- */}
                <div className="flex-1 p-5 overflow-y-auto space-y-8 animate-fadeIn">
                    {activeTab === 'add' && (
                        <>
                            {/* NHẬP THU */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-green-600 px-1">
                                    <TrendingUp size={18}/><h2 className="text-xs font-black uppercase tracking-widest">1. Thu Nhập</h2>
                                </div>
                                <div className="bg-white border border-gray-100 p-4 rounded-3xl shadow-sm space-y-3">
                                    <input type="text" placeholder="Nguồn tiền..." value={incomeSource} onChange={e=>setIncomeSource(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-green-500/20"/>
                                    <div className="flex gap-3">
                                        <input type="text" inputMode="numeric" placeholder="Số tiền..." value={incomeAmount} onChange={e=>handleAmountInput(e.target.value, setIncomeAmount)} className="w-1/2 p-4 bg-gray-50 border-none rounded-2xl font-black text-lg outline-none"/>
                                        <CustomDatePicker value={incomeDate} onChange={e=>setIncomeDate(e.target.value)} className="flex-1" />
                                    </div>
                                    <button onClick={handleAddIncome} className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-lg shadow-green-100 uppercase text-xs tracking-[0.2em] active:scale-95 transition-all">Thêm Thu Nhập</button>
                                </div>
                            </section>

                            {/* NHẬP CHI */}
                            <section className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-2 text-red-600">
                                        <TrendingDown size={18}/><h2 className="text-xs font-black uppercase tracking-widest">2. Chi Tiêu</h2>
                                    </div>
                                    <button onClick={()=>setIsCategoryManageMode(!isCategoryManageMode)} className="text-[10px] font-black uppercase text-slate-400">{isCategoryManageMode ? 'Xong' : 'Sửa mục'}</button>
                                </div>
                                <div className="bg-white border border-gray-100 p-4 rounded-3xl shadow-sm space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        {categories.map((cat, idx) => (
                                            <div key={cat} className="relative h-16 group">
                                                {isCategoryManageMode ? (
                                                    <div className="absolute inset-0 bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 p-1 z-10 shadow-lg animate-fadeIn">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase truncate w-full text-center">{cat}</span>
                                                        <div className="flex gap-1.5">
                                                            <button onClick={()=>performSave({ cats: categories.filter(c => c !== cat) })} className="text-red-500"><Trash2 size={12}/></button>
                                                            <button onClick={()=>{const n = prompt("Tên mới?", cat); if(n) performSave({ cats: categories.map(c=>c===cat?n:c) })}} className="text-blue-500"><Edit2 size={12}/></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={()=>setExpenseCategory(cat)} className={`w-full h-full text-[10px] font-black rounded-xl border transition-all ${expenseCategory === cat ? 'bg-red-600 text-white border-red-600 shadow-xl scale-105' : 'bg-gray-50 text-slate-500 border-transparent hover:bg-gray-100'}`}>
                                                        {cat}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {!isCategoryManageMode && <button onClick={()=>{const n = prompt("Mục mới?"); if(n) performSave({ cats: [...categories, n] })}} className="h-16 flex items-center justify-center bg-white border-2 border-dashed border-gray-200 rounded-xl text-gray-300"><Plus/></button>}
                                    </div>

                                    {expenseCategory === DEBT_CATEGORY_NAME && (
                                        <div className="bg-blue-50 p-3 rounded-2xl space-y-2 border border-blue-100 animate-fadeIn">
                                            <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Người liên quan:</p>
                                            <select value={selectedDebtorId} onChange={e=>setSelectedDebtorId(e.target.value)} className="w-full p-3 bg-white border-none rounded-xl text-xs font-black outline-none shadow-sm">
                                                <option value="">-- Chọn sổ nợ --</option>
                                                {debts.map(d=><option key={d.id} value={d.id}>{d.type==='receivable'?'THU: ':'TRẢ: '}{d.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <input type="text" inputMode="numeric" placeholder="Số tiền chi..." value={expenseAmount} onChange={e=>handleAmountInput(e.target.value, setExpenseAmount)} className="w-1/2 p-4 bg-gray-50 border-none rounded-2xl font-black text-lg outline-none"/>
                                        <CustomDatePicker value={expenseDate} onChange={e=>setExpenseDate(e.target.value)} className="flex-1" />
                                    </div>
                                    <button onClick={handleAddExpense} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-100 uppercase text-xs tracking-[0.2em] active:scale-95 transition-all">Lưu Chi Tiêu</button>
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'debt' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-1">
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Users className="text-blue-600" size={20}/> Sổ Nợ Vay</h2>
                                <button onClick={()=>{setShowDebtForm(true); setIsEditingDebt(null); setDebtName(''); setDebtTotal(''); setDebtPaid('');}} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg btn-effect">Thêm mới</button>
                            </div>
                            
                            <div className="flex p-1 bg-gray-100 rounded-2xl mb-4">
                                <button onClick={()=>setActiveDebtTab('payable')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeDebtTab === 'payable' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}>Mình Nợ</button>
                                <button onClick={()=>setActiveDebtTab('receivable')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeDebtTab === 'receivable' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>Họ Nợ</button>
                            </div>

                            <div className="space-y-3">
                                {debts.filter(d=>d.type === activeDebtTab).map(item => (
                                    <div key={item.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden group">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.total - item.paid <= 0 ? 'bg-green-500' : (activeDebtTab === 'payable' ? 'bg-orange-500' : 'bg-blue-500')}`}></div>
                                        <div>
                                            <p className="font-black text-slate-800 text-sm uppercase">{item.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">CÒN: {formatCurrency(item.total - item.paid)} đ / TỔNG: {formatCurrency(item.total)} đ</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={()=>{setIsEditingDebt(item.id); setDebtName(item.name); setDebtTotal(formatCurrency(item.total)); setDebtPaid(formatCurrency(item.paid)); setDebtType(item.type); setDebtNote(item.note||''); setShowDebtForm(true);}} className="p-2 text-blue-500 bg-blue-50 rounded-xl"><Edit2 size={16}/></button>
                                            <button onClick={()=>{if(confirm('Xóa sổ?')) performSave({ debts: debts.filter(d=>d.id !== item.id) })}} className="p-2 text-red-500 bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                                {debts.filter(d=>d.type === activeDebtTab).length === 0 && <p className="text-center py-20 text-slate-300 text-[10px] font-black uppercase tracking-widest">Danh sách trống</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            <div className="flex gap-3 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                <Search size={18} className="text-slate-300 ml-2"/>
                                <input type="text" placeholder="Tìm tên, ghi chú..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="flex-1 bg-transparent border-none outline-none font-bold text-xs uppercase tracking-widest"/>
                            </div>
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                                {[...filteredIncomes.map(i=>({...i, type: 'income'})), ...filteredExpenses.map(e=>({...e, type: 'expense'}))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                                    <div key={`${item.type}-${item.id}`} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${item.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {item.type === 'income' ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                                            </div>
                                            <div className="max-w-[200px]">
                                                <p className="font-black text-[11px] uppercase truncate">{(item as any).source || (item as any).category}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{formatDate(item.date)} • {item.note || 'Ko ghi chú'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black text-sm ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                                            </p>
                                            <button onClick={()=>deleteItem(item.id, item.type as any)} className="text-[8px] font-black uppercase text-slate-300 hover:text-red-500 tracking-widest mt-1">Xóa</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-2xl space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Trạng thái Cloud</h3>
                                <div className="space-y-2 text-[10px] font-bold">
                                    <div className="flex justify-between py-1 border-b border-white/5"><span className="opacity-40">MÃ NHÓM:</span><span>{familyCode}</span></div>
                                    <div className="flex justify-between py-1 border-b border-white/5"><span className="opacity-40">KẾT NỐI:</span><span className={isConnected?'text-green-400':'text-red-400'}>{isConnected?'ỔN ĐỊNH':'LỖI'}</span></div>
                                    <div className="flex justify-between py-1 border-b border-white/5"><span className="opacity-40">DỮ LIỆU:</span><span>{incomes.length + expenses.length} giao dịch</span></div>
                                </div>
                                <button onClick={()=>window.location.reload()} className="w-full py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 flex items-center justify-center gap-2"><RefreshCw size={12}/> Buộc đồng bộ lại</button>
                            </div>

                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-3">
                                <button onClick={handleExportExcel} className="w-full p-4 bg-green-50 text-green-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm">Xuất báo cáo Excel <FileSpreadsheet size={18}/></button>
                                <button onClick={()=>setShowCloudForm(true)} className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm">Cấu hình Đám mây <Cloud size={18}/></button>
                                <button onClick={()=>{if(confirm('Xóa sạch dữ liệu trên máy này?')) { localStorage.clear(); window.location.reload(); }}} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm">Xóa dữ liệu cục bộ <Trash2 size={18}/></button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- FLOATING BALANCE --- */}
                <div className="fixed bottom-8 right-4 z-50">
                    <div className={`shadow-2xl rounded-3xl px-6 py-4 flex items-center gap-4 border-2 border-white transform active:scale-95 transition-all ring-8 ${balance >= 0 ? 'bg-slate-900 ring-slate-900/5' : 'bg-red-700 ring-red-700/5'}`}>
                        <div className="bg-white/10 p-2 rounded-xl"><Wallet size={20} className="text-white"/></div>
                        <div className="flex flex-col text-white">
                            <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Số dư ví</span>
                            <span className="text-lg font-black leading-none">{formatCurrency(balance)} đ</span>
                        </div>
                    </div>
                </div>

                {/* --- MODALS --- */}
                {showCloudForm && (
                    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-fadeIn">
                        <div className="bg-white rounded-[48px] w-full max-w-sm p-8 shadow-2xl relative">
                            <button onClick={()=>setShowCloudForm(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400"><X/></button>
                            <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter mb-8 flex items-center gap-3"><Cloud className="text-blue-600"/> Đám mây riêng</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-2">Mã Nhóm (Dùng chung các máy)</label>
                                    <input type="text" value={familyCode} onChange={e=>setFamilyCode(e.target.value.trim().toUpperCase())} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-black outline-none focus:border-blue-500 transition-all uppercase" placeholder="VÍ DỤ: GIADINH123" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-2">Firebase Config (JSON)</label>
                                    <textarea value={firebaseConfigStr} onChange={e=>setFirebaseConfigStr(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-[9px] h-40 outline-none resize-none font-mono focus:border-blue-500 transition-all" placeholder='{"apiKey": "...", ...}'></textarea>
                                </div>
                                <button onClick={()=>{
                                    if(!familyCode || !firebaseConfigStr) return alert("Thiếu thông tin!");
                                    localStorage.setItem('fb_config', firebaseConfigStr);
                                    localStorage.setItem('fb_family_code', familyCode.toUpperCase());
                                    window.location.reload();
                                }} className="w-full py-5 bg-blue-600 text-white font-black rounded-[24px] shadow-xl shadow-blue-100 uppercase text-xs tracking-[0.3em]">Kết nối & Đồng bộ</button>
                            </div>
                        </div>
                    </div>
                )}

                {showDebtForm && (
                    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-fadeIn">
                        <div className="bg-white rounded-[40px] w-full max-w-sm p-8 shadow-2xl relative">
                            <button onClick={()=>setShowDebtForm(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400"><X/></button>
                            <h3 className="font-black text-slate-800 text-lg uppercase tracking-widest mb-6">{isEditingDebt ? 'Sửa sổ nợ' : 'Thêm sổ nợ mới'}</h3>
                            <div className="space-y-4">
                                <div className="flex p-1 bg-gray-100 rounded-2xl">
                                    <button onClick={()=>setDebtType('payable')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${debtType === 'payable' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>Mình nợ</button>
                                    <button onClick={()=>setDebtType('receivable')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${debtType === 'receivable' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Họ nợ</button>
                                </div>
                                <input type="text" value={debtName} onChange={e=>setDebtName(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black text-sm outline-none" placeholder="Tên người liên quan..."/>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Tổng nợ</p>
                                        <input type="text" value={debtTotal} onChange={e=>handleAmountInput(e.target.value, setDebtTotal)} className="w-full p-3 bg-gray-50 rounded-xl font-black text-orange-600"/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Đã trả</p>
                                        <input type="text" value={debtPaid} onChange={e=>handleAmountInput(e.target.value, setDebtPaid)} className="w-full p-3 bg-gray-50 rounded-xl font-black text-blue-600"/>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-1">
                                    <input type="checkbox" checked={autoCreateTransaction} onChange={e=>setAutoCreateTransaction(e.target.checked)} id="debtSync" className="w-4 h-4 rounded-md accent-blue-600"/>
                                    <label htmlFor="debtSync" className="text-[10px] font-black text-slate-500 uppercase">Ghi vào lịch sử thu chi</label>
                                </div>
                                <button onClick={handleSaveDebt} className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-[10px] tracking-widest shadow-xl mt-4">Lưu sổ nợ</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;

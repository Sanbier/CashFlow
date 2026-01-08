
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
            <div className="w-full h-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-500 flex items-center justify-center pointer-events-none gap-2 input-effect transition-all duration-200"> 
                <span>{displayDate}</span><CalendarIcon size={16} className="opacity-70"/>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const getLocalToday = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // --- DATA STATES ---
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [fixedTemplate, setFixedTemplate] = useState<FixedTemplateItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [fixedTracking, setFixedTracking] = useState<Record<string, string[]>>({}); 
    
    // --- CRITICAL: REF SYSTEM FOR SYNC ---
    // Giữ tham chiếu tới dữ liệu mới nhất để tránh Stale Closures khi save
    const stateRef = useRef({ incomes, expenses, fixedTemplate, categories, debts, fixedTracking });
    useEffect(() => {
        stateRef.current = { incomes, expenses, fixedTemplate, categories, debts, fixedTracking };
    }, [incomes, expenses, fixedTemplate, categories, debts, fixedTracking]);

    const [viewDate, setViewDate] = useState(() => {
        const today = new Date();
        if (today.getDate() > 30) { today.setMonth(today.getMonth() + 1); today.setDate(1); }
        return today;
    });
    
    // Input States
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
    
    const [editingId, setEditingId] = useState<number | null>(null); 
    const [editingType, setEditingType] = useState<'income' | 'expense' | null>(null);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [filterCategory, setFilterCategory] = useState('all');
    
    const [showReloadConfirm, setShowReloadConfirm] = useState(false);
    const [showFixedConfig, setShowFixedConfig] = useState(false);
    const [showFixedTrackingModal, setShowFixedTrackingModal] = useState(false); 
    const [tempFixedList, setTempFixedList] = useState<Record<string, number>>({});
    const [fixedPaymentInputs, setFixedPaymentInputs] = useState<Record<string, string>>({});

    // Firebase Sync States
    const [firebaseConfigStr, setFirebaseConfigStr] = useState(() => localStorage.getItem('fb_config') || '');
    // Chuẩn hóa mã gia đình: Viết hoa, XÓA KHOẢNG TRẮNG
    const [familyCode, setFamilyCode] = useState(() => (localStorage.getItem('fb_family_code') || '').trim().replace(/\s/g, '').toUpperCase());
    const [isConnected, setIsConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showCloudForm, setShowCloudForm] = useState(false);
    const [syncProjectId, setSyncProjectId] = useState<string>('');
    const [lastSyncTime, setLastSyncTime] = useState<string>('');
    
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

    // --- INITIALIZATION & SYNC ---
    useEffect(() => {
        // Load Local Data First
        const loadLocal = () => {
            setIncomes(JSON.parse(localStorage.getItem('family_incomes') || '[]')); 
            setExpenses(JSON.parse(localStorage.getItem('family_expenses') || '[]')); 
            setFixedTemplate(JSON.parse(localStorage.getItem('family_fixed_template') || '[]')); 
            setCategories(JSON.parse(localStorage.getItem('family_categories') || JSON.stringify(DEFAULT_CATEGORIES))); 
            setDebts(JSON.parse(localStorage.getItem('family_debts') || '[]')); 
            setFixedTracking(JSON.parse(localStorage.getItem('family_fixed_tracking') || '{}'));
        };
        loadLocal();

        if (firebaseConfigStr && familyCode) {
            try {
                const config = JSON.parse(firebaseConfigStr);
                setSyncProjectId(config.projectId || 'Unknown');

                if (!firebase.apps.length) {
                    firebase.initializeApp(config);
                }
                const db = firebase.firestore();
                dbRef.current = db;
                setIsConnected(true);

                // --- REAL-TIME LISTENER ---
                const unsubscribe = db.collection('families').doc(familyCode).onSnapshot((doc: any) => {
                    if (doc.exists) { 
                        const data = doc.data(); 
                        console.log("🔥 Cloud Update Received:", data.lastUpdate);
                        
                        // Cập nhật State với dữ liệu từ Cloud
                        if(data.incomes) setIncomes(data.incomes);
                        if(data.expenses) setExpenses(data.expenses);
                        if(data.fixedTemplate) setFixedTemplate(data.fixedTemplate);
                        if(data.categories) setCategories(data.categories);
                        if(data.debts) setDebts(data.debts);
                        if(data.fixedTracking) setFixedTracking(data.fixedTracking);
                        
                        setLastSyncTime(new Date().toLocaleTimeString());

                        // Lưu ngay vào LocalStorage để backup
                        localStorage.setItem('family_incomes', JSON.stringify(data.incomes || []));
                        localStorage.setItem('family_expenses', JSON.stringify(data.expenses || []));
                        localStorage.setItem('family_fixed_template', JSON.stringify(data.fixedTemplate || []));
                        localStorage.setItem('family_categories', JSON.stringify(data.categories || DEFAULT_CATEGORIES));
                        localStorage.setItem('family_debts', JSON.stringify(data.debts || []));
                        localStorage.setItem('family_fixed_tracking', JSON.stringify(data.fixedTracking || {}));
                    } else {
                        // Nếu chưa có dữ liệu trên Cloud, đẩy dữ liệu Local lên (INIT)
                        // Chỉ làm việc này nếu Local có dữ liệu
                        if (stateRef.current.incomes.length > 0 || stateRef.current.expenses.length > 0) {
                            console.log("🚀 Initializing Cloud Data from Local...");
                            performSave({});
                        }
                    }
                }, (error: any) => { 
                    console.error("Sync Error:", error); 
                    setIsConnected(false);
                    alert("Lỗi kết nối đồng bộ: " + error.message);
                });
                return () => unsubscribe();
            } catch (e) { 
                console.error("Config Error:", e); 
                setIsConnected(false); 
            }
        }
    }, [firebaseConfigStr, familyCode]);

    // --- ROBUST SAVE FUNCTION ---
    // Thay vì nhận toàn bộ mảng, hàm này nhận "những gì thay đổi" (Partial Update)
    // Và tự động merge với dữ liệu mới nhất trong stateRef
    const performSave = (updates: { 
        incomes?: Income[], 
        expenses?: Expense[], 
        fixed?: FixedTemplateItem[], 
        cats?: string[], 
        debts?: Debt[], 
        tracking?: Record<string, string[]> 
    }) => {
        // 1. Lấy dữ liệu mới nhất (có thể vừa được cập nhật từ máy khác qua onSnapshot)
        const current = stateRef.current;

        // 2. Gộp thay đổi
        const finalIncomes = updates.incomes !== undefined ? updates.incomes : current.incomes;
        const finalExpenses = updates.expenses !== undefined ? updates.expenses : current.expenses;
        const finalFixed = updates.fixed !== undefined ? updates.fixed : current.fixedTemplate;
        const finalCats = updates.cats !== undefined ? updates.cats : current.categories;
        const finalDebts = updates.debts !== undefined ? updates.debts : current.debts;
        const finalTracking = updates.tracking !== undefined ? updates.tracking : current.fixedTracking;

        // 3. Cập nhật UI ngay lập tức
        setIncomes(finalIncomes);
        setExpenses(finalExpenses);
        setFixedTemplate(finalFixed);
        setCategories(finalCats);
        setDebts(finalDebts);
        setFixedTracking(finalTracking);

        // 4. Lưu Local
        localStorage.setItem('family_incomes', JSON.stringify(finalIncomes));
        localStorage.setItem('family_expenses', JSON.stringify(finalExpenses));
        localStorage.setItem('family_fixed_template', JSON.stringify(finalFixed));
        localStorage.setItem('family_categories', JSON.stringify(finalCats));
        localStorage.setItem('family_debts', JSON.stringify(finalDebts));
        localStorage.setItem('family_fixed_tracking', JSON.stringify(finalTracking));

        // 5. Đẩy lên Cloud (Atomic Write)
        if (isConnected && dbRef.current && familyCode) {
            setIsSyncing(true);
            const payload = {
                incomes: finalIncomes,
                expenses: finalExpenses,
                fixedTemplate: finalFixed,
                categories: finalCats,
                debts: finalDebts,
                fixedTracking: finalTracking,
                lastUpdate: new Date().toISOString(),
                updatedBy: navigator.userAgent // Debug info
            };
            
            dbRef.current.collection('families').doc(familyCode).set(payload)
                .then(() => {
                    setIsSyncing(false);
                })
                .catch((err: any) => {
                    setIsSyncing(false);
                    console.error("Save failed:", err);
                    alert("Không thể lưu lên Cloud! Kiểm tra mạng.");
                });
        }
    };

    // Helper functions
    const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);
    const formatDate = (date: string) => { if(!date) return ''; const d = new Date(date); return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`; };
    const parseAmount = (val: string) => val ? parseInt(val.replace(/\./g,''), 10) : 0;
    const handleAmountInput = (val: string, setter: (v: string) => void) => { const raw = val.replace(/\D/g,''); setter(raw === '' ? '' : Number(raw).toLocaleString('vi-VN')); };
    const getCombinedDate = (dateInput: string) => { const d = new Date(dateInput); const now = new Date(); d.setHours(now.getHours(), now.getMinutes(), now.getSeconds()); return d.toISOString(); };
    
    // Fiscal Logic
    const { startDate, endDate } = useMemo(() => {
        const year = viewDate.getFullYear(), month = viewDate.getMonth(); 
        const s = new Date(year, month, 1); s.setHours(0,0,0,0); 
        const e = new Date(year, month + 1, 0); e.setHours(23,59,59,999); 
        return { startDate: s, endDate: e };
    }, [viewDate]);

    const { filteredIncomes, filteredExpenses } = useMemo(() => {
        const filter = (items: any[], type: 'income' | 'expense') => items.filter(item => {
            const d = new Date(item.date);
            if (!(d >= startDate && d <= endDate)) return false;
            const searchLower = searchTerm.toLowerCase();
            const itemText = (type === 'income' ? item.source : item.category).toLowerCase();
            const itemNote = (item.note || '').toLowerCase();
            const itemAmount = item.amount.toString();
            return (searchTerm === '' || itemText.includes(searchLower) || itemNote.includes(searchLower) || itemAmount.includes(searchLower)) && (filterCategory === 'all' || (type === 'expense' && item.category === filterCategory) || (type === 'income' && filterCategory === 'income_type'));
        });
        return { filteredIncomes: filter(incomes, 'income'), filteredExpenses: filter(expenses, 'expense') };
    }, [incomes, expenses, startDate, endDate, searchTerm, filterCategory]);

    const sumIncomeMonth = useMemo(() => filteredIncomes.reduce((a, c) => a + c.amount, 0), [filteredIncomes]);
    const sumExpenseMonth = useMemo(() => filteredExpenses.reduce((a, c) => a + c.amount, 0), [filteredExpenses]);
    const balance = sumIncomeMonth - sumExpenseMonth;
    const isOverBudget = sumIncomeMonth > 0 && (sumExpenseMonth / sumIncomeMonth) > 0.9;
    const savingsSummary = useMemo(() => SAVING_CATEGORIES.map(cat => ({ category: cat, total: expenses.filter(e => e.category === cat).reduce((sum, item) => sum + item.amount, 0) })), [expenses]);

    // Action Handlers (Now using performSave with PARTIAL updates)
    const handleAddIncome = () => {
        const amt = parseAmount(incomeAmount); if(!incomeSource || amt <= 0) return;
        const newItem: Income = { id: editingId || Date.now(), source: incomeSource, amount: amt, date: getCombinedDate(incomeDate), note: incomeNote };
        const newIncomes = editingId && editingType === 'income' ? incomes.map(i => i.id === editingId ? newItem : i) : [newItem, ...incomes];
        
        performSave({ incomes: newIncomes }); // Chỉ gửi thay đổi incomes, các cái khác tự merge
        resetForm();
    };

    const handleAddExpense = () => {
        const amt = parseAmount(expenseAmount); if(!expenseCategory || amt <= 0) return;
        
        let newDebts = [...debts]; 
        let newIncomes = [...incomes];
        let finalNote = expenseNote; 
        let linkedDebtId = null; 
        let actionType: any = null;

        if (expenseCategory === DEBT_CATEGORY_NAME) {
            if (!selectedDebtorId) { alert("Vui lòng chọn người liên quan!"); return; }
            const debtItem = debts.find(d => d.id === Number(selectedDebtorId));
            if (debtItem) {
                linkedDebtId = debtItem.id;
                const newPaid = debtItem.paid + amt;
                newDebts = debts.map(d => d.id === debtItem.id ? { ...d, paid: newPaid, updatedAt: new Date().toISOString() } : d);
                
                if (debtItem.type === 'receivable') {
                    // Thu nợ -> Tăng thu nhập
                    const incItem: Income = { id: Date.now(), source: `Thu nợ: ${debtItem.name}`, amount: amt, date: getCombinedDate(expenseDate), note: `Nhận lại nợ: ${debtItem.name} ${expenseNote}`, relatedDebtId: linkedDebtId, debtAction: 'collect' }; 
                    performSave({ incomes: [incItem, ...incomes], debts: newDebts });
                    alert("Đã ghi nhận thu nhập từ thu nợ!"); resetForm(); return;
                } else {
                    // Trả nợ -> Tăng chi tiêu
                    finalNote = `Trả nợ: ${debtItem.name} ${expenseNote}`;
                    actionType = 'repay';
                }
            }
        }
        const newItem: Expense = { id: editingId || Date.now(), category: expenseCategory, amount: amt, date: getCombinedDate(expenseDate), note: finalNote, relatedDebtId: linkedDebtId, debtAction: actionType };
        const newExpenses = editingId && editingType === 'expense' ? expenses.map(e => e.id === editingId ? newItem : e) : [newItem, ...expenses];
        
        performSave({ expenses: newExpenses, debts: newDebts });
        resetForm();
    };

    const resetForm = () => { setIncomeSource(''); setIncomeAmount(''); setIncomeNote(''); setExpenseCategory(''); setExpenseAmount(''); setExpenseNote(''); setEditingId(null); setEditingType(null); setSelectedDebtorId(''); };

    const handleConfirmFixedItem = (item: FixedTemplateItem, confirmedAmount: number) => {
        if (!confirmedAmount || confirmedAmount <= 0) return;
        if (!confirm(`Xác nhận chi khoản "${item.category}"?`)) return;
        
        const newExpense: Expense = { id: Date.now(), category: item.category, amount: confirmedAmount, date: new Date().toISOString(), note: `Khoản chi cố định` };
        const trackingKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;
        const currentTracking = fixedTracking[trackingKey] || [];
        const newTrackingList = currentTracking.includes(item.category) ? currentTracking : [...currentTracking, item.category];
        
        performSave({ 
            expenses: [newExpense, ...expenses], 
            tracking: { ...fixedTracking, [trackingKey]: newTrackingList } 
        });
        setFixedPaymentInputs(prev => ({...prev, [item.category]: ''}));
    };

    const handleSaveDebt = () => {
        const total = parseAmount(debtTotal); const paid = parseAmount(debtPaid);
        if (!debtName || total <= 0) { alert("Nhập hợp lệ."); return; }
        
        const newItem: Debt = { id: isEditingDebt || Date.now(), name: debtName, total, paid, note: debtNote, type: debtType, updatedAt: new Date().toISOString() };
        let nextDebts = isEditingDebt ? debts.map(d => d.id === isEditingDebt ? newItem : d) : [newItem, ...debts];

        // Auto create transaction logic (giản lược cho an toàn)
        let nextIncomes = incomes;
        let nextExpenses = expenses;
        if (autoCreateTransaction && !isEditingDebt) {
            // Logic tạo giao dịch chỉ áp dụng khi tạo mới để tránh phức tạp
             if (debtType === 'receivable' && paid > 0) nextIncomes = [{ id: Date.now(), source: `Thu nợ: ${debtName}`, amount: paid, date: new Date().toISOString() }, ...incomes];
             if (debtType === 'payable' && paid > 0) nextExpenses = [{ id: Date.now(), category: DEBT_CATEGORY_NAME, amount: paid, date: new Date().toISOString(), note: `Trả nợ: ${debtName}` }, ...expenses];
        }

        performSave({ debts: nextDebts, incomes: nextIncomes, expenses: nextExpenses });
        setShowDebtForm(false); setIsEditingDebt(null); setDebtName(''); setDebtTotal(''); setDebtPaid(''); setDebtNote('');
    };

    const handleMoveCategory = (index: number, direction: 'up' | 'down' | 'left' | 'right') => {
        // ... (Logic move giữ nguyên, chỉ gọi performSave)
        let targetIndex = index;
        if (direction === 'left') targetIndex = index - 1; else if (direction === 'right') targetIndex = index + 1; else if (direction === 'up') targetIndex = index - 3; else if (direction === 'down') targetIndex = index + 3;
        if (targetIndex >= 0 && targetIndex < categories.length) {
            const newCats = [...categories];
            [newCats[index], newCats[targetIndex]] = [newCats[targetIndex], newCats[index]];
            performSave({ cats: newCats });
        }
    };

    const handleDeleteCategory = (cat: string) => { if(confirm("Xóa danh mục?")) performSave({ cats: categories.filter(c => c !== cat) }); };
    const handleRenameCategory = (old: string) => { const n = prompt("Tên mới:", old); if(n && n!==old) performSave({ cats: categories.map(c=>c===old?n:c) }); };
    const handleAddCustomCategory = () => { const n = prompt("Tên danh mục:"); if(n && !categories.includes(n)) performSave({ cats: [...categories, n] }); };
    
    const deleteItem = (id: number, type: 'income' | 'expense') => {
        if (!confirm('Xóa?')) return;
        if (type === 'income') performSave({ incomes: incomes.filter(i => i.id !== id) });
        else performSave({ expenses: expenses.filter(e => e.id !== id) });
    };

    const getMonthlyPaidForCategory = (cat: string) => filteredExpenses.filter(e => e.category === cat).reduce((sum, item) => sum + item.amount, 0);
    
    // --- RENDER ---
    return (
        <div className="min-h-screen pb-24 md:pb-0 relative font-sans overflow-x-hidden bg-gray-50">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
                {isOverBudget && <div className="bg-red-50 text-red-600 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-pulse-red border-b border-red-100"><AlertTriangle size={16} /> BÁO ĐỘNG: Chi tiêu vượt quá 90% thu nhập!</div>}
                
                <div className={`bg-gradient-to-r ${isConnected ? 'from-blue-900 to-slate-900' : 'from-slate-700 to-gray-800'} p-6 pb-6 text-white rounded-b-3xl shadow-lg relative transition-all duration-500`}>
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={()=>setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 15))} className="p-2 text-white/70 hover:text-white btn-effect"><ChevronLeft size={24}/></button>
                        <div className="text-center">
                            <span className="text-[10px] font-medium text-white/60 block mb-0.5 tracking-wider">{formatDate(startDate.toISOString())} - {formatDate(endDate.toISOString())}</span>
                            <div className="font-bold text-xl text-white flex items-center gap-2 justify-center uppercase tracking-wide"><CalendarIcon size={18}/> Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}</div>
                        </div>
                        <button onClick={()=>setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 15))} className="p-2 text-white/70 hover:text-white btn-effect"><ChevronRight size={24}/></button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-green-500/10 backdrop-blur-sm p-4 rounded-2xl border border-green-500/20">
                            <div className="text-green-400 text-[10px] font-black uppercase mb-1 flex items-center gap-1"><TrendingUp size={12}/> Thu Nhập</div>
                            <div className="font-bold text-lg">{formatCurrency(sumIncomeMonth)} đ</div>
                        </div>
                        <div className="bg-red-500/10 backdrop-blur-sm p-4 rounded-2xl border border-red-500/20">
                            <div className="text-red-400 text-[10px] font-black uppercase mb-1 flex items-center gap-1"><TrendingDown size={12}/> Chi Tiêu</div>
                            <div className="font-bold text-lg">{formatCurrency(sumExpenseMonth)} đ</div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-1">
                        {!isConnected ? (
                            <button onClick={()=>setShowCloudForm(true)} className="flex items-center gap-2 bg-red-500/80 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all backdrop-blur-md btn-effect shadow-lg shadow-red-500/20">
                                <CloudOff size={14}/> <span>Kết Nối Cloud</span>
                            </button>
                        ) : (
                            <div className="flex flex-col items-center animate-fadeIn">
                                <div className="flex items-center gap-3 bg-black/30 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                                    <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">MÃ: <span className="text-white">{familyCode}</span></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                                    <button onClick={()=>setShowCloudForm(true)} className="text-[10px] text-blue-300 font-bold border-l border-white/10 pl-3 hover:text-white transition-colors">Cấu hình</button>
                                </div>
                                {isSyncing ? <span className="text-[9px] text-yellow-300 font-bold mt-1 uppercase tracking-widest animate-pulse">Đang đồng bộ...</span> : <span className="text-[9px] text-white/30 font-bold mt-1 uppercase tracking-widest">Đã cập nhật: {lastSyncTime}</span>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-4 -mt-6 relative z-10">
                    <div className="bg-white rounded-xl shadow-xl p-1.5 flex border border-gray-100 overflow-x-auto no-scrollbar">
                        {(['add', 'debt', 'report', 'savings', 'history', 'settings'] as TabType[]).map(tab => (
                            <button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-1 min-w-[60px] py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all btn-effect flex flex-col items-center gap-1 ${activeTab === tab ? 'bg-slate-800 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
                                {tab === 'add' ? 'Nhập' : tab === 'debt' ? 'Sổ Nợ' : tab === 'report' ? 'Báo Cáo' : tab === 'savings' ? 'Heo Đất' : tab === 'history' ? 'Lịch Sử' : <SettingsIcon size={16}/>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 pb-32">
                    {/* --- TAB ADD --- */}
                    {activeTab === 'add' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            <div className="bg-white border border-green-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
                                <div className="flex items-center gap-2 text-green-700 font-black mb-3 uppercase text-xs tracking-widest"><TrendingUp size={16}/> 1. Thu Nhập</div>
                                <div className="space-y-3 pl-2">
                                    <input type="text" placeholder="Nguồn thu (Lương, Thưởng...)" value={incomeSource} onChange={e=>setIncomeSource(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold text-sm input-effect"/>
                                    <div className="flex gap-3">
                                        <input type="text" inputMode="numeric" placeholder="Số tiền..." value={incomeAmount} onChange={e=>handleAmountInput(e.target.value, setIncomeAmount)} className="w-1/2 p-3 bg-gray-50 border-none rounded-xl font-black text-gray-800 text-lg input-effect"/>
                                        <CustomDatePicker value={incomeDate} onChange={e=>setIncomeDate(e.target.value)} className="flex-1" />
                                    </div>
                                    <button onClick={handleAddIncome} className="w-full py-3.5 bg-green-600 text-white font-black rounded-xl shadow-lg shadow-green-100 btn-effect uppercase text-xs tracking-[0.2em]">Lưu Thu Nhập</button>
                                </div>
                            </div>
                            
                            <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                                <div className="flex items-center justify-between mb-3 pl-2">
                                    <div className="flex items-center gap-2 text-red-700 font-black uppercase text-xs tracking-widest"><TrendingDown size={16}/> 2. Chi Tiêu</div>
                                    <button onClick={() => setIsCategoryManageMode(!isCategoryManageMode)} className={`text-[9px] font-bold px-3 py-1 rounded-lg border transition-all uppercase ${isCategoryManageMode ? 'bg-red-600 text-white border-red-700' : 'bg-gray-50 text-gray-400'}`}>{isCategoryManageMode ? 'Xong' : 'Sửa Danh Mục'}</button>
                                </div>
                                <div className="space-y-4 pl-2">
                                    <div className="grid grid-cols-3 gap-2 pr-1">
                                        {categories.map((cat, idx) => (
                                            <div key={cat} className="relative h-[60px]">
                                                {isCategoryManageMode ? (
                                                    <div className="absolute inset-0 bg-white border border-red-100 rounded-xl flex flex-col items-center justify-center gap-1 z-20 shadow-sm animate-fadeIn">
                                                        <span className="text-[8px] font-black text-gray-400 truncate w-full text-center uppercase tracking-tighter">{cat}</span>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleRenameCategory(cat)} className="text-blue-500"><Edit2 size={12}/></button>
                                                            <button onClick={() => handleDeleteCategory(cat)} className="text-red-500"><Trash2 size={12}/></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setExpenseCategory(cat)} className={`w-full h-full text-[10px] font-black rounded-xl border transition-all uppercase tracking-tight ${expenseCategory === cat ? 'bg-red-600 text-white border-red-600 shadow-lg scale-105 z-10' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}>{cat}</button>
                                                )}
                                            </div>
                                        ))}
                                        {!isCategoryManageMode && <button onClick={handleAddCustomCategory} className="h-[60px] rounded-xl border-2 border-dashed border-gray-200 text-gray-300 flex items-center justify-center hover:bg-gray-50"><Plus size={20}/></button>}
                                    </div>
                                    
                                    {expenseCategory && !isCategoryManageMode && (
                                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl animate-fadeIn flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-sm"><Clock size={12}/></div>
                                                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tight">Tháng này đã tiêu:</span>
                                            </div>
                                            <span className="text-sm font-black text-indigo-800">{formatCurrency(getMonthlyPaidForCategory(expenseCategory))} đ</span>
                                        </div>
                                    )}
                                    
                                    {expenseCategory === DEBT_CATEGORY_NAME && (
                                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl animate-fadeIn shadow-inner">
                                            <label className="text-[9px] font-black text-blue-700 uppercase mb-1 block tracking-widest pl-1">Người liên quan:</label>
                                            <select value={selectedDebtorId} onChange={(e) => setSelectedDebtorId(e.target.value)} className="w-full p-2.5 bg-white border border-blue-300 rounded-lg text-xs font-black outline-none shadow-sm">
                                                <option value="">-- Chọn Sổ Nợ --</option>
                                                {debts.map(d => <option key={d.id} value={d.id}>{d.type === 'receivable' ? 'THU: ' : 'TRẢ: '}{d.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <input type="text" inputMode="numeric" placeholder="Số tiền..." value={expenseAmount} onChange={e=>handleAmountInput(e.target.value, setExpenseAmount)} className="w-1/2 p-3 bg-gray-50 border-none rounded-xl font-black text-gray-800 text-lg input-effect"/>
                                        <CustomDatePicker value={expenseDate} onChange={e=>setExpenseDate(e.target.value)} className="flex-1" />
                                    </div>
                                    <button onClick={handleAddExpense} disabled={!expenseCategory || !expenseAmount} className="w-full py-3.5 bg-red-600 text-white font-black rounded-xl shadow-lg shadow-red-100 btn-effect uppercase text-xs tracking-[0.2em]">Lưu Chi Tiêu</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* --- TAB DEBT --- */}
                    {activeTab === 'debt' && (
                        <div className="space-y-4 animate-fadeIn mt-2">
                             {!showDebtForm ? (
                                <>
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="font-black text-gray-800 flex items-center gap-2 uppercase text-xs tracking-widest"><Users className="text-blue-600" size={18}/> Sổ Nợ</h3>
                                        <button onClick={() => { setShowDebtForm(true); setIsEditingDebt(null); setDebtName(''); setDebtTotal(''); setDebtPaid(''); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-200 btn-effect">Thêm Sổ</button>
                                    </div>
                                    <div className="flex p-1 bg-gray-200 rounded-xl">
                                        <button onClick={()=>setActiveDebtTab('payable')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeDebtTab==='payable' ? 'bg-white text-orange-600 shadow-md' : 'text-gray-500'}`}>Mình nợ</button>
                                        <button onClick={()=>setActiveDebtTab('receivable')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeDebtTab==='receivable' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500'}`}>Họ nợ</button>
                                    </div>
                                    <div className="space-y-3">
                                        {debts.filter(d => d.type === activeDebtTab).map(item => (
                                            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden">
                                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.total - item.paid <= 0 ? 'bg-green-500' : (activeDebtTab === 'payable' ? 'bg-orange-500' : 'bg-blue-500')}`}></div>
                                                <div className="pl-3">
                                                    <p className="font-black text-gray-800 text-sm uppercase">{item.name}</p>
                                                    <div className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-tight">CÒN: {formatCurrency(item.total - item.paid)} / TỔNG: {formatCurrency(item.total)}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={()=>{setIsEditingDebt(item.id); setDebtName(item.name); setDebtTotal(formatCurrency(item.total)); setDebtPaid(formatCurrency(item.paid)); setDebtNote(item.note||''); setDebtType(item.type); setShowDebtForm(true);}} className="text-blue-500 p-2 bg-blue-50 rounded-xl"><Edit2 size={16}/></button>
                                                    <button onClick={()=>{if(confirm('Xóa sổ nợ này?')) performSave({ debts: debts.filter(d => d.id !== item.id) });}} className="text-red-400 p-2 bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                             ) : (
                                <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100 animate-fadeIn space-y-5">
                                    <div className="flex gap-2 mb-2">
                                        <button onClick={()=>setDebtType('payable')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl border transition-all ${debtType==='payable'?'bg-orange-100 text-orange-700 border-orange-300':'bg-gray-50 text-gray-400 border-transparent'}`}>Mình nợ</button>
                                        <button onClick={()=>setDebtType('receivable')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl border transition-all ${debtType==='receivable'?'bg-blue-100 text-blue-700 border-blue-300':'bg-gray-50 text-gray-400 border-transparent'}`}>Họ nợ</button>
                                    </div>
                                    <input type="text" value={debtName} onChange={e=>setDebtName(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black outline-none text-sm" placeholder="TÊN NGƯỜI LIÊN QUAN..."/>
                                    <div className="flex gap-3">
                                        <div className="flex-1"><label className="text-[9px] text-gray-400 font-black uppercase block mb-1 tracking-widest pl-2">Tổng nợ</label><input type="text" value={debtTotal} onChange={e=>handleAmountInput(e.target.value, setDebtTotal)} className="w-full p-3 bg-gray-50 border-none rounded-xl font-black text-orange-600 outline-none text-lg" /></div>
                                        <div className="flex-1"><label className="text-[9px] text-gray-400 font-black uppercase block mb-1 tracking-widest pl-2">Đã trả</label><input type="text" value={debtPaid} onChange={e=>handleAmountInput(e.target.value, setDebtPaid)} className="w-full p-3 bg-gray-50 border-none rounded-xl font-black text-blue-600 outline-none text-lg" /></div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={()=>setShowDebtForm(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl text-[10px] uppercase tracking-widest">Hủy</button>
                                        <button onClick={handleSaveDebt} className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg text-[10px] uppercase tracking-widest">Lưu Sổ</button>
                                    </div>
                                </div>
                             )}
                        </div>
                    )}
                    
                    {/* --- TAB SETTINGS (NEW DEBUG INFO) --- */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                             {/* KHU VỰC KIỂM TRA ĐỒNG BỘ */}
                            <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-2xl space-y-3">
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Thông tin Đồng bộ</h4>
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-black ${isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{isConnected ? 'ĐÃ KẾT NỐI' : 'NGẮT KẾT NỐI'}</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase">Project ID (Phải giống nhau):</span>
                                        <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded">{syncProjectId}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase">Mã Gia Đình (Phải giống nhau):</span>
                                        <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-yellow-300">{familyCode}</span>
                                    </div>
                                </div>
                                <div className="bg-blue-900/30 p-3 rounded-xl border border-blue-500/20 text-[9px] text-blue-200 leading-relaxed">
                                    Nếu 2 máy không thấy nhau, hãy kiểm tra kỹ 2 thông số trên. Mã gia đình đã được tự động viết hoa và xóa khoảng trắng để tránh lỗi nhập liệu.
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-black text-gray-800 border-b border-gray-50 pb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><SettingsIcon size={20} className="text-slate-500"/> Thiết lập</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <button onClick={()=>setShowFixedConfig(true)} className="w-full p-4 bg-purple-50 text-purple-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm active:scale-95 transition-all">Chi Tiêu Cố Định <Clock size={18}/></button>
                                    <button onClick={()=>{
                                        const wb = XLSX.utils.book_new();
                                        const incData = filteredIncomes.map(i => ({ "Ngày": formatDate(i.date), "Nguồn": i.source, "Số tiền": i.amount, "Ghi chú": i.note }));
                                        const expData = filteredExpenses.map(e => ({ "Ngày": formatDate(e.date), "Danh mục": e.category, "Số tiền": e.amount, "Ghi chú": e.note }));
                                        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incData), "Thu Nhập");
                                        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expData), "Chi Tiêu");
                                        XLSX.writeFile(wb, `BaoCao_${viewDate.getMonth()+1}.xlsx`);
                                    }} className="w-full p-4 bg-green-50 text-green-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm active:scale-95 transition-all">Xuất Excel <FileSpreadsheet size={18}/></button>
                                    <button onClick={()=>setShowCloudForm(true)} className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm active:scale-95 transition-all">Cấu Hình Cloud <Cloud size={18}/></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Report, History, Savings Tabs: Giữ nguyên UI nhưng dùng data đã sync */}
                    {activeTab === 'report' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-50 pb-4 uppercase text-sm tracking-widest"><PieChart size={18} className="text-indigo-600"/> Phân tích chi tiêu</h3>
                                <div className="space-y-6">
                                    {Object.entries(filteredExpenses.reduce((a,c)=>{a[c.category]=(a[c.category]||0)+c.amount; return a;}, {} as any)).sort(([,a],[,b]) => (b as number)-(a as number)).map(([cat, amt]) => {
                                        const pct = sumIncomeMonth > 0 ? Math.round(((amt as number)/sumIncomeMonth)*100) : 0;
                                        return (
                                            <div key={cat} className="animate-fadeIn">
                                                <div className="flex justify-between text-[11px] font-black mb-2 uppercase tracking-tight">
                                                    <span className="text-gray-500">{cat}</span>
                                                    <span className="text-gray-900">{formatCurrency(amt as number)} đ <span className="text-indigo-400 font-bold ml-1">({pct}%)</span></span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-50">
                                                    <div className="bg-gradient-to-r from-indigo-600 to-purple-500 h-full rounded-full transition-all duration-700 ease-out" style={{width: `${Math.min(pct,100)}%`}}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredExpenses.length === 0 && <div className="text-center py-12 text-gray-400 text-[10px] font-black uppercase tracking-widest">Không có dữ liệu</div>}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'savings' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                             <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest flex items-center gap-2"><PiggyBank size={20} className="text-yellow-500"/> Tích Lũy</h3>
                                {savingsSummary.map(item => (
                                    <div key={item.category} className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-500 uppercase">{item.category}</span>
                                        <span className="text-sm font-black text-yellow-600">{formatCurrency(item.total)} đ</span>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-fadeIn mt-2 space-y-3">
                             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex gap-3 items-center"><Search size={18} className="text-gray-300"/><input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="flex-1 outline-none text-xs font-black uppercase tracking-widest placeholder:text-gray-200"/></div>
                             <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                                {[...filteredIncomes.map(i=>({...i,type:'income'})), ...filteredExpenses.map(e=>({...e,type:'expense'}))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                                    <div key={item.id} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${item.type==='income'?'bg-green-50 text-green-600':'bg-red-50 text-red-600'}`}>{item.type==='income'?<TrendingUp size={20}/>:<TrendingDown size={20}/>}</div>
                                            <div className="max-w-[180px]">
                                                <p className="font-black text-gray-800 text-[11px] truncate uppercase tracking-tight">{(item as any).source || (item as any).category}</p>
                                                <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-0.5">{formatDate(item.date)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black text-[13px] ${item.type==='income'?'text-green-600':'text-red-600'}`}>{item.type==='income'?'+':'-'}{formatCurrency(item.amount)}</p>
                                            <button onClick={()=>deleteItem(item.id, item.type as any)} className="text-[9px] text-gray-300 font-black uppercase mt-1 tracking-widest hover:text-red-500">Xóa</button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}
                </div>

                {/* FAB & Bottom Overlays */}
                <div className="fixed bottom-8 left-4 z-50 flex flex-col gap-3">
                    <button onClick={()=>setShowFixedTrackingModal(true)} className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border-2 border-white/20 transform hover:rotate-12 transition-all ring-8 ring-slate-900/5">
                        <MessageCircle size={22}/>
                    </button>
                </div>

                <div className="fixed bottom-8 right-4 z-50">
                    <div className={`shadow-2xl rounded-[24px] px-6 py-4 flex items-center gap-4 border-2 border-white/40 transform active:scale-95 transition-all ring-8 ${balance>=0?'bg-gradient-to-r from-blue-700 to-indigo-600 ring-blue-500/10':'bg-gradient-to-r from-red-700 to-orange-600 ring-red-500/10'}`}>
                        <div className="bg-white/20 p-2 rounded-xl"><Wallet size={22} className="text-white"/></div>
                        <div className="flex flex-col items-start text-white font-black text-xl leading-none tracking-tight">{formatCurrency(balance)} đ</div>
                    </div>
                </div>

                {/* MODALS */}
                {showCloudForm && (
                    <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-6 backdrop-blur-md animate-fadeIn">
                        <div className="bg-white rounded-[48px] w-full max-w-sm p-8 shadow-2xl text-left border border-white/20 relative">
                            <button onClick={()=>setShowCloudForm(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
                            <div className="flex items-center gap-3 mb-8"><Cloud size={28} className="text-blue-600"/><h3 className="font-black text-gray-800 text-xl uppercase tracking-tighter">Cấu hình Đám mây</h3></div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-2">Mã Gia Đình (Tự động viết hoa & xóa dấu cách)</label>
                                    <input type="text" value={familyCode} onChange={e=>setFamilyCode(e.target.value.toUpperCase())} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-black outline-none focus:border-blue-500 transition-all uppercase" placeholder="VD: NHATOI123" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-2">Firebase Config (JSON)</label>
                                    <textarea value={firebaseConfigStr} onChange={e=>setFirebaseConfigStr(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-[9px] h-40 outline-none resize-none font-mono focus:border-blue-500 transition-all" placeholder='{"apiKey": "...", ...}'></textarea>
                                </div>
                                <button onClick={()=>{
                                    const code = familyCode.trim().replace(/\s/g, '').toUpperCase();
                                    if(!code || !firebaseConfigStr) { alert("Thiếu thông tin"); return; }
                                    localStorage.setItem('fb_config', firebaseConfigStr); 
                                    localStorage.setItem('fb_family_code', code); 
                                    window.location.reload();
                                }} className="w-full py-5 bg-blue-600 text-white font-black rounded-[24px] shadow-xl shadow-blue-100 uppercase text-xs tracking-[0.3em] active:scale-95 transition-all">Lưu & Kết Nối</button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Modal Fixed Tracking & Config giữ nguyên logic UI nhưng sử dụng performSave để update */}
                {showFixedTrackingModal && (
                    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center backdrop-blur-md animate-fadeIn">
                        <div className="bg-white rounded-t-[48px] w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border-t border-white/20">
                            <div className="p-8 bg-slate-50 rounded-t-[48px] flex justify-between items-center border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-900 p-2.5 rounded-2xl text-white shadow-lg"><Clock size={20}/></div>
                                    <h3 className="font-black text-gray-800 text-lg uppercase tracking-tighter">Theo dõi Chi Cố Định</h3>
                                </div>
                                <button onClick={()=>setShowFixedTrackingModal(false)} className="bg-white p-2.5 rounded-full shadow-sm text-gray-400"><X size={20}/></button>
                            </div>
                            <div className="p-8 overflow-y-auto flex-1 space-y-6 no-scrollbar pb-24">
                                {fixedTemplate.map(item => {
                                    const paid = getMonthlyPaidForCategory(item.category); const rem = item.amount - paid; const done = rem <= 0;
                                    const inp = fixedPaymentInputs[item.category] || (rem > 0 ? formatCurrency(rem) : '');
                                    return (
                                        <div key={item.category} className={`bg-gray-50 p-5 rounded-3xl border border-gray-100 transition-all ${done ? 'opacity-30' : 'shadow-sm'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="text-[11px] font-black text-gray-800 block uppercase tracking-tight">{item.category}</span>
                                                    <span className="text-[9px] text-gray-400 font-black uppercase mt-1">Hạn mức: {formatCurrency(item.amount)} đ</span>
                                                </div>
                                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${done ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>{done ? 'ĐÃ XONG' : `CÒN: ${formatCurrency(rem)} đ`}</span>
                                            </div>
                                            {!done && (
                                                <div className="flex gap-3 mt-4">
                                                    <input type="text" inputMode="numeric" value={inp} onChange={(e) => handleAmountInput(e.target.value, (v)=>setFixedPaymentInputs(p=>({...p, [item.category]: v})))} className="flex-1 p-3.5 bg-white border-2 border-transparent rounded-2xl text-sm font-black outline-none focus:border-indigo-400 transition-all" placeholder="Số tiền chi..." />
                                                    <button onClick={() => handleConfirmFixedItem(item, parseAmount(inp))} className="px-6 py-3.5 bg-indigo-600 text-white text-[10px] font-black rounded-2xl shadow-lg shadow-indigo-100 uppercase tracking-widest active:scale-95">CHI</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {fixedTemplate.length === 0 && <div className="text-center py-20 text-gray-300 text-[10px] font-black uppercase tracking-widest">Chưa thiết lập mục cố định</div>}
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
                                        <input type="text" inputMode="numeric" value={tempFixedList[cat] ? formatCurrency(tempFixedList[cat]) : (fixedTemplate.find(f => f.category === cat)?.amount ? formatCurrency(fixedTemplate.find(f => f.category === cat)!.amount) : '')} onChange={(e) => handleAmountInput(e.target.value, (v)=>setTempFixedList(p=>({...p, [cat]: parseAmount(v)})))} className="w-24 p-2 bg-white border-2 border-transparent rounded-xl text-[11px] font-black text-right text-purple-700 outline-none focus:border-purple-300 transition-all" placeholder="0 đ"/>
                                    </div>
                                ))}
                            </div>
                            <button onClick={()=>{
                                performSave({ fixed: Object.entries(tempFixedList).filter(([,a])=>(a as number)>0).map(([c,a])=>({category:c, amount:a as number})) }); 
                                setShowFixedConfig(false);
                            }} className="w-full py-5 bg-slate-900 text-white font-black rounded-[24px] mt-8 uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-slate-200 active:scale-95 transition-all">Lưu Cấu Hình</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;


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
  Clock 
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
    const [categorySpent, setCategorySpent] = useState(0); 
    
    const [showFixedConfig, setShowFixedConfig] = useState(false);
    const [showFixedTrackingModal, setShowFixedTrackingModal] = useState(false); 
    const [tempFixedList, setTempFixedList] = useState<Record<string, number>>({});
    const [fixedPaymentInputs, setFixedPaymentInputs] = useState<Record<string, string>>({});

    const [firebaseConfigStr, setFirebaseConfigStr] = useState(() => localStorage.getItem('fb_config') || '');
    const [familyCode, setFamilyCode] = useState(() => localStorage.getItem('fb_family_code') || '');
    const [isConnected, setIsConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showCloudForm, setShowCloudForm] = useState(false);
    
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const initData = () => {
            const localIncomes = JSON.parse(localStorage.getItem('family_incomes') || '[]');
            const localExpenses = JSON.parse(localStorage.getItem('family_expenses') || '[]');
            const localFixed = JSON.parse(localStorage.getItem('family_fixed_template') || '[]');
            const localFixedTracking = JSON.parse(localStorage.getItem('family_fixed_tracking') || '{}');
            let localCats = JSON.parse(localStorage.getItem('family_categories') || 'null');
            if (!localCats) {
                localCats = Array.from(new Set([...DEFAULT_CATEGORIES]));
            }
            const localDebts = JSON.parse(localStorage.getItem('family_debts') || '[]');
            const migratedDebts = localDebts.map((d: any) => ({...d, type: d.type || 'payable'}));
            setIncomes(localIncomes); setExpenses(localExpenses); setFixedTemplate(localFixed); setCategories(localCats); setDebts(migratedDebts); setFixedTracking(localFixedTracking);
        }

        if (firebaseConfigStr && familyCode) {
            try {
                const config = JSON.parse(firebaseConfigStr);
                if (!firebase.apps.length) { firebase.initializeApp(config); }
                const db = firebase.firestore();
                dbRef.current = db;
                setIsConnected(true);
                setIsSyncing(true);
                const unsubscribe = db.collection('families').doc(familyCode).onSnapshot((doc: any) => {
                    if (doc.exists) { 
                        const data = doc.data(); 
                        setIncomes(data.incomes || []); 
                        setExpenses(data.expenses || []); 
                        setFixedTemplate(data.fixedTemplate || []);
                        setCategories(data.categories || DEFAULT_CATEGORIES);
                        const loadedDebts = data.debts || [];
                        setDebts(loadedDebts.map((d: any) => ({...d, type: d.type || 'payable'})));
                        setFixedTracking(data.fixedTracking || {});
                    } else { 
                        initData();
                        const initialCats = JSON.parse(localStorage.getItem('family_categories') || JSON.stringify(DEFAULT_CATEGORIES));
                        db.collection('families').doc(familyCode).set({ 
                            incomes: [], expenses: [], fixedTemplate: [], 
                            categories: initialCats, debts: [], fixedTracking: {}
                        }); 
                    }
                    setIsSyncing(false);
                }, (error: any) => { console.error(error); setIsConnected(false); });
                return () => unsubscribe();
            } catch (e) { console.error(e); setIsConnected(false); initData(); }
        } else { initData(); }
    }, [firebaseConfigStr, familyCode]);

    const saveData = (newIncomes: Income[], newExpenses: Expense[], newFixed = fixedTemplate, newCats = categories, newDebts = debts, newTracking = fixedTracking) => {
        setIncomes(newIncomes); setExpenses(newExpenses); setFixedTemplate(newFixed); setCategories(newCats); setDebts(newDebts); setFixedTracking(newTracking);
        localStorage.setItem('family_incomes', JSON.stringify(newIncomes));
        localStorage.setItem('family_expenses', JSON.stringify(newExpenses));
        localStorage.setItem('family_fixed_template', JSON.stringify(newFixed));
        localStorage.setItem('family_categories', JSON.stringify(newCats));
        localStorage.setItem('family_debts', JSON.stringify(newDebts));
        localStorage.setItem('family_fixed_tracking', JSON.stringify(newTracking));
        if (isConnected && dbRef.current && familyCode) {
            setIsSyncing(true);
            dbRef.current.collection('families').doc(familyCode).set({ 
                incomes: newIncomes, expenses: newExpenses, fixedTemplate: newFixed, 
                categories: newCats, debts: newDebts, fixedTracking: newTracking
            }).then(() => setIsSyncing(false)).catch(() => setIsSyncing(false));
        }
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);
    const formatDate = (date: string) => { if(!date) return ''; const d = new Date(date); return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`; };
    const formatTime = (date: string) => { if(!date) return ''; const d = new Date(date); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; };
    
    const getFiscalRange = (date: Date) => { 
        const year = date.getFullYear(), month = date.getMonth(); 
        const startDate = new Date(year, month, 1); startDate.setHours(0,0,0,0); 
        const endDate = new Date(year, month + 1, 0); endDate.setHours(23,59,59,999); 
        return { startDate, endDate }; 
    };
    
    const { startDate, endDate } = useMemo(() => getFiscalRange(viewDate), [viewDate]);
    const availableFilterCategories = useMemo(() => Array.from(new Set([...categories, ...expenses.map(e => e.category)])).sort(), [expenses, categories]);

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

    const parseAmount = (val: string) => val ? parseInt(val.replace(/\./g,''), 10) : 0;
    const handleAmountInput = (val: string, setter: (v: string) => void) => { const raw = val.replace(/\D/g,''); setter(raw === '' ? '' : Number(raw).toLocaleString('vi-VN')); };
    const getCombinedDate = (dateInput: string) => { const d = new Date(dateInput); const now = new Date(); d.setHours(now.getHours(), now.getMinutes(), now.getSeconds()); return d.toISOString(); };

    const handleAddIncome = () => {
        const amt = parseAmount(incomeAmount); if(!incomeSource || amt <= 0) return;
        const newItem: Income = { id: editingId || Date.now(), source: incomeSource, amount: amt, date: getCombinedDate(incomeDate), note: incomeNote };
        const newIncomes = editingId && editingType === 'income' ? incomes.map(i => i.id === editingId ? newItem : i) : [newItem, ...incomes];
        saveData(newIncomes, expenses); resetForm();
    };

    const handleAddExpense = () => {
        const amt = parseAmount(expenseAmount); if(!expenseCategory || amt <= 0) return;
        let updatedDebts = debts; let finalNote = expenseNote; let linkedDebtId = null; let actionType: any = null;
        if (expenseCategory === DEBT_CATEGORY_NAME) {
            if (!selectedDebtorId) { alert("Vui lòng chọn người liên quan!"); return; }
            const debtItem = debts.find(d => d.id === Number(selectedDebtorId));
            if (debtItem) {
                linkedDebtId = debtItem.id;
                if (debtItem.type === 'receivable') {
                    const newPaid = debtItem.paid + amt;
                    updatedDebts = debts.map(d => d.id === debtItem.id ? { ...d, paid: newPaid, updatedAt: new Date().toISOString() } : d);
                    const newItem: Income = { id: Date.now(), source: `Thu nợ: ${debtItem.name}`, amount: amt, date: getCombinedDate(expenseDate), note: `Nhận lại nợ: ${debtItem.name} ${expenseNote ? '- ' + expenseNote : ''}`, relatedDebtId: linkedDebtId, debtAction: 'collect' }; 
                    saveData([newItem, ...incomes], expenses, fixedTemplate, categories, updatedDebts);
                    alert("Đã ghi nhận thu nhập từ thu nợ!"); resetForm(); return;
                } else {
                    const newPaid = debtItem.paid + amt;
                    updatedDebts = debts.map(d => d.id === debtItem.id ? { ...d, paid: newPaid, updatedAt: new Date().toISOString() } : d);
                    finalNote = `Trả nợ: ${debtItem.name} ${expenseNote ? '- ' + expenseNote : ''}`;
                    actionType = 'repay';
                }
            }
        }
        const newItem: Expense = { id: editingId || Date.now(), category: expenseCategory, amount: amt, date: getCombinedDate(expenseDate), note: finalNote, relatedDebtId: linkedDebtId, debtAction: actionType };
        const newExpenses = editingId && editingType === 'expense' ? expenses.map(e => e.id === editingId ? newItem : e) : [newItem, ...expenses];
        saveData(incomes, newExpenses, fixedTemplate, categories, updatedDebts); resetForm();
    };

    const resetForm = () => { setIncomeSource(''); setIncomeAmount(''); setIncomeNote(''); setExpenseCategory(''); setExpenseAmount(''); setExpenseNote(''); setEditingId(null); setEditingType(null); setSelectedDebtorId(''); };

    // Fixed Tracking Logic from Original
    const getMonthlyPaidForCategory = (cat: string) => {
        return expenses.filter(e => e.category === cat && new Date(e.date) >= startDate && new Date(e.date) <= endDate)
            .reduce((sum, item) => sum + item.amount, 0);
    };

    const handleConfirmFixedItem = (item: FixedTemplateItem, confirmedAmount: number) => {
        if (!confirmedAmount || confirmedAmount <= 0) return;
        if (!confirm(`Xác nhận chi khoản "${item.category}" với số tiền ${formatCurrency(confirmedAmount)}đ?`)) return;
        const newExpense: Expense = { id: Date.now(), category: item.category, amount: confirmedAmount, date: new Date().toISOString(), note: `Khoản chi cố định` };
        const newExpenses = [newExpense, ...expenses];
        const trackingKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;
        const currentTracking = fixedTracking[trackingKey] || [];
        const newTrackingList = currentTracking.includes(item.category) ? currentTracking : [...currentTracking, item.category];
        saveData(incomes, newExpenses, fixedTemplate, categories, debts, { ...fixedTracking, [trackingKey]: newTrackingList });
        setFixedPaymentInputs(prev => ({...prev, [item.category]: ''}));
    };

    const handleRemoveFixedItem = (catToRemove: string) => {
        if(confirm(`Xóa "${catToRemove}" khỏi danh sách theo dõi cố định?`)) {
            saveData(incomes, expenses, fixedTemplate.filter(t => t.category !== catToRemove));
        }
    };

    // Debt Save Logic from Original
    const handleSaveDebt = () => {
        const total = parseAmount(debtTotal); const paid = parseAmount(debtPaid);
        if (!debtName || total <= 0) { alert("Nhập tên và tổng nợ hợp lệ."); return; }
        
        if (!isEditingDebt) {
            const existing = debts.find(d => d.name.trim().toLowerCase() === debtName.trim().toLowerCase() && d.type === debtType);
            if (existing && confirm(`Cộng dồn vào hồ sơ "${existing.name}"?`)) {
                saveData(incomes, expenses, fixedTemplate, categories, debts.map(d => d.id === existing.id ? { ...d, total: d.total + total, paid: d.paid + paid, updatedAt: new Date().toISOString() } : d));
                setShowDebtForm(false); return;
            }
        }

        let currentIncomes = [...incomes]; let currentExpenses = [...expenses];
        if (autoCreateTransaction) {
            const old = isEditingDebt ? debts.find(d => d.id === isEditingDebt) : null;
            const oldPaid = old ? old.paid : 0; const oldTotal = old ? old.total : 0;
            if (debtType === 'receivable') {
                if (total > oldTotal) currentExpenses.unshift({ id: Date.now(), category: DEBT_CATEGORY_NAME, amount: total - oldTotal, date: new Date().toISOString(), note: `Cho vay thêm: ${debtName}`, debtAction: 'lend' });
                if (paid > oldPaid) currentIncomes.unshift({ id: Date.now() + 1, source: `Thu nợ: ${debtName}`, amount: paid - oldPaid, date: new Date().toISOString(), debtAction: 'collect' });
            } else if (paid > oldPaid) {
                currentExpenses.unshift({ id: Date.now(), category: DEBT_CATEGORY_NAME, amount: paid - oldPaid, date: new Date().toISOString(), note: `Trả nợ: ${debtName}`, debtAction: 'repay' });
            }
        }

        const newItem: Debt = { id: isEditingDebt || Date.now(), name: debtName, total, paid, note: debtNote, type: debtType, updatedAt: new Date().toISOString() };
        saveData(currentIncomes, currentExpenses, fixedTemplate, categories, isEditingDebt ? debts.map(d => d.id === isEditingDebt ? newItem : d) : [newItem, ...debts]);
        setShowDebtForm(false); setIsEditingDebt(null); setDebtName(''); setDebtTotal(''); setDebtPaid(''); setDebtNote('');
    };

    // Fix: Adding missing handlers for category management, items deletion, and data operations
    const handleEditCategory = (cat: string) => {
        const action = prompt(`Sửa tên danh mục "${cat}" hoặc nhập "XOA" để xóa:`, cat);
        if (!action) return;
        if (action.toUpperCase() === 'XOA') {
            if (confirm(`Xóa danh mục "${cat}"? Các giao dịch cũ vẫn giữ nguyên tên này.`)) {
                const newCats = categories.filter(c => c !== cat);
                saveData(incomes, expenses, fixedTemplate, newCats);
            }
        } else {
            const newCats = categories.map(c => c === cat ? action : c);
            saveData(incomes, expenses, fixedTemplate, newCats);
        }
    };

    const handleAddCustomCategory = () => {
        const name = prompt("Nhập tên danh mục mới:");
        if (name && !categories.includes(name)) {
            const newCats = [...categories, name];
            saveData(incomes, expenses, fixedTemplate, newCats);
        }
    };

    const deleteItem = (id: number, type: 'income' | 'expense') => {
        if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;
        if (type === 'income') {
            saveData(incomes.filter(i => i.id !== id), expenses);
        } else {
            saveData(incomes, expenses.filter(e => e.id !== id));
        }
    };

    const handleExportExcel = () => {
        if (typeof XLSX === 'undefined') {
            alert("Thư viện Excel chưa được tải.");
            return;
        }
        const wb = XLSX.utils.book_new();
        const incData = filteredIncomes.map(i => ({ "Ngày": formatDate(i.date), "Nguồn": i.source, "Số tiền": i.amount, "Ghi chú": i.note }));
        const expData = filteredExpenses.map(e => ({ "Ngày": formatDate(e.date), "Danh mục": e.category, "Số tiền": e.amount, "Ghi chú": e.note }));
        
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incData), "Thu Nhập");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expData), "Chi Tiêu");
        XLSX.writeFile(wb, `BaoCao_TaiChinh_${viewDate.getMonth()+1}_${viewDate.getFullYear()}.xlsx`);
    };

    const handleBackup = () => {
        const data = { incomes, expenses, fixedTemplate, categories, debts, fixedTracking };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_finance_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (confirm('Khôi phục sẽ ghi đè dữ liệu hiện tại. Tiếp tục?')) {
                    saveData(
                        data.incomes || [],
                        data.expenses || [],
                        data.fixedTemplate || [],
                        data.categories || DEFAULT_CATEGORIES,
                        data.debts || [],
                        data.fixedTracking || {}
                    );
                }
            } catch (err) {
                alert('Lỗi định dạng file!');
            }
        };
        reader.readAsText(file);
        if (e.target) e.target.value = '';
    };

    return (
        <div className="min-h-screen pb-24 md:pb-0 relative font-sans overflow-x-hidden">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
                {isOverBudget && <div className="bg-red-50 text-red-600 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-pulse-red border-b border-red-100"><AlertTriangle size={16} /> CẢNH BÁO: Đã chi tiêu quá 90% thu nhập!</div>}
                
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
                        <div className="bg-green-500/20 backdrop-blur-sm p-4 rounded-2xl border border-green-500/30">
                            <div className="text-green-300 text-xs font-bold uppercase mb-1 flex items-center gap-1"><TrendingUp size={14}/> Tổng Thu Nhập</div>
                            <div className="font-bold text-lg">{formatCurrency(sumIncomeMonth)} đ</div>
                        </div>
                        <div className="bg-red-500/20 backdrop-blur-sm p-4 rounded-2xl border border-red-500/30">
                            <div className="text-red-300 text-xs font-bold uppercase mb-1 flex items-center gap-1"><TrendingDown size={14}/> Tổng Chi Tiêu</div>
                            <div className="font-bold text-lg">{formatCurrency(sumExpenseMonth)} đ</div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2">
                        {!isConnected ? (
                            <button onClick={()=>setShowCloudForm(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-white transition-all backdrop-blur-md btn-effect">
                                <CloudOff size={14}/> <span>Kết Nối Dữ Liệu</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-500/30 backdrop-blur-md">
                                <div className="text-[10px] text-blue-200">Mã Gia Đình: <span className="font-bold text-white">{familyCode}</span></div>
                                <button onClick={()=>{if(confirm('Ngắt kết nối?')){localStorage.removeItem('fb_config'); window.location.reload();}}} className="text-[10px] text-red-300 font-bold border-l border-white/10 pl-3">Ngắt</button>
                                {isSyncing && <div className="text-[10px] text-green-300 animate-pulse ml-2 font-bold">● Đang đồng bộ</div>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-4 -mt-6 relative z-10">
                    <div className="bg-white rounded-xl shadow-xl p-1.5 flex border border-gray-100 overflow-x-auto no-scrollbar">
                        {(['add', 'debt', 'report', 'savings', 'history', 'settings'] as TabType[]).map(tab => (
                            <button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-1 min-w-[60px] py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all btn-effect flex flex-col items-center gap-1 ${activeTab === tab ? 'bg-slate-800 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                                {tab === 'add' ? 'Nhập' : tab === 'debt' ? 'Sổ Nợ' : tab === 'report' ? 'Báo Cáo' : tab === 'savings' ? 'Heo Đất' : tab === 'history' ? 'Lịch Sử' : <SettingsIcon size={16}/>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 pb-32">
                    {activeTab === 'add' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            <div className="bg-white border border-green-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
                                <div className="flex items-center gap-2 text-green-700 font-bold mb-3"><TrendingUp size={18}/> 1. Thu Nhập</div>
                                <div className="space-y-3 pl-2">
                                    <input type="text" placeholder="Tên nguồn thu nhập" value={incomeSource} onChange={e=>setIncomeSource(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl font-medium input-effect"/>
                                    <div className="flex gap-3">
                                        <input type="text" inputMode="numeric" placeholder="Nhập số tiền" value={incomeAmount} onChange={e=>handleAmountInput(e.target.value, setIncomeAmount)} className="w-1/2 p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 text-lg input-effect"/>
                                        <CustomDatePicker value={incomeDate} onChange={e=>setIncomeDate(e.target.value)} className="flex-1" />
                                    </div>
                                    <button onClick={handleAddIncome} disabled={!incomeSource || !incomeAmount} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg btn-effect">Thêm Thu Nhập</button>
                                </div>
                            </div>
                            
                            <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-red-700 font-bold"><TrendingDown size={18}/> 2. Chi Tiêu</div>
                                    <button onClick={() => setIsCategoryManageMode(!isCategoryManageMode)} className="text-[10px] font-bold px-2 py-1 rounded border bg-gray-100 text-gray-500">{isCategoryManageMode ? 'Xong' : 'Sửa'}</button>
                                </div>
                                <div className="space-y-4 pl-2">
                                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                                        {categories.map(cat => (
                                            <button key={cat} onClick={() => isCategoryManageMode ? handleEditCategory(cat) : setExpenseCategory(cat)} className={`category-btn p-1 text-[10px] font-bold rounded-lg border transition-all ${expenseCategory === cat ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-600 border-gray-200'}`}>{cat}</button>
                                        ))}
                                        <button onClick={handleAddCustomCategory} className="category-btn p-1 text-[10px] font-bold rounded-lg border border-dashed border-gray-400 text-gray-500"><Plus size={16}/></button>
                                    </div>
                                    
                                    {expenseCategory === DEBT_CATEGORY_NAME && (
                                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl animate-fadeIn">
                                            <label className="text-[10px] font-bold text-blue-700 uppercase mb-1 block">Chọn người liên quan:</label>
                                            <select value={selectedDebtorId} onChange={(e) => setSelectedDebtorId(e.target.value)} className="w-full p-2 bg-white border border-blue-300 rounded-lg text-sm font-bold">
                                                <option value="">-- Chọn Sổ Nợ --</option>
                                                {debts.map(d => <option key={d.id} value={d.id}>{d.type === 'receivable' ? 'Nhận lại: ' : 'Trả: '}{d.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <input type="text" inputMode="numeric" placeholder="Số tiền..." value={expenseAmount} onChange={e=>handleAmountInput(e.target.value, setExpenseAmount)} className="w-1/2 p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 text-lg input-effect"/>
                                        <CustomDatePicker value={expenseDate} onChange={e=>setExpenseDate(e.target.value)} className="flex-1" />
                                    </div>
                                    <button onClick={handleAddExpense} disabled={!expenseCategory || !expenseAmount} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg btn-effect">Lưu Chi Tiêu</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'debt' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                             {!showDebtForm ? (
                                <>
                                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Users className="text-blue-600" size={20}/> Quản Lý Vay/Mượn</h3>
                                            <button onClick={() => { setShowDebtForm(true); setIsEditingDebt(null); setDebtName(''); setDebtTotal(''); setDebtPaid(''); }} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold btn-effect"><Plus size={14}/> Thêm mới</button>
                                        </div>
                                        <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
                                            <button onClick={()=>setActiveDebtTab('payable')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeDebtTab==='payable' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>Mình nợ</button>
                                            <button onClick={()=>setActiveDebtTab('receivable')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeDebtTab==='receivable' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Người ta nợ</button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {debts.filter(d => d.type === activeDebtTab).map(item => (
                                            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden">
                                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.total - item.paid <= 0 ? 'bg-green-500' : (activeDebtTab === 'payable' ? 'bg-orange-500' : 'bg-blue-500')}`}></div>
                                                <div className="pl-2">
                                                    <p className="font-bold text-gray-800">{item.name}</p>
                                                    <p className="text-[10px] text-gray-400 italic">{item.note}</p>
                                                    <div className="text-[10px] text-gray-500 mt-1">Còn: {formatCurrency(item.total - item.paid)} đ / Tổng: {formatCurrency(item.total)} đ</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={()=>{setIsEditingDebt(item.id); setDebtName(item.name); setDebtTotal(formatCurrency(item.total)); setDebtPaid(formatCurrency(item.paid)); setDebtNote(item.note||''); setDebtType(item.type); setShowDebtForm(true);}} className="text-blue-500 p-1"><Edit2 size={16}/></button>
                                                    <button onClick={()=>{if(confirm('Xóa?')) saveData(incomes, expenses, fixedTemplate, categories, debts.filter(d => d.id !== item.id));}} className="text-red-400 p-1"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                             ) : (
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fadeIn space-y-4">
                                    <div className="flex gap-2 mb-2">
                                        <button onClick={()=>setDebtType('payable')} className={`flex-1 py-2 text-xs font-bold rounded border ${debtType==='payable'?'bg-orange-100 text-orange-700 border-orange-300':'bg-white text-gray-500'}`}>Mình nợ</button>
                                        <button onClick={()=>setDebtType('receivable')} className={`flex-1 py-2 text-xs font-bold rounded border ${debtType==='receivable'?'bg-blue-100 text-blue-700 border-blue-300':'bg-white text-gray-500'}`}>Người ta nợ</button>
                                    </div>
                                    <input type="text" value={debtName} onChange={e=>setDebtName(e.target.value)} list="debt-suggestions" className="w-full p-3 bg-gray-50 border rounded-xl font-bold" placeholder="Tên người nợ / Khoản nợ..."/>
                                    <datalist id="debt-suggestions">{debts.map(d => <option key={d.id} value={d.name}/>)}</datalist>
                                    <div className="flex gap-2">
                                        <div className="flex-1"><label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Tổng nợ</label><input type="text" value={debtTotal} onChange={e=>handleAmountInput(e.target.value, setDebtTotal)} className="w-full p-2 border rounded-lg font-bold text-orange-600" /></div>
                                        <div className="flex-1"><label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Đã trả/thu</label><input type="text" value={debtPaid} onChange={e=>handleAmountInput(e.target.value, setDebtPaid)} className="w-full p-2 border rounded-lg font-bold text-blue-600" /></div>
                                    </div>
                                    <div className="flex items-center gap-2"><input type="checkbox" checked={autoCreateTransaction} onChange={e=>setAutoCreateTransaction(e.target.checked)} id="autoSync" className="w-4 h-4"/><label htmlFor="autoSync" className="text-xs text-gray-600">Tự động tạo giao dịch khi tiền thay đổi</label></div>
                                    <div className="flex gap-3"><button onClick={()=>setShowDebtForm(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs uppercase">Hủy</button><button onClick={handleSaveDebt} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg text-xs uppercase">Lưu & Đồng bộ</button></div>
                                </div>
                             )}
                        </div>
                    )}

                    {activeTab === 'report' && (
                        <div className="space-y-6 animate-fadeIn mt-2 text-center">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2"><PieChart size={20}/> Tỷ lệ chi tiêu</h3>
                                <div className="space-y-4 text-left">
                                    {Object.entries(filteredExpenses.reduce((a,c)=>{a[c.category]=(a[c.category]||0)+c.amount; return a;}, {} as any)).sort(([,a],[,b]) => (b as number)-(a as number)).map(([cat, amt]) => {
                                        const pct = sumIncomeMonth > 0 ? Math.round(((amt as number)/sumIncomeMonth)*100) : 0;
                                        return (
                                            <div key={cat}>
                                                <div className="flex justify-between text-xs font-bold mb-1"><span>{cat}</span><span>{formatCurrency(amt as number)} đ</span></div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div className="bg-red-500 h-full rounded-full" style={{width: `${Math.min(pct,100)}%`}}></div></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-fadeIn mt-2 space-y-3">
                            <div className="bg-white p-4 rounded-xl shadow-sm flex gap-2"><Search size={18} className="text-gray-400 mt-2"/><input type="text" placeholder="Tìm kiếm giao dịch..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="flex-1 p-2 outline-none text-sm"/></div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {[...filteredIncomes.map(i=>({...i,type:'income'})), ...filteredExpenses.map(e=>({...e,type:'expense'}))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                                    <div key={item.id} className="p-4 flex justify-between items-center border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type==='income'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{item.type==='income'?<TrendingUp size={18}/>:<TrendingDown size={18}/>}</div>
                                            <div><p className="font-bold text-gray-800 text-sm">{(item as any).source || (item as any).category}</p><p className="text-[10px] text-gray-400 italic">"{item.note||''}" - {formatDate(item.date)}</p></div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-sm ${item.type==='income'?'text-green-600':'text-red-600'}`}>{item.type==='income'?'+':'-'}{formatCurrency(item.amount)} đ</p>
                                            <button onClick={()=>deleteItem(item.id, item.type as any)} className="text-[10px] text-gray-300 font-bold hover:text-red-500">XÓA</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><SettingsIcon size={20}/> Cài đặt</h3>
                                <button onClick={()=>setShowFixedConfig(true)} className="w-full p-4 bg-purple-50 text-purple-700 rounded-xl font-bold flex justify-between items-center">Quản lý mục cố định <Clock size={18}/></button>
                                <button onClick={handleExportExcel} className="w-full p-4 bg-green-50 text-green-700 rounded-xl font-bold flex justify-between items-center">Xuất báo cáo Excel <FileSpreadsheet size={18}/></button>
                                <button onClick={handleBackup} className="w-full p-4 bg-blue-50 text-blue-700 rounded-xl font-bold flex justify-between items-center">Sao lưu dữ liệu <Download size={18}/></button>
                                <label className="w-full p-4 bg-slate-50 text-slate-700 rounded-xl font-bold flex justify-between items-center cursor-pointer">Khôi phục từ file <Upload size={18}/><input type="file" className="hidden" onChange={handleRestore} accept=".json"/></label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Floating Bottom Navigation */}
                <div onClick={()=>setShowFixedTrackingModal(true)} className="fixed bottom-8 left-4 z-50 flex flex-col items-center gap-1 cursor-pointer group">
                    <div className="bg-purple-600 shadow-xl rounded-full p-4 border-2 border-white transform group-hover:scale-110 transition-all btn-effect text-white">
                        <MessageCircle size={24}/>
                    </div>
                </div>

                <div onClick={()=>setShowReloadConfirm(true)} className={`fixed bottom-8 right-4 z-50 flex flex-col items-center gap-1 cursor-pointer transition-all duration-300`}>
                    <div className={`shadow-2xl rounded-full px-5 py-3 flex items-center gap-3 border-2 border-white transform hover:scale-105 btn-effect transition-all ${balance>=0?'bg-gradient-to-r from-blue-600 to-cyan-500':'bg-gradient-to-r from-red-600 to-orange-500'}`}>
                        <div className="bg-white/20 p-1.5 rounded-full"><Wallet size={20} className="text-white"/></div>
                        <div className="flex flex-col items-start text-white font-extrabold text-lg leading-none">{formatCurrency(balance)} đ</div>
                    </div>
                </div>

                {/* Fixed Tracking Modal from Original */}
                {showFixedTrackingModal && (
                    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl animate-fadeIn">
                            <div className="p-4 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
                                <h3 className="font-bold text-purple-800 flex items-center gap-2">Chi cố định tháng {viewDate.getMonth() + 1}</h3>
                                <button onClick={()=>setShowFixedTrackingModal(false)}><X size={20} className="text-purple-400"/></button>
                            </div>
                            <div className="p-4 overflow-y-auto flex-1 space-y-4">
                                {fixedTemplate.map(item => {
                                    const paidSoFar = getMonthlyPaidForCategory(item.category); const remaining = item.amount - paidSoFar; const isFullyPaid = remaining <= 0;
                                    const inputValue = fixedPaymentInputs[item.category] || (remaining > 0 ? formatCurrency(remaining) : '');
                                    return (
                                        <div key={item.category} className={`border-b border-gray-100 pb-3 ${isFullyPaid ? 'opacity-50' : ''}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <div><span className="text-sm font-bold text-gray-800 block">{item.category}</span><span className="text-[10px] text-gray-400 italic">Kế hoạch: {formatCurrency(item.amount)}</span></div>
                                                <div className="text-right"><span className={`text-xs font-bold block ${isFullyPaid ? 'text-green-600' : 'text-orange-500'}`}>{isFullyPaid ? 'Đã xong' : `Còn: ${formatCurrency(remaining)}`}</span></div>
                                            </div>
                                            {!isFullyPaid && (
                                                <div className="flex gap-2 mt-2">
                                                    <input type="text" inputMode="numeric" value={inputValue} onChange={(e) => handleAmountInput(e.target.value, (v)=>setFixedPaymentInputs(p=>({...p, [item.category]: v})))} className="flex-1 p-2 bg-gray-50 border rounded text-xs font-bold" placeholder="Số tiền..." />
                                                    <button onClick={() => handleConfirmFixedItem(item, parseAmount(inputValue))} className="px-4 py-2 bg-purple-600 text-white text-[10px] font-bold rounded shadow-md uppercase btn-effect">Trả</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Fixed Config Modal */}
                {showFixedConfig && (
                    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
                            <button onClick={()=>setShowFixedConfig(false)} className="absolute top-4 right-4 p-2 text-gray-400"><X size={20}/></button>
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">Mục cố định mẫu</h3>
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                                {categories.map(cat => (
                                    <div key={cat} className="flex items-center gap-2">
                                        <span className="flex-1 text-xs font-bold text-gray-600">{cat}</span>
                                        <input type="text" inputMode="numeric" value={tempFixedList[cat] ? formatCurrency(tempFixedList[cat]) : ''} onChange={(e) => handleAmountInput(e.target.value, (v)=>setTempFixedList(p=>({...p, [cat]: parseAmount(v)})))} className="w-24 p-2 bg-gray-50 border rounded text-xs font-bold text-right" placeholder="0"/>
                                    </div>
                                ))}
                            </div>
                            <button onClick={()=>{saveData(incomes, expenses, Object.entries(tempFixedList).filter(([,a])=>(a as number)>0).map(([c,a])=>({category:c, amount:a as number}))); setShowFixedConfig(false);}} className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl mt-6 uppercase text-xs">Lưu cấu hình</button>
                        </div>
                    </div>
                )}

                {/* Cloud Config Modal */}
                {showCloudForm && (
                    <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-fadeIn text-left">
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Cloud size={18}/> Đồng bộ Đám mây</h3><button onClick={()=>setShowCloudForm(false)}><X size={20}/></button></div>
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Mã Gia Đình</label><input type="text" value={familyCode} onChange={e=>setFamilyCode(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-sm outline-none" placeholder="GD-XXXXXX" /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cấu hình Firebase (JSON)</label><textarea value={firebaseConfigStr} onChange={e=>setFirebaseConfigStr(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-[10px] h-24 outline-none resize-none font-mono"></textarea></div>
                                <button onClick={()=>{localStorage.setItem('fb_config', firebaseConfigStr); localStorage.setItem('fb_family_code', familyCode); window.location.reload();}} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg uppercase text-xs btn-effect">Lưu & Kết nối</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;

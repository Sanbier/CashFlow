
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
    const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('fb_remember') === 'true');
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

    // Effect khởi tạo dữ liệu và tự động kết nối
    useEffect(() => {
        const initData = () => {
            const localIncomes = JSON.parse(localStorage.getItem('family_incomes') || '[]');
            const localExpenses = JSON.parse(localStorage.getItem('family_expenses') || '[]');
            const localFixed = JSON.parse(localStorage.getItem('family_fixed_template') || '[]');
            const localFixedTracking = JSON.parse(localStorage.getItem('family_fixed_tracking') || '{}');
            
            let localCats = JSON.parse(localStorage.getItem('family_categories') || 'null');
            if (!localCats) {
                const oldCustom = JSON.parse(localStorage.getItem('family_custom_categories') || '[]');
                localCats = Array.from(new Set([...DEFAULT_CATEGORIES, ...oldCustom]));
            }

            const localDebts = JSON.parse(localStorage.getItem('family_debts') || '[]');
            const migratedDebts = localDebts.map((d: any) => ({...d, type: d.type || 'payable'}));

            setIncomes(localIncomes);
            setExpenses(localExpenses);
            setFixedTemplate(localFixed);
            setCategories(localCats);
            setDebts(migratedDebts);
            setFixedTracking(localFixedTracking);
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
                        if (data.categories && Array.isArray(data.categories)) {
                            setCategories(data.categories);
                        } else {
                            const oldCustom = data.customCategories || [];
                            const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...oldCustom]));
                            setCategories(merged);
                        }
                        const loadedDebts = data.debts || [];
                        const migratedDebts = loadedDebts.map((d: any) => ({...d, type: d.type || 'payable'}));
                        setDebts(migratedDebts);
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
                }, (error: any) => { 
                    console.error("Firebase error:", error); 
                    setIsConnected(false); 
                    initData();
                });
                return () => unsubscribe();
            } catch (e) { 
                console.error("Config error:", e); 
                setIsConnected(false); 
                initData(); 
            }
        } else {
            initData();
        }
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
            })
            .then(() => setIsSyncing(false)).catch(() => setIsSyncing(false));
        }
    };

    const handleSaveConfig = () => { 
        try { 
          JSON.parse(firebaseConfigStr); 
          if (!familyCode.trim()) throw new Error("Chưa nhập Mã Gia Đình"); 
          
          if (rememberMe) {
            localStorage.setItem('fb_config', firebaseConfigStr); 
            localStorage.setItem('fb_family_code', familyCode); 
            localStorage.setItem('fb_remember', 'true');
          } else {
            localStorage.removeItem('fb_config');
            localStorage.removeItem('fb_family_code');
            localStorage.setItem('fb_remember', 'false');
          }
          
          alert("Cấu hình hợp lệ! Đang kết nối..."); 
          setShowCloudForm(false);
          // Trang web sẽ tự động kết nối qua useEffect khi config state thay đổi
        } catch (e: any) { 
          alert("Lỗi cấu hình! " + e.message); 
        } 
    };

    const handleDisconnect = () => { 
        if(confirm('Đăng xuất và xóa thông tin kết nối?')) { 
            localStorage.removeItem('fb_config'); 
            localStorage.removeItem('fb_family_code'); 
            localStorage.removeItem('fb_remember');
            window.location.reload(); 
        }
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);
    const formatDate = (date: string) => { if(!date) return ''; const d = new Date(date); return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`; };
    const formatTime = (date: string) => { if(!date) return ''; const d = new Date(date); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; };
    const getFiscalRange = (date: Date) => { const year = date.getFullYear(), month = date.getMonth(); const startDate = new Date(year, month, 1); startDate.setHours(0,0,0,0); const endDate = new Date(year, month + 1, 0); endDate.setHours(23,59,59,999); return { startDate, endDate }; };
    
    const { startDate, endDate } = useMemo(() => getFiscalRange(viewDate), [viewDate]);
    const availableFilterCategories = useMemo(() => { const historyCategories = expenses.map(e => e.category); return Array.from(new Set([...categories, ...historyCategories])).sort(); }, [expenses, categories]);
    
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

    // Added useMemo for robust monthly income and expense calculation
    const sumIncomeMonth: number = useMemo(() => (incomes || []).filter(i => { const d = new Date(i.date); return d >= startDate && d <= endDate; }).reduce((a: number, c: Income) => a + c.amount, 0), [incomes, startDate, endDate]);
    const sumExpenseMonth: number = useMemo(() => (expenses || []).filter(i => { const d = new Date(i.date); return d >= startDate && d <= endDate; }).reduce((a: number, c: Expense) => a + c.amount, 0), [expenses, startDate, endDate]);
    const balance: number = sumIncomeMonth - sumExpenseMonth;
    const isOverBudget: boolean = sumIncomeMonth > 0 && (sumExpenseMonth / sumIncomeMonth) > 0.9;

    const handleAmountInput = (val: string, setter: (v: string) => void) => { const raw = val.replace(/\D/g,''); setter(raw === '' ? '' : Number(raw).toLocaleString('vi-VN')); };
    const parseAmount = (val: string) => val ? parseInt(val.replace(/\./g,''), 10) : 0;
    const getCombinedDate = (dateInput: string) => {
        const datePart = new Date(dateInput);
        const now = new Date();
        datePart.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        return datePart.toISOString();
    };

    const handleAddIncome = () => { 
        const amt = parseAmount(incomeAmount); 
        if(!incomeSource || amt <= 0) return; 
        const newItem: Income = { id: editingId || Date.now(), source: incomeSource, amount: amt, date: getCombinedDate(incomeDate), note: incomeNote }; 
        const newIncomes = editingId && editingType === 'income' ? incomes.map(i => i.id === editingId ? newItem : i) : [newItem, ...incomes]; 
        saveData(newIncomes, expenses, fixedTemplate, categories, debts); 
        if(editingId) alert('Đã cập nhật!'); 
        resetForm(); 
    };

    const handleAddExpense = () => { 
        const amt = parseAmount(expenseAmount); 
        if(!expenseCategory || amt <= 0) return; 
        let updatedDebts = debts;
        let finalNote = expenseNote;
        let linkedDebtId: number | null = null;
        let actionType: 'repay' | 'lend' | null = null;
        if (expenseCategory === DEBT_CATEGORY_NAME) {
            if (!selectedDebtorId) { alert("Vui lòng chọn người liên quan!"); return; }
            const debtItem = debts.find(d => d.id === Number(selectedDebtorId));
            if (debtItem) {
                linkedDebtId = debtItem.id;
                if (debtItem.type === 'receivable') {
                    const newPaid = debtItem.paid + amt;
                    updatedDebts = debts.map(d => d.id === debtItem.id ? { ...d, paid: newPaid, updatedAt: new Date().toISOString() } : d);
                    const newItem: Income = { id: editingId || Date.now(), source: `Thu nợ: ${debtItem.name}`, amount: amt, date: getCombinedDate(expenseDate), note: `Nhận lại nợ: ${debtItem.name} ${expenseNote ? '- ' + expenseNote : ''}`, relatedDebtId: linkedDebtId, debtAction: 'collect' }; 
                    const newIncomes = [newItem, ...incomes];
                    saveData(newIncomes, expenses, fixedTemplate, categories, updatedDebts);
                    alert(`Đã ghi nhận thu nhập từ thu nợ và cập nhật sổ!`);
                    resetForm();
                    return;
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
        saveData(incomes, newExpenses, fixedTemplate, categories, updatedDebts); 
        if(editingId) alert('Đã cập nhật!'); 
        resetForm(); 
    };

    const resetForm = () => { setIncomeSource(''); setIncomeAmount(''); setIncomeNote(''); setEditingId(null); setEditingType(null); setExpenseCategory(''); setExpenseAmount(''); setExpenseNote(''); setSelectedDebtorId(''); };
    const handleEdit = (item: any, type: 'income' | 'expense') => { setEditingId(item.id); setEditingType(type); setActiveTab('add'); if (type === 'income') { setIncomeSource(item.source); setIncomeAmount(Number(item.amount).toLocaleString('vi-VN')); setIncomeDate(item.date.split('T')[0]); setIncomeNote(item.note || ''); } else { setExpenseCategory(item.category); setExpenseAmount(Number(item.amount).toLocaleString('vi-VN')); setExpenseDate(item.date.split('T')[0]); setExpenseNote(item.note || ''); } };
    const deleteItem = (id: number, type: 'income' | 'expense') => { if(confirm('Bạn có chắc muốn xóa?')) { const newIncomes = type === 'income' ? incomes.filter(i => i.id !== id) : incomes; const newExpenses = type === 'expense' ? expenses.filter(e => e.id !== id) : expenses; saveData(newIncomes, newExpenses, fixedTemplate, categories, debts); } };
    const handleAddCustomCategory = () => { const newCat = prompt("Nhập tên mục chi tiêu mới:"); if (newCat && newCat.trim()) { if (categories.includes(newCat.trim())) { alert("Mục này đã tồn tại!"); return; } saveData(incomes, expenses, fixedTemplate, [...categories, newCat.trim()], debts); } };
    const handleEditCategory = (oldCat: string) => { const newCat = prompt("Sửa tên mục chi tiêu:", oldCat); if (newCat && newCat.trim() && newCat !== oldCat) { const trimmedNew = newCat.trim(); if (categories.includes(trimmedNew)) { alert("Tên mục bị trùng!"); return; } saveData(incomes, expenses, fixedTemplate, categories.map(c => c === oldCat ? trimmedNew : c), debts); } };
    const handleDeleteCategory = (catToDelete: string) => { if(confirm(`Xóa mục "${catToDelete}"?`)) { saveData(incomes, expenses, fixedTemplate, categories.filter(c => c !== catToDelete), debts); } };

    const handleSaveDebt = () => {
        const total = parseAmount(debtTotal);
        const paid = parseAmount(debtPaid);
        if (!debtName || total <= 0) { alert("Vui lòng nhập tên và số tiền hợp lệ."); return; }
        const newItem: Debt = { id: isEditingDebt || Date.now(), name: debtName, total: total, paid: paid, note: debtNote, type: debtType, updatedAt: new Date().toISOString() };
        const newDebts = isEditingDebt ? debts.map(d => d.id === isEditingDebt ? newItem : d) : [newItem, ...debts];
        saveData(incomes, expenses, fixedTemplate, categories, newDebts);
        setShowDebtForm(false); setIsEditingDebt(null); setDebtName(''); setDebtTotal(''); setDebtPaid(''); setDebtNote('');
    };

    const handleDeleteDebt = (id: number) => {
        if (confirm('Xóa khoản nợ này?')) {
            const newDebts = debts.filter(d => d.id !== id);
            saveData(incomes, expenses, fixedTemplate, categories, newDebts);
        }
    };

    const handleExportExcel = () => { const data = [...incomes.map(i => ({ Loại: 'Thu', Mục: i.source, 'Số tiền': i.amount, Ngày: formatDate(i.date) })), ...expenses.map(e => ({ Loại: 'Chi', Mục: e.category, 'Số tiền': e.amount, Ngày: formatDate(e.date) }))]; const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "ThuChi"); XLSX.writeFile(wb, `Sothuchi_${new Date().toISOString().slice(0,10)}.xlsx`); };
    const handleBackup = () => { const data = { incomes, expenses, fixedTemplate, categories, debts, fixedTracking }; const blob = new Blob([JSON.stringify(data)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Sothuchi_Backup.json`; a.click(); };
    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event: any) => { try { const data = JSON.parse(event.target.result); if (data.incomes && data.expenses) { saveData(data.incomes, data.expenses, data.fixedTemplate || [], data.categories || DEFAULT_CATEGORIES, data.debts || [], data.fixedTracking || {}); alert('Thành công!'); } } catch (err) { alert('Lỗi file!'); } }; reader.readAsText(file); };

    // Fix Error: Operator '+' cannot be applied to types 'unknown' and 'unknown' by properly memoizing the reduction of expense amounts
    const totalSavings = useMemo(() => expenses.reduce((a: number, e: Expense) => SAVING_CATEGORIES.includes(e.category) ? a + e.amount : a, 0), [expenses]);

    return (
        <div className="min-h-screen pb-24 md:pb-0 relative font-sans overflow-x-hidden">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
                {isOverBudget && <div className="bg-red-50 text-red-600 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-pulse-red border-b border-red-100"><AlertTriangle size={16} /> CẢNH BÁO: Đã chi tiêu quá 90% thu nhập!</div>}
                
                <div className={`bg-gradient-to-r ${isConnected ? 'from-blue-800 to-indigo-900' : 'from-slate-700 to-gray-800'} p-6 pb-6 text-white rounded-b-3xl shadow-lg transition-colors duration-500 relative`}>
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={()=>setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 15))} className="p-2 text-white/70 hover:text-white btn-effect transition-all"><ChevronLeft size={24}/></button>
                        <div className="text-center">
                            <span className="text-[10px] font-medium text-white/60 block mb-0.5 tracking-wider">{formatDate(startDate.toISOString())} - {formatDate(endDate.toISOString())}</span>
                            <div className="font-bold text-xl text-white flex items-center gap-2 justify-center uppercase tracking-wide"><CalendarIcon size={18} className="text-blue-200"/> Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}</div>
                        </div>
                        <button onClick={()=>setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 15))} className="p-2 text-white/70 hover:text-white btn-effect transition-all"><ChevronRight size={24}/></button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-green-500/20 backdrop-blur-sm p-4 rounded-2xl border border-green-500/30"><div className="flex items-center gap-1.5 text-green-300 text-xs font-bold uppercase mb-1"><TrendingUp size={14}/> Tổng thu</div><div className="font-bold text-lg text-green-50">{formatCurrency(sumIncomeMonth)} đ</div></div>
                        <div className="bg-red-500/20 backdrop-blur-sm p-4 rounded-2xl border border-red-500/30"><div className="flex items-center gap-1.5 text-red-300 text-xs font-bold uppercase mb-1"><TrendingDown size={14}/> Tổng chi</div><div className="font-bold text-lg text-red-50">{formatCurrency(sumExpenseMonth)} đ</div></div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        {!isConnected ? (
                            <button onClick={()=>setShowCloudForm(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-white transition-all backdrop-blur-md btn-effect">
                                <CloudOff size={14}/> <span>Kết nối Đám mây</span>
                            </button>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-500/30 backdrop-blur-md">
                                    <div className="text-[10px] text-blue-200">Gia đình: <span className="font-bold text-white">{familyCode}</span></div>
                                    <button onClick={handleDisconnect} className="text-[10px] text-red-300 hover:text-red-100 font-bold border-l border-white/10 pl-3 transition-colors">Đăng xuất</button>
                                </div>
                                {isSyncing && (
                                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm animate-fadeIn">
                                        <div className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </div>
                                        <span className="text-[10px] font-bold text-green-100">Đang đồng bộ</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {showCloudForm && (
                    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
                            <button onClick={()=>setShowCloudForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"><X size={20}/></button>
                            
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Cloud size={24}/>
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg">Thiết lập Đồng bộ</h3>
                                <p className="text-xs text-gray-500 mt-1">Kết nối dữ liệu gia đình qua Firebase</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Mã Gia Đình</label>
                                    <input 
                                        type="text" 
                                        value={familyCode} 
                                        onChange={e=>setFamilyCode(e.target.value)} 
                                        className="w-full p-3 rounded-xl text-sm bg-gray-50 text-gray-800 border border-gray-100 outline-none focus:border-blue-400 focus:bg-white transition-all" 
                                        placeholder="Ví dụ: GD-HN-2024" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Cấu hình Firebase (JSON)</label>
                                    <textarea 
                                        value={firebaseConfigStr} 
                                        onChange={e=>setFirebaseConfigStr(e.target.value)} 
                                        className="w-full p-3 rounded-xl text-[10px] h-24 bg-gray-50 text-gray-700 border border-gray-100 font-mono outline-none focus:border-blue-400 focus:bg-white transition-all resize-none" 
                                        placeholder='{"apiKey": "AIza...", "projectId": "...", ...}'
                                    ></textarea>
                                </div>
                                
                                <div className="flex items-center gap-2 py-1">
                                    <input 
                                        type="checkbox" 
                                        id="remember-sync" 
                                        checked={rememberMe} 
                                        onChange={e => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded text-blue-600"
                                    />
                                    <label htmlFor="remember-sync" className="text-xs font-medium text-gray-600 cursor-pointer">Ghi nhớ thông tin đăng nhập</label>
                                </div>

                                <button onClick={handleSaveConfig} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 mt-2 btn-effect transition-all uppercase tracking-widest text-xs">
                                    Lưu & Kết nối ngay
                                </button>
                                
                                <p className="text-[10px] text-center text-gray-400 italic">Dữ liệu sẽ được tự động đồng bộ khi có thay đổi.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-4 -mt-6 relative z-10">
                    <div className="bg-white rounded-xl shadow-xl p-1.5 flex border border-gray-100 overflow-x-auto no-scrollbar">
                        {(['add', 'debt', 'report', 'savings', 'history', 'settings'] as TabType[]).map(tab => (
                            <button key={tab} onClick={()=>{setActiveTab(tab); resetForm();}} className={`flex-1 min-w-[60px] py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all btn-effect flex justify-center flex-col items-center gap-1 ${activeTab === tab ? 'bg-slate-800 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
                                {tab === 'add' ? 'Nhập' : tab === 'debt' ? 'Sổ Nợ' : tab === 'report' ? 'Báo Cáo' : tab === 'savings' ? 'Heo Đất' : tab === 'history' ? 'Lịch Sử' : <SettingsIcon size={16}/>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 pb-32 safe-pb">
                    {activeTab === 'add' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            <div className="bg-white border border-green-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div><div className="flex items-center gap-2 text-green-700 font-bold mb-3"><TrendingUp size={18}/> 1. Thu Nhập</div>
                                <div className="space-y-3 pl-2">
                                    <input type="text" placeholder="Nguồn thu (Lương, thưởng...)" value={incomeSource} onChange={e=>setIncomeSource(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl font-medium input-effect transition-all duration-200"/>
                                    <div className="flex gap-3">
                                        <input type="text" inputMode="numeric" placeholder="Số tiền" value={incomeAmount} onChange={e=>handleAmountInput(e.target.value, setIncomeAmount)} className="w-1/2 p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 text-lg h-12 input-effect transition-all duration-200"/>
                                        <CustomDatePicker value={incomeDate} onChange={e=>setIncomeDate(e.target.value)} className="flex-1" />
                                    </div>
                                    <button onClick={handleAddIncome} disabled={!incomeSource || !incomeAmount} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 btn-effect">Thêm thu nhập</button>
                                </div>
                            </div>
                            
                            <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-red-700 font-bold"><TrendingDown size={18}/> 2. Chi Tiêu</div>
                                    <button onClick={() => setIsCategoryManageMode(!isCategoryManageMode)} className="text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1 bg-gray-100 text-gray-500">{isCategoryManageMode ? 'Xong' : 'Sửa'}</button>
                                </div>
                                <div className="space-y-4 pl-2">
                                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                                        {categories.map(cat => (
                                            <button key={cat} onClick={() => isCategoryManageMode ? handleEditCategory(cat) : setExpenseCategory(cat)} className={`category-btn p-1 text-[10px] font-bold rounded-lg border transition-all ${expenseCategory === cat ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200'}`}>{cat}</button>
                                        ))}
                                        <button onClick={handleAddCustomCategory} className="category-btn p-1 text-[10px] font-bold rounded-lg border border-dashed border-gray-400 text-gray-500 flex items-center justify-center"><Plus size={16}/></button>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <input type="text" inputMode="numeric" placeholder="Số tiền" value={expenseAmount} onChange={e=>handleAmountInput(e.target.value, setExpenseAmount)} className="w-1/2 p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 text-lg h-12 input-effect transition-all duration-200"/>
                                        <CustomDatePicker value={expenseDate} onChange={e=>setExpenseDate(e.target.value)} className="flex-1" />
                                    </div>
                                    <button onClick={handleAddExpense} disabled={!expenseCategory || !expenseAmount} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 btn-effect transition-all duration-200">Lưu Chi Tiêu</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'debt' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Users className="text-blue-600" size={20}/> Quản Lý Vay/Mượn</h3>
                                    <button onClick={() => setShowDebtForm(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1 btn-effect"><Plus size={14}/> Thêm mới</button>
                                </div>
                                <p className="text-xs text-gray-400 italic">Theo dõi chi tiết các khoản nợ phải trả và phải thu.</p>
                            </div>
                            
                            {showDebtForm && (
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fadeIn space-y-4">
                                    <input type="text" placeholder="Tên người nợ / Chủ nợ" value={debtName} onChange={e=>setDebtName(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-gray-700"/>
                                    <div className="flex gap-2">
                                        <button onClick={()=>setDebtType('payable')} className={`flex-1 py-2 text-xs font-bold rounded border ${debtType==='payable'?'bg-orange-100 text-orange-700 border-orange-300':'bg-white text-gray-500'}`}>Mình nợ</button>
                                        <button onClick={()=>setDebtType('receivable')} className={`flex-1 py-2 text-xs font-bold rounded border ${debtType==='receivable'?'bg-blue-100 text-blue-700 border-blue-300':'bg-white text-gray-500'}`}>Họ nợ</button>
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" inputMode="numeric" placeholder="Tổng tiền" value={debtTotal} onChange={e=>handleAmountInput(e.target.value, setDebtTotal)} className="flex-1 p-3 bg-gray-50 border rounded-xl font-bold text-gray-700"/>
                                        <input type="text" inputMode="numeric" placeholder="Đã trả/thu" value={debtPaid} onChange={e=>handleAmountInput(e.target.value, setDebtPaid)} className="flex-1 p-3 bg-gray-50 border rounded-xl font-bold text-gray-700"/>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={()=>setShowDebtForm(false)} className="flex-1 py-3 bg-gray-200 text-gray-600 font-bold rounded-xl text-sm btn-effect">Hủy</button>
                                        <button onClick={handleSaveDebt} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg text-sm btn-effect">Lưu Sổ Nợ</button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {debts.map(d => (
                                    <div key={d.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center relative overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${d.type === 'payable' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                        <div className="pl-2">
                                            <p className="font-bold text-gray-800">{d.name}</p>
                                            <p className="text-[10px] text-gray-400">Còn lại: {formatCurrency(d.total - d.paid)} đ</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm text-gray-600">{formatCurrency(d.total)} đ</p>
                                            <button onClick={()=>handleDeleteDebt(d.id)} className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase mt-1">Xóa</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'report' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2"><PieChart className="text-slate-600" size={20}/> Tỷ lệ chi tiêu</h3>
                                {filteredExpenses.length === 0 ? <div className="text-center py-10 text-gray-400 text-sm">Chưa có dữ liệu.</div> : 
                                    <div className="space-y-5">
                                        {Object.entries(filteredExpenses.reduce((a: Record<string, number>, c: Expense) => {
                                            a[c.category] = (a[c.category] || 0) + c.amount;
                                            return a;
                                        }, {} as Record<string, number>))
                                        .sort((a, b) => (b[1] as number) - (a[1] as number))
                                        .map(([cat, amt]) => {
                                            const amountVal = amt as number;
                                            const pct = sumIncomeMonth > 0 ? Math.round((amountVal / sumIncomeMonth) * 100) : 0;
                                            return (
                                                <div key={cat} className="group">
                                                    <div className="flex justify-between text-sm mb-1.5">
                                                        <span className="font-bold text-gray-700">{cat}</span>
                                                        <span className="text-gray-900 font-bold">{formatCurrency(amountVal)} đ</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                        <div className="bg-red-500 h-full rounded-full transition-all duration-1000" style={{width: `${Math.min(pct,100)}%`}}></div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                }
                            </div>
                        </div>
                    )}

                    {activeTab === 'savings' && (
                        <div className="space-y-6 animate-fadeIn mt-2 text-center">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 mx-auto mb-4"><PiggyBank size={32}/></div>
                                <h3 className="text-sm text-gray-500 font-bold uppercase tracking-wider">Tổng Quỹ Tích Lũy</h3>
                                <p className="text-4xl font-extrabold text-gray-800 mt-2">{formatCurrency(totalSavings)} đ</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-fadeIn mt-2 space-y-3">
                            <div className="bg-white p-4 rounded-xl shadow-sm flex gap-2">
                                <Search size={18} className="text-gray-400 mt-2"/>
                                <input type="text" placeholder="Tìm kiếm giao dịch..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="flex-1 p-2 outline-none text-sm"/>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {([...filteredIncomes.map(i=>({...i,type:'income'})), ...filteredExpenses.map(e=>({...e,type:'expense'}))] as any[])
                                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((item, idx) => (
                                    <div key={item.id} className={`p-4 flex justify-between items-center hover:bg-gray-50 ${idx!==0?'border-t border-gray-50':''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type==='income'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{item.type==='income' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}</div>
                                            <div><p className="font-bold text-gray-800 text-sm">{item.type==='income' ? item.source : item.category}</p><p className="text-[10px] text-gray-400">{formatDate(item.date)}</p></div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-sm ${item.type==='income'?'text-green-600':'text-red-600'}`}>{item.type==='income'?'+':'-'}{formatCurrency(item.amount)} đ</p>
                                            <button onClick={()=>deleteItem(item.id, item.type)} className="text-[10px] text-gray-400 hover:text-red-500 font-bold mt-1">XÓA</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2"><SettingsIcon size={20}/> Hệ thống</h3>
                                <div className="space-y-3">
                                    <button onClick={handleExportExcel} className="w-full p-4 bg-green-50 text-green-700 rounded-xl font-bold flex items-center justify-between">Xuất Excel <FileSpreadsheet size={18}/></button>
                                    <button onClick={handleBackup} className="w-full p-4 bg-blue-50 text-blue-700 rounded-xl font-bold flex items-center justify-between">Sao lưu JSON <Download size={18}/></button>
                                    <label className="w-full p-4 bg-purple-50 text-purple-700 rounded-xl font-bold flex items-center justify-between cursor-pointer">Khôi phục JSON <Upload size={18}/><input type="file" className="hidden" onChange={handleRestore} accept=".json"/></label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div onClick={()=>setShowReloadConfirm(true)} className={`fixed bottom-8 right-4 z-50 flex flex-col items-center gap-1 cursor-pointer transition-all duration-300`}>
                    <div className={`shadow-2xl rounded-full px-5 py-3 flex items-center gap-3 border-2 border-white transform hover:scale-105 btn-effect transition-all ${balance>=0?'bg-gradient-to-r from-blue-600 to-cyan-500':'bg-gradient-to-r from-red-600 to-orange-500'}`}>
                        <div className="bg-white/20 p-1.5 rounded-full"><Wallet size={20} className="text-white"/></div>
                        {/* Fix Error: Argument of type 'unknown' is not assignable to parameter of type 'number' by explicitly casting balance */}
                        <div className="flex flex-col items-start"><span className="text-white font-extrabold text-lg leading-none">{formatCurrency(balance as number)} đ</span></div>
                    </div>
                </div>

                {showReloadConfirm && (
                    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs w-full text-center border border-gray-100">
                            <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600"><RefreshCw size={24} /></div>
                            <h3 className="font-bold text-lg text-slate-800 mb-2">Làm mới ứng dụng?</h3>
                            <div className="flex gap-3 mt-6"><button onClick={()=>setShowReloadConfirm(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl btn-effect">Hủy</button><button onClick={()=>window.location.reload()} className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl shadow-lg btn-effect">Làm mới</button></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;

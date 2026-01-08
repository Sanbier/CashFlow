
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

    // Initial Data Loading & Persistence Logic
    useEffect(() => {
        // Function to load from local and set states
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

        const { incomes: localI, expenses: localE, fixedTemplate: localFT, categories: localC, debts: localD, fixedTracking: localTr } = loadLocal();

        if (firebaseConfigStr && familyCode) {
            try {
                const config = JSON.parse(firebaseConfigStr);
                if (!firebase.apps.length) firebase.initializeApp(config);
                const db = firebase.firestore();
                dbRef.current = db;
                setIsConnected(true);
                setIsSyncing(true);

                const unsubscribe = db.collection('families').doc(familyCode).onSnapshot((doc: any) => {
                    if (doc.exists) { 
                        const data = doc.data(); 
                        const cloudIncomes = data.incomes || [];
                        const cloudExpenses = data.expenses || [];
                        const cloudFixed = data.fixedTemplate || [];
                        const cloudCategories = data.categories || DEFAULT_CATEGORIES;
                        const cloudDebts = data.debts || [];
                        const cloudTracking = data.fixedTracking || {};

                        // Update states
                        setIncomes(cloudIncomes); 
                        setExpenses(cloudExpenses); 
                        setFixedTemplate(cloudFixed); 
                        setCategories(cloudCategories); 
                        setDebts(cloudDebts); 
                        setFixedTracking(cloudTracking);

                        // CRITICAL: Update LocalStorage to keep offline data in sync with cloud data
                        localStorage.setItem('family_incomes', JSON.stringify(cloudIncomes));
                        localStorage.setItem('family_expenses', JSON.stringify(cloudExpenses));
                        localStorage.setItem('family_fixed_template', JSON.stringify(cloudFixed));
                        localStorage.setItem('family_categories', JSON.stringify(cloudCategories));
                        localStorage.setItem('family_debts', JSON.stringify(cloudDebts));
                        localStorage.setItem('family_fixed_tracking', JSON.stringify(cloudTracking));
                    } else { 
                        // If document doesn't exist on Cloud yet, UPLOAD local data to initialize it
                        db.collection('families').doc(familyCode).set({ 
                            incomes: localI, 
                            expenses: localE, 
                            fixedTemplate: localFT, 
                            categories: localC, 
                            debts: localD, 
                            fixedTracking: localTr
                        }); 
                    }
                    setIsSyncing(false);
                }, (error: any) => { 
                    console.error("Firebase connection error:", error); 
                    setIsConnected(false); 
                });
                return () => unsubscribe();
            } catch (e) { 
                console.error("Firebase config parsing error:", e); 
                setIsConnected(false); 
            }
        }
    }, [firebaseConfigStr, familyCode]);

    // Action function to save all data to both Local and Cloud
    const saveData = (newIncomes: Income[], newExpenses: Expense[], newFixed = fixedTemplate, newCats = categories, newDebts = debts, newTracking = fixedTracking) => {
        const catSet = new Set(newCats);
        const syncedFixed = newFixed.filter(f => catSet.has(f.category));
        const syncedTracking = { ...newTracking };
        Object.keys(syncedTracking).forEach(monthKey => {
            syncedTracking[monthKey] = syncedTracking[monthKey].filter(c => catSet.has(c));
        });

        // Update states
        setIncomes(newIncomes); 
        setExpenses(newExpenses); 
        setFixedTemplate(syncedFixed); 
        setCategories(newCats); 
        setDebts(newDebts); 
        setFixedTracking(syncedTracking);

        // Save to LocalStorage immediately
        localStorage.setItem('family_incomes', JSON.stringify(newIncomes));
        localStorage.setItem('family_expenses', JSON.stringify(newExpenses));
        localStorage.setItem('family_fixed_template', JSON.stringify(syncedFixed));
        localStorage.setItem('family_categories', JSON.stringify(newCats));
        localStorage.setItem('family_debts', JSON.stringify(newDebts));
        localStorage.setItem('family_fixed_tracking', JSON.stringify(syncedTracking));
        
        // Push to Firebase Cloud
        if (isConnected && dbRef.current && familyCode) {
            setIsSyncing(true);
            dbRef.current.collection('families').doc(familyCode).set({ 
                incomes: newIncomes, 
                expenses: newExpenses, 
                fixedTemplate: syncedFixed, 
                categories: newCats, 
                debts: newDebts, 
                fixedTracking: syncedTracking
            }).then(() => {
                setIsSyncing(false);
            }).catch((err: any) => {
                setIsSyncing(false);
                console.error("Firebase sync error:", err);
            });
        }
    };

    // Formatting & Calculations
    const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);
    const formatDate = (date: string) => { if(!date) return ''; const d = new Date(date); return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`; };
    
    const getFiscalRange = (date: Date) => { 
        const year = date.getFullYear(), month = date.getMonth(); 
        const startDate = new Date(year, month, 1); startDate.setHours(0,0,0,0); 
        const endDate = new Date(year, month + 1, 0); endDate.setHours(23,59,59,999); 
        return { startDate, endDate }; 
    };
    
    const { startDate, endDate } = useMemo(() => getFiscalRange(viewDate), [viewDate]);

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

    // Handlers
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

    const getMonthlyPaidForCategory = (cat: string) => {
        return filteredExpenses.filter(e => e.category === cat)
            .reduce((sum, item) => sum + item.amount, 0);
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

    const handleMoveCategory = (index: number, direction: 'up' | 'down' | 'left' | 'right') => {
        let targetIndex = index;
        if (direction === 'left') targetIndex = index - 1;
        else if (direction === 'right') targetIndex = index + 1;
        else if (direction === 'up') targetIndex = index - 3;
        else if (direction === 'down') targetIndex = index + 3;

        if (targetIndex >= 0 && targetIndex < categories.length) {
            const newCats = [...categories];
            [newCats[index], newCats[targetIndex]] = [newCats[targetIndex], newCats[index]];
            saveData(incomes, expenses, fixedTemplate, newCats);
        }
    };

    const handleDeleteCategory = (catToDelete: string) => {
        if (!confirm(`Xác nhận xóa danh mục "${catToDelete}"? Các mục cố định và theo dõi liên quan cũng sẽ bị xóa.`)) return;
        const newCats = categories.filter(c => c !== catToDelete);
        saveData(incomes, expenses, fixedTemplate, newCats);
    };

    const handleRenameCategory = (oldName: string) => {
        const newName = prompt(`Sửa tên danh mục:`, oldName);
        if (newName && newName !== oldName) {
            const newCats = categories.map(c => c === oldName ? newName : c);
            const newFixed = fixedTemplate.map(f => f.category === oldName ? { ...f, category: newName } : f);
            const newTracking = { ...fixedTracking };
            Object.keys(newTracking).forEach(k => {
                newTracking[k] = newTracking[k].map(c => c === oldName ? newName : c);
            });
            saveData(incomes, expenses, newFixed, newCats, debts, newTracking);
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
        if (!confirm('Xóa giao dịch này?')) return;
        if (type === 'income') saveData(incomes.filter(i => i.id !== id), expenses);
        else saveData(incomes, expenses.filter(e => e.id !== id));
    };

    const handleExportExcel = () => {
        if (typeof XLSX === 'undefined') { alert("Thư viện Excel chưa được tải."); return; }
        const wb = XLSX.utils.book_new();
        const incData = filteredIncomes.map(i => ({ "Ngày": formatDate(i.date), "Nguồn": i.source, "Số tiền": i.amount, "Ghi chú": i.note }));
        const expData = filteredExpenses.map(e => ({ "Ngày": formatDate(e.date), "Danh mục": e.category, "Số tiền": e.amount, "Ghi chú": e.note }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incData), "Thu Nhập");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expData), "Chi Tiêu");
        XLSX.writeFile(wb, `BaoCao_${viewDate.getMonth()+1}.xlsx`);
    };

    const handleBackup = () => {
        const data = { incomes, expenses, fixedTemplate, categories, debts, fixedTracking };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup_finance_${getLocalToday()}.json`;
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
                    saveData(data.incomes||[], data.expenses||[], data.fixedTemplate||[], data.categories||DEFAULT_CATEGORIES, data.debts||[], data.fixedTracking||{});
                }
            } catch (err) { alert('Lỗi định dạng file!'); }
        };
        reader.readAsText(file);
    };

    const savingsSummary = useMemo(() => {
        return SAVING_CATEGORIES.map(cat => {
            const total = expenses.filter(e => e.category === cat).reduce((sum, item) => sum + item.amount, 0);
            return { category: cat, total };
        });
    }, [expenses]);

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
                            <div className="font-bold text-lg">{formatCurrency(sumIncomeMonth)} VNĐ</div>
                        </div>
                        <div className="bg-red-500/20 backdrop-blur-sm p-4 rounded-2xl border border-red-500/30">
                            <div className="text-red-300 text-xs font-bold uppercase mb-1 flex items-center gap-1"><TrendingDown size={14}/> Tổng Chi Tiêu</div>
                            <div className="font-bold text-lg">{formatCurrency(sumExpenseMonth)} VNĐ</div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2">
                        {!isConnected ? (
                            <button onClick={()=>setShowCloudForm(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-white transition-all backdrop-blur-md btn-effect">
                                <CloudOff size={14}/> <span>Kết Nối Đám Mây</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-500/30 backdrop-blur-md">
                                <div className="text-[10px] text-blue-200">Mã: <span className="font-bold text-white">{familyCode}</span></div>
                                <button onClick={()=>{if(confirm('Ngắt?')){localStorage.removeItem('fb_config'); window.location.reload();}}} className="text-[10px] text-red-300 font-bold border-l border-white/10 pl-3">Ngắt</button>
                                {isSyncing && <div className="text-[10px] text-green-300 animate-pulse ml-2 font-bold uppercase tracking-tighter">● Đang lưu...</div>}
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
                    {activeTab === 'add' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            <div className="bg-white border border-green-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
                                <div className="flex items-center gap-2 text-green-700 font-bold mb-3"><TrendingUp size={18}/> 1. Thu Nhập</div>
                                <div className="space-y-3 pl-2">
                                    <input type="text" placeholder="Tên nguồn thu nhập" value={incomeSource} onChange={e=>setIncomeSource(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl font-medium input-effect"/>
                                    <div className="flex gap-3">
                                        <input type="text" inputMode="numeric" placeholder="Số tiền..." value={incomeAmount} onChange={e=>handleAmountInput(e.target.value, setIncomeAmount)} className="w-1/2 p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 text-lg input-effect"/>
                                        <CustomDatePicker value={incomeDate} onChange={e=>setIncomeDate(e.target.value)} className="flex-1" />
                                    </div>
                                    <button onClick={handleAddIncome} disabled={!incomeSource || !incomeAmount} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg btn-effect">Thêm Thu Nhập</button>
                                </div>
                            </div>
                            
                            <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-red-700 font-bold"><TrendingDown size={18}/> 2. Chi Tiêu</div>
                                    <button onClick={() => setIsCategoryManageMode(!isCategoryManageMode)} className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${isCategoryManageMode ? 'bg-red-600 text-white border-red-700' : 'bg-gray-100 text-gray-500'}`}>{isCategoryManageMode ? 'Hoàn tất' : 'Sắp xếp/Xóa'}</button>
                                </div>
                                <div className="space-y-4 pl-2">
                                    <div className="grid grid-cols-3 gap-2 pr-1">
                                        {categories.map((cat, idx) => (
                                            <div key={cat} className="relative group h-[72px]">
                                                {isCategoryManageMode ? (
                                                    <div className="absolute inset-0 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-between p-1 z-20 shadow-sm animate-fadeIn">
                                                        <span className="text-[7px] font-extrabold text-gray-400 truncate w-full text-center uppercase tracking-tighter">{cat}</span>
                                                        <div className="grid grid-cols-3 gap-0.5 w-full place-items-center">
                                                            <button onClick={() => handleMoveCategory(idx, 'up')} className="p-0.5 text-gray-400 hover:text-gray-800"><ChevronUp size={12}/></button>
                                                            <button onClick={() => handleRenameCategory(cat)} className="p-0.5 text-blue-500 hover:text-blue-700"><Edit2 size={10}/></button>
                                                            <button onClick={() => handleMoveCategory(idx, 'down')} className="p-0.5 text-gray-400 hover:text-gray-800"><ChevronDown size={12}/></button>
                                                            <button onClick={() => handleMoveCategory(idx, 'left')} className="p-0.5 text-gray-400 hover:text-gray-800"><ChevronLeft size={12}/></button>
                                                            <button onClick={() => handleDeleteCategory(cat)} className="p-0.5 text-red-500 hover:text-red-700"><Trash2 size={12}/></button>
                                                            <button onClick={() => handleMoveCategory(idx, 'right')} className="p-0.5 text-gray-400 hover:text-gray-800"><ChevronRight size={12}/></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setExpenseCategory(cat)} className={`category-btn w-full h-full text-[10px] font-bold rounded-lg border transition-all ${expenseCategory === cat ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{cat}</button>
                                                )}
                                            </div>
                                        ))}
                                        {!isCategoryManageMode && (
                                            <button onClick={handleAddCustomCategory} className="category-btn h-[72px] text-[10px] font-bold rounded-lg border border-dashed border-gray-400 text-gray-500 hover:bg-gray-50"><Plus size={16}/></button>
                                        )}
                                    </div>
                                    
                                    {expenseCategory && !isCategoryManageMode && (
                                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl animate-fadeIn flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><Clock size={14}/></div>
                                                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-tight">Tháng này đã tiêu hết :</span>
                                            </div>
                                            <span className="text-sm font-black text-indigo-800">{formatCurrency(getMonthlyPaidForCategory(expenseCategory))} VNĐ</span>
                                        </div>
                                    )}

                                    {expenseCategory === DEBT_CATEGORY_NAME && (
                                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl animate-fadeIn">
                                            <label className="text-[10px] font-bold text-blue-700 uppercase mb-1 block tracking-wider">Chọn người liên quan:</label>
                                            <select value={selectedDebtorId} onChange={(e) => setSelectedDebtorId(e.target.value)} className="w-full p-2.5 bg-white border border-blue-300 rounded-lg text-sm font-bold outline-none">
                                                <option value="">-- Chọn Sổ Nợ --</option>
                                                {debts.map(d => <option key={d.id} value={d.id}>{d.type === 'receivable' ? 'Nhận: ' : 'Trả: '}{d.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <input type="text" inputMode="numeric" placeholder="Số tiền..." value={expenseAmount} onChange={e=>handleAmountInput(e.target.value, setExpenseAmount)} className="w-1/2 p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 text-lg input-effect"/>
                                        <CustomDatePicker value={expenseDate} onChange={e=>setExpenseDate(e.target.value)} className="flex-1" />
                                    </div>
                                    <button onClick={handleAddExpense} disabled={!expenseCategory || !expenseAmount} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg btn-effect transition-all disabled:opacity-50">Lưu Chi Tiêu</button>
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
                                                    <div className="text-[10px] text-gray-500 mt-1 font-medium">Còn: {formatCurrency(item.total - item.paid)} VNĐ / Tổng: {formatCurrency(item.total)} VNĐ</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={()=>{setIsEditingDebt(item.id); setDebtName(item.name); setDebtTotal(formatCurrency(item.total)); setDebtPaid(formatCurrency(item.paid)); setDebtNote(item.note||''); setDebtType(item.type); setShowDebtForm(true);}} className="text-blue-500 p-1.5 bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                                                    <button onClick={()=>{if(confirm('Xóa sổ nợ?')) saveData(incomes, expenses, fixedTemplate, categories, debts.filter(d => d.id !== item.id));}} className="text-red-400 p-1.5 bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                        ))}
                                        {debts.filter(d => d.type === activeDebtTab).length === 0 && <div className="text-center py-10 text-gray-400 text-xs italic">Chưa có sổ nợ nào trong danh sách này</div>}
                                    </div>
                                </>
                             ) : (
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fadeIn space-y-4">
                                    <div className="flex gap-2 mb-2">
                                        <button onClick={()=>setDebtType('payable')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${debtType==='payable'?'bg-orange-100 text-orange-700 border-orange-300':'bg-white text-gray-500 border-gray-100'}`}>Mình nợ</button>
                                        <button onClick={()=>setDebtType('receivable')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${debtType==='receivable'?'bg-blue-100 text-blue-700 border-blue-300':'bg-white text-gray-500 border-gray-100'}`}>Người ta nợ</button>
                                    </div>
                                    <input type="text" value={debtName} onChange={e=>setDebtName(e.target.value)} className="w-full p-3.5 bg-gray-50 border-none rounded-xl font-bold outline-none" placeholder="Tên người nợ / Khoản nợ..."/>
                                    <div className="flex gap-2">
                                        <div className="flex-1"><label className="text-[9px] text-gray-400 font-bold uppercase block mb-1 tracking-widest pl-1">Tổng nợ</label><input type="text" value={debtTotal} onChange={e=>handleAmountInput(e.target.value, setDebtTotal)} className="w-full p-2.5 border border-gray-100 rounded-xl font-bold text-orange-600 outline-none" /></div>
                                        <div className="flex-1"><label className="text-[9px] text-gray-400 font-bold uppercase block mb-1 tracking-widest pl-1">Đã trả/thu</label><input type="text" value={debtPaid} onChange={e=>handleAmountInput(e.target.value, setDebtPaid)} className="w-full p-2.5 border border-gray-100 rounded-xl font-bold text-blue-600 outline-none" /></div>
                                    </div>
                                    <div className="flex items-center gap-2 px-1"><input type="checkbox" checked={autoCreateTransaction} onChange={e=>setAutoCreateTransaction(e.target.checked)} id="autoSync" className="w-4 h-4 rounded"/><label htmlFor="autoSync" className="text-[11px] text-gray-600 font-medium">Tự động tạo giao dịch khi tiền thay đổi</label></div>
                                    <div className="flex gap-3 pt-2"><button onClick={()=>setShowDebtForm(false)} className="flex-1 py-3.5 bg-gray-50 text-gray-500 font-bold rounded-xl text-xs uppercase tracking-wider">Hủy</button><button onClick={handleSaveDebt} className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg text-xs uppercase tracking-wider">Lưu & Đồng bộ</button></div>
                                </div>
                             )}
                        </div>
                    )}

                    {activeTab === 'report' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-50 pb-3"><PieChart size={20} className="text-indigo-600"/> Tỷ lệ chi tiêu tháng này</h3>
                                <div className="space-y-5 text-left">
                                    {Object.entries(filteredExpenses.reduce((a,c)=>{a[c.category]=(a[c.category]||0)+c.amount; return a;}, {} as any)).sort(([,a],[,b]) => (b as number)-(a as number)).map(([cat, amt]) => {
                                        const pct = sumIncomeMonth > 0 ? Math.round(((amt as number)/sumIncomeMonth)*100) : 0;
                                        return (
                                            <div key={cat} className="animate-fadeIn">
                                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                                    <span className="text-gray-600">{cat}</span>
                                                    <span className="text-gray-900">{formatCurrency(amt as number)} VNĐ <span className="text-gray-400 font-medium ml-1">({pct}%)</span></span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-100">
                                                    <div className="bg-gradient-to-r from-red-500 to-orange-400 h-full rounded-full transition-all duration-500" style={{width: `${Math.min(pct,100)}%`}}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredExpenses.length === 0 && <div className="text-center py-8 text-gray-400 text-xs font-medium">Chưa có dữ liệu chi tiêu trong tháng này</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'savings' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                    <div className="bg-yellow-100 p-2.5 rounded-2xl text-yellow-600 shadow-sm"><PiggyBank size={24}/></div>
                                    <h3 className="font-bold text-gray-800 text-lg">Heo Đất Tích Lũy</h3>
                                </div>
                                <div className="space-y-4">
                                    {savingsSummary.map(item => (
                                        <div key={item.category} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm group hover:bg-white hover:border-yellow-200 transition-all">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">{item.category}</span>
                                                    <span className="text-lg font-black text-gray-800">{formatCurrency(item.total)} VNĐ</span>
                                                </div>
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-yellow-500 border border-gray-100 group-hover:scale-110 transition-transform"><Plus size={20}/></div>
                                            </div>
                                        </div>
                                    ))}
                                    {savingsSummary.reduce((a,b)=>a+b.total, 0) === 0 && <div className="text-center py-10 text-gray-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-gray-200">Bạn chưa bắt đầu khoản tiết kiệm nào</div>}
                                </div>
                                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-5 rounded-2xl text-white shadow-lg">
                                    <div className="text-xs font-bold opacity-80 uppercase tracking-tighter mb-1">Tổng cộng tích lũy</div>
                                    <div className="text-2xl font-black">{formatCurrency(savingsSummary.reduce((a,b)=>a+b.total, 0))} VNĐ</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-fadeIn mt-2 space-y-3">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 flex gap-3 items-center"><Search size={18} className="text-gray-400"/><input type="text" placeholder="Tìm kiếm giao dịch..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="flex-1 outline-none text-sm font-medium"/></div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                                {[...filteredIncomes.map(i=>({...i,type:'income'})), ...filteredExpenses.map(e=>({...e,type:'expense'}))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                                    <div key={item.id} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${item.type==='income'?'bg-green-50 text-green-600':'bg-red-50 text-red-600'}`}>{item.type==='income'?<TrendingUp size={20}/>:<TrendingDown size={20}/>}</div>
                                            <div className="max-w-[180px] overflow-hidden">
                                                <p className="font-bold text-gray-800 text-[13px] truncate uppercase">{(item as any).source || (item as any).category}</p>
                                                <p className="text-[10px] text-gray-400 italic font-medium">"{item.note||'Không ghi chú'}" - {formatDate(item.date)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-[13px] ${item.type==='income'?'text-green-600':'text-red-600'}`}>{item.type==='income'?'+':'-'}{formatCurrency(item.amount)} VNĐ</p>
                                            <button onClick={()=>deleteItem(item.id, item.type as any)} className="text-[9px] text-gray-300 font-extrabold uppercase mt-1 tracking-widest hover:text-red-500">Xóa</button>
                                        </div>
                                    </div>
                                ))}
                                {(filteredIncomes.length === 0 && filteredExpenses.length === 0) && <div className="p-12 text-center text-gray-400 text-xs font-medium bg-gray-50">Không tìm thấy giao dịch nào</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-bold text-gray-800 border-b border-gray-50 pb-3 flex items-center gap-2"><SettingsIcon size={22} className="text-slate-500"/> Thiết lập hệ thống</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <button onClick={()=>setShowFixedConfig(true)} className="w-full p-4 bg-purple-50 text-purple-700 rounded-2xl font-bold flex justify-between items-center shadow-sm active:scale-95 transition-all">Quản lý mục cố định <Clock size={20}/></button>
                                    <button onClick={handleExportExcel} className="w-full p-4 bg-green-50 text-green-700 rounded-2xl font-bold flex justify-between items-center shadow-sm active:scale-95 transition-all">Xuất báo cáo Excel <FileSpreadsheet size={20}/></button>
                                    <button onClick={handleBackup} className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-bold flex justify-between items-center shadow-sm active:scale-95 transition-all">Sao lưu dữ liệu <Download size={20}/></button>
                                    <label className="w-full p-4 bg-slate-50 text-slate-700 rounded-2xl font-bold flex justify-between items-center shadow-sm cursor-pointer active:scale-95 transition-all">Khôi phục từ file <Upload size={20}/><input type="file" className="hidden" onChange={handleRestore} accept=".json"/></label>
                                </div>
                                <div className="pt-4 border-t border-gray-50 text-center">
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">CashFlow v2.5 - Family Edition</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Floating Bottom UI */}
                <div className="fixed bottom-8 left-4 z-50 flex flex-col gap-3">
                    <button onClick={()=>setShowFixedTrackingModal(true)} className="bg-purple-600 text-white p-4 rounded-full shadow-2xl border-2 border-white transform hover:scale-110 transition-all btn-effect ring-4 ring-purple-500/10">
                        <MessageCircle size={24}/>
                    </button>
                </div>

                <div onClick={()=>setShowReloadConfirm(true)} className={`fixed bottom-8 right-4 z-50 flex flex-col items-center gap-1 cursor-pointer transition-all duration-300`}>
                    <div className={`shadow-2xl rounded-full px-5 py-3.5 flex items-center gap-3 border-2 border-white transform hover:scale-105 btn-effect transition-all ring-4 ${balance>=0?'bg-gradient-to-r from-blue-600 to-cyan-500 ring-blue-500/10':'bg-gradient-to-r from-red-600 to-orange-500 ring-red-500/10'}`}>
                        <div className="bg-white/20 p-1.5 rounded-full"><Wallet size={20} className="text-white"/></div>
                        <div className="flex flex-col items-start text-white font-extrabold text-lg leading-none tracking-tight">{formatCurrency(balance)} VNĐ</div>
                    </div>
                </div>

                {/* Modals Section */}
                {showFixedTrackingModal && (
                    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-t-[40px] w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border-t border-purple-100">
                            <div className="p-6 bg-purple-50 rounded-t-[40px] flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-600 p-2 rounded-xl text-white shadow-lg shadow-purple-200"><Clock size={20}/></div>
                                    <h3 className="font-bold text-purple-800 text-lg">Chi cố định tháng {viewDate.getMonth() + 1}</h3>
                                </div>
                                <button onClick={()=>setShowFixedTrackingModal(false)} className="bg-white p-2 rounded-full shadow-sm text-purple-400"><X size={20}/></button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 space-y-5 no-scrollbar">
                                {fixedTemplate.length === 0 && <div className="text-center py-10 text-gray-400 text-sm font-medium italic">Chưa thiết lập danh mục chi tiêu cố định</div>}
                                {fixedTemplate.map(item => {
                                    const paidSoFar = getMonthlyPaidForCategory(item.category); const remaining = item.amount - paidSoFar; const isFullyPaid = remaining <= 0;
                                    const inputValue = fixedPaymentInputs[item.category] || (remaining > 0 ? formatCurrency(remaining) : '');
                                    return (
                                        <div key={item.category} className={`bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-all ${isFullyPaid ? 'opacity-40 grayscale' : 'shadow-sm'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-sm font-extrabold text-gray-800 block uppercase tracking-tight">{item.category}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold italic">Hạn mức: {formatCurrency(item.amount)} VNĐ</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${isFullyPaid ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600 uppercase'}`}>{isFullyPaid ? 'Đã thanh toán' : `Cần chi: ${formatCurrency(remaining)}`}</span>
                                                </div>
                                            </div>
                                            {!isFullyPaid && (
                                                <div className="flex gap-2 mt-3">
                                                    <input type="text" inputMode="numeric" value={inputValue} onChange={(e) => handleAmountInput(e.target.value, (v)=>setFixedPaymentInputs(p=>({...p, [item.category]: v})))} className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-purple-300" placeholder="Số tiền thực tế..." />
                                                    <button onClick={() => handleConfirmFixedItem(item, parseAmount(inputValue))} className="px-5 py-3 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-100 uppercase tracking-widest active:scale-95 transition-all">Chi</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-6 safe-pb"></div>
                        </div>
                    </div>
                )}

                {showFixedConfig && (
                    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative border border-gray-100 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-purple-600"></div>
                            <button onClick={()=>setShowFixedConfig(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full"><X size={20}/></button>
                            <h3 className="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2"><Clock size={20} className="text-purple-600"/> Cấu hình mục cố định</h3>
                            <p className="text-[10px] text-gray-400 mb-4 font-bold uppercase tracking-widest pl-1">Nhập hạn mức chi hàng tháng cho các mục:</p>
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
                                {categories.map(cat => (
                                    <div key={cat} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                                        <span className="flex-1 text-[11px] font-bold text-gray-600 truncate uppercase tracking-tighter">{cat}</span>
                                        <input type="text" inputMode="numeric" value={tempFixedList[cat] ? formatCurrency(tempFixedList[cat]) : (fixedTemplate.find(f => f.category === cat)?.amount ? formatCurrency(fixedTemplate.find(f => f.category === cat)!.amount) : '')} onChange={(e) => handleAmountInput(e.target.value, (v)=>setTempFixedList(p=>({...p, [cat]: parseAmount(v)})))} className="w-28 p-2.5 bg-white border border-gray-100 rounded-xl text-[11px] font-extrabold text-right text-purple-700 outline-none focus:border-purple-300" placeholder="0 VNĐ"/>
                                    </div>
                                ))}
                            </div>
                            <button onClick={()=>{saveData(incomes, expenses, Object.entries(tempFixedList).filter(([,a])=>(a as number)>0).map(([c,a])=>({category:c, amount:a as number}))); setShowFixedConfig(false);}} className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl mt-6 uppercase text-xs tracking-[0.2em] shadow-lg shadow-purple-100 active:scale-95 transition-all">Lưu cấu hình</button>
                        </div>
                    </div>
                )}

                {showReloadConfirm && (
                    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-[280px] w-full border border-gray-100">
                            <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner"><RefreshCw size={28} className="text-blue-600"/></div>
                            <h3 className="font-bold text-lg mb-2 text-gray-800">Tải lại ứng dụng?</h3>
                            <p className="text-xs text-gray-400 font-medium mb-6">Mọi thay đổi chưa lưu sẽ được làm mới từ máy chủ.</p>
                            <div className="flex gap-3 mt-6"><button onClick={()=>setShowReloadConfirm(false)} className="flex-1 py-3.5 bg-gray-50 text-gray-500 font-bold rounded-2xl text-[11px] uppercase tracking-widest active:bg-gray-100">Hủy</button><button onClick={()=>window.location.reload()} className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-2xl text-[11px] uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95">Đồng ý</button></div>
                        </div>
                    </div>
                )}

                {showCloudForm && (
                    <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-[40px] w-full max-w-sm p-8 shadow-2xl text-left border border-gray-100">
                            <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><Cloud size={24} className="text-blue-600"/><h3 className="font-bold text-gray-800 text-xl">Đám mây</h3></div><button onClick={()=>setShowCloudForm(false)} className="bg-gray-50 p-2 rounded-full text-gray-400"><X size={20}/></button></div>
                            <div className="space-y-5">
                                <div><label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Mã Gia Đình</label><input type="text" value={familyCode} onChange={e=>setFamilyCode(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500/20" placeholder="GD-XXXXXX" /></div>
                                <div><label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Cấu hình Firebase (JSON)</label><textarea value={firebaseConfigStr} onChange={e=>setFirebaseConfigStr(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-[10px] h-32 outline-none resize-none font-mono focus:ring-2 ring-blue-500/20" placeholder='{"apiKey": "...", ...}'></textarea></div>
                                <button onClick={()=>{localStorage.setItem('fb_config', firebaseConfigStr); localStorage.setItem('fb_family_code', familyCode); window.location.reload();}} className="w-full py-4.5 bg-blue-600 text-white font-bold rounded-[20px] shadow-xl shadow-blue-100 uppercase text-xs tracking-[0.3em] mt-2 active:scale-95 transition-all">Lưu & Kết nối</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;

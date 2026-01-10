
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

    // Saving States
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

                // Quan trọng: Sử dụng onSnapshot với includeMetadataChanges để bắt kịp mọi thay đổi
                const unsubscribe = db.collection('families').doc(familyCode).onSnapshot((doc: any) => {
                    if (doc.exists) { 
                        const data = doc.data(); 
                        
                        // CẬP NHẬT GIAO DIỆN TỪ CLOUD
                        setIncomes(data.incomes || []); 
                        setExpenses(data.expenses || []); 
                        setFixedTemplate(data.fixedTemplate || []);
                        setCategories(data.categories || DEFAULT_CATEGORIES);
                        setDebts(data.debts || []);
                        setFixedTracking(data.fixedTracking || {});

                        // CẬP NHẬT LOCALSTORAGE
                        localStorage.setItem('family_incomes', JSON.stringify(data.incomes || []));
                        localStorage.setItem('family_expenses', JSON.stringify(data.expenses || []));
                        localStorage.setItem('family_fixed_template', JSON.stringify(data.fixedTemplate || []));
                        localStorage.setItem('family_categories', JSON.stringify(data.categories || DEFAULT_CATEGORIES));
                        localStorage.setItem('family_debts', JSON.stringify(data.debts || []));
                        localStorage.setItem('family_fixed_tracking', JSON.stringify(data.fixedTracking || {}));
                        
                        setSyncError(null);
                    } else { 
                        // Nếu chưa có tài liệu, ĐẨY DỮ LIỆU LOCAL LÊN (Chỉ thực hiện nếu local có dữ liệu)
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

    // Save Data Handler (Atomic Updates)
    const saveData = (newIncomes: Income[], newExpenses: Expense[], newFixed = fixedTemplate, newCats = categories, newDebts = debts, newTracking = fixedTracking) => {
        // Cập nhật State tức thì để UI không bị delay
        setIncomes(newIncomes); 
        setExpenses(newExpenses); 
        setFixedTemplate(newFixed); 
        setCategories(newCats); 
        setDebts(newDebts); 
        setFixedTracking(newTracking);

        // Lưu Local dự phòng
        localStorage.setItem('family_incomes', JSON.stringify(newIncomes));
        localStorage.setItem('family_expenses', JSON.stringify(newExpenses));
        localStorage.setItem('family_fixed_template', JSON.stringify(newFixed));
        localStorage.setItem('family_categories', JSON.stringify(newCats));
        localStorage.setItem('family_debts', JSON.stringify(newDebts));
        localStorage.setItem('family_fixed_tracking', JSON.stringify(newTracking));
        
        // Đồng bộ Cloud
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

    // Helper Functions
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

    // Action Handlers
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
        // Tiết kiệm thực chất là một khoản chi (Expenses) trong hệ thống
        saveData(incomes, [newItem, ...expenses], fixedTemplate, categories, debts);
        setSavingAmount(''); setSavingNote(''); setShowSavingForm(false);
    };

    const resetForm = () => { setIncomeSource(''); setIncomeAmount(''); setIncomeNote(''); setExpenseCategory(''); setExpenseAmount(''); setExpenseNote(''); setEditingId(null); setEditingType(null); setSelectedDebtorId(''); };

    const getMonthlyPaidForCategory = (cat: string) => filteredExpenses.filter(e => e.category === cat).reduce((sum, item) => sum + item.amount, 0);

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
        if (!confirm(`Xác nhận xóa danh mục "${catToDelete}"?`)) return;
        saveData(incomes, expenses, fixedTemplate, categories.filter(c => c !== catToDelete));
    };

    const handleRenameCategory = (oldName: string) => {
        const newName = prompt(`Sửa tên danh mục:`, oldName);
        if (newName && newName !== oldName) {
            saveData(incomes, expenses, fixedTemplate, categories.map(c => c === oldName ? newName : c));
        }
    };

    const handleAddCustomCategory = () => {
        const name = prompt("Nhập tên danh mục mới:");
        if (name && !categories.includes(name)) saveData(incomes, expenses, fixedTemplate, [...categories, name]);
    };

    const deleteItem = (id: number, type: 'income' | 'expense') => {
        if (!confirm('Xóa giao dịch này?')) return;
        if (type === 'income') saveData(incomes.filter(i => i.id !== id), expenses);
        else saveData(incomes, expenses.filter(e => e.id !== id));
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

    // Calculate total savings from ALL TIME (not just current view month)
    const savingsSummary = useMemo(() => SAVING_CATEGORIES.map(cat => ({ 
        category: cat, 
        total: expenses.filter(e => e.category === cat).reduce((sum, item) => sum + item.amount, 0) 
    })), [expenses]);
    
    const totalAccumulatedSavings = useMemo(() => savingsSummary.reduce((acc, curr) => acc + curr.total, 0), [savingsSummary]);

    return (
        <div className="min-h-screen pb-24 md:pb-0 relative font-sans overflow-x-hidden">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
                {isOverBudget && <div className="bg-red-50 text-red-600 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-pulse-red border-b border-red-100"><AlertTriangle size={16} /> CHI TIÊU QUÁ HẠN MỨC 90%!</div>}
                
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
                        <div className="bg-green-500/20 backdrop-blur-sm p-4 rounded-2xl border border-green-500/30 shadow-inner">
                            <div className="text-green-300 text-[10px] font-black uppercase mb-1 flex items-center gap-1"><TrendingUp size={12}/> Thu Nhập</div>
                            <div className="font-bold text-lg">{formatCurrency(sumIncomeMonth)} đ</div>
                        </div>
                        <div className="bg-red-500/20 backdrop-blur-sm p-4 rounded-2xl border border-red-500/30 shadow-inner">
                            <div className="text-red-300 text-[10px] font-black uppercase mb-1 flex items-center gap-1"><TrendingDown size={12}/> Chi Tiêu</div>
                            <div className="font-bold text-lg">{formatCurrency(sumExpenseMonth)} đ</div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-1">
                        {!isConnected ? (
                            <button onClick={()=>setShowCloudForm(true)} className="flex items-center gap-2 bg-red-500/80 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all backdrop-blur-md btn-effect">
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
                            <button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-1 min-w-[60px] py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all btn-effect flex flex-col items-center gap-1 ${activeTab === tab ? 'bg-slate-800 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
                                {tab === 'add' ? 'Nhập' : tab === 'debt' ? 'Sổ Nợ' : tab === 'report' ? 'Báo Cáo' : tab === 'savings' ? 'Heo Đất' : tab === 'history' ? 'Lịch Sử' : <SettingsIcon size={16}/>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 pb-32">
                    {activeTab === 'add' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            {/* Nhập Thu Nhập */}
                            <div className="bg-white border border-green-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
                                <div className="flex items-center gap-2 text-green-700 font-bold mb-3 uppercase text-xs tracking-widest"><TrendingUp size={16}/> 1. Thu Nhập</div>
                                <div className="space-y-3 pl-2">
                                    <input type="text" placeholder="Nguồn thu (Lương, Thưởng...)" value={incomeSource} onChange={e=>setIncomeSource(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl font-medium input-effect text-sm"/>
                                    <div className="flex gap-3">
                                        <input type="text" inputMode="numeric" placeholder="Số tiền..." value={incomeAmount} onChange={e=>handleAmountInput(e.target.value, setIncomeAmount)} className="w-1/2 p-3 bg-gray-50 border-none rounded-xl font-black text-gray-700 text-lg input-effect"/>
                                        <CustomDatePicker value={incomeDate} onChange={e=>setIncomeDate(e.target.value)} className="flex-1" />
                                    </div>
                                    <input type="text" placeholder="Ghi chú (tùy chọn)..." value={incomeNote} onChange={e=>setIncomeNote(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl font-medium input-effect text-sm"/>
                                    <button onClick={handleAddIncome} disabled={!incomeSource || !incomeAmount} className="w-full py-3.5 bg-green-600 text-white font-black rounded-xl shadow-lg btn-effect uppercase text-xs tracking-[0.2em] transition-all disabled:opacity-30">Lưu Thu Nhập</button>
                                </div>
                            </div>
                            
                            {/* Nhập Chi Tiêu */}
                            <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                                <div className="flex items-center justify-between mb-3 pl-2">
                                    <div className="flex items-center gap-2 text-red-700 font-bold uppercase text-xs tracking-widest"><TrendingDown size={16}/> 2. Chi Tiêu</div>
                                    <button onClick={() => setIsCategoryManageMode(!isCategoryManageMode)} className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${isCategoryManageMode ? 'bg-red-600 text-white border-red-700 shadow-md' : 'bg-gray-100 text-gray-500'}`}>{isCategoryManageMode ? 'Xong' : 'Sửa Danh Mục'}</button>
                                </div>
                                <div className="space-y-4 pl-2">
                                    <div className="grid grid-cols-3 gap-2 pr-1">
                                        {categories.map((cat, idx) => (
                                            <div key={cat} className="relative h-[72px]">
                                                {isCategoryManageMode ? (
                                                    <div className="absolute inset-0 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-between p-1 z-20 shadow-sm animate-fadeIn">
                                                        <span className="text-[7px] font-extrabold text-gray-400 truncate w-full text-center uppercase tracking-tighter">{cat}</span>
                                                        <div className="grid grid-cols-3 gap-0.5 w-full place-items-center">
                                                            <button onClick={() => handleMoveCategory(idx, 'up')} className="p-0.5 text-gray-400"><ChevronUp size={12}/></button>
                                                            <button onClick={() => handleRenameCategory(cat)} className="p-0.5 text-blue-500"><Edit2 size={10}/></button>
                                                            <button onClick={() => handleMoveCategory(idx, 'down')} className="p-0.5 text-gray-400"><ChevronDown size={12}/></button>
                                                            <button onClick={() => handleMoveCategory(idx, 'left')} className="p-0.5 text-gray-400"><ChevronLeft size={12}/></button>
                                                            <button onClick={() => handleDeleteCategory(cat)} className="p-0.5 text-red-500"><Trash2 size={12}/></button>
                                                            <button onClick={() => handleMoveCategory(idx, 'right')} className="p-0.5 text-gray-400"><ChevronRight size={12}/></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setExpenseCategory(cat)} className={`category-btn w-full h-full text-[10px] font-bold rounded-lg border transition-all ${expenseCategory === cat ? 'bg-red-600 text-white border-red-600 shadow-lg scale-105 z-10' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{cat}</button>
                                                )}
                                            </div>
                                        ))}
                                        {!isCategoryManageMode && <button onClick={handleAddCustomCategory} className="category-btn h-[72px] text-[10px] font-bold rounded-lg border border-dashed border-gray-400 text-gray-400 hover:bg-gray-50"><Plus size={20}/></button>}
                                    </div>
                                    
                                    {expenseCategory && !isCategoryManageMode && (
                                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl animate-fadeIn flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-sm"><Clock size={12}/></div>
                                                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tight">Đã tiêu tháng này :</span>
                                            </div>
                                            <span className="text-sm font-black text-indigo-800">{formatCurrency(getMonthlyPaidForCategory(expenseCategory))} đ</span>
                                        </div>
                                    )}

                                    {expenseCategory === DEBT_CATEGORY_NAME && (
                                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl animate-fadeIn shadow-inner">
                                            <label className="text-[9px] font-black text-blue-700 uppercase mb-1 block tracking-widest pl-1">Người liên quan:</label>
                                            <select value={selectedDebtorId} onChange={(e) => setSelectedDebtorId(e.target.value)} className="w-full p-2.5 bg-white border border-blue-300 rounded-lg text-xs font-black outline-none shadow-sm">
                                                <option value="">-- Chọn Sổ Nợ --</option>
                                                {[...debts].sort((a, b) => {
                                                    if (a.type === 'payable' && b.type !== 'payable') return -1;
                                                    if (a.type !== 'payable' && b.type === 'payable') return 1;
                                                    return 0;
                                                }).map(d => <option key={d.id} value={d.id}>{d.type === 'receivable' ? 'THU: ' : 'TRẢ: '}{d.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <input type="text" inputMode="numeric" placeholder="Số tiền..." value={expenseAmount} onChange={e=>handleAmountInput(e.target.value, setExpenseAmount)} className="w-1/2 p-3 bg-gray-50 border-none rounded-xl font-black text-gray-700 text-lg input-effect"/>
                                        <CustomDatePicker value={expenseDate} onChange={e=>setExpenseDate(e.target.value)} className="flex-1" />
                                    </div>
                                    <input type="text" placeholder="Ghi chú (tùy chọn)..." value={expenseNote} onChange={e=>setExpenseNote(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl font-medium input-effect text-sm"/>
                                    <button onClick={handleAddExpense} disabled={!expenseCategory || !expenseAmount} className="w-full py-3.5 bg-red-600 text-white font-black rounded-xl shadow-lg btn-effect uppercase text-xs tracking-[0.2em] transition-all disabled:opacity-30">Lưu Chi Tiêu</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'debt' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                             {!showDebtForm ? (
                                <>
                                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-black text-gray-800 flex items-center gap-2 uppercase text-sm tracking-widest"><Users className="text-blue-600" size={18}/> Quản Lý Vay Mượn</h3>
                                            <button onClick={() => { setShowDebtForm(true); setIsEditingDebt(null); setDebtName(''); setDebtTotal(''); setDebtPaid(''); setDebtNote(''); }} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter btn-effect shadow-md shadow-blue-100">Mới</button>
                                        </div>
                                        <div className="flex p-1 bg-gray-100 rounded-xl mb-2">
                                            <button onClick={()=>setActiveDebtTab('payable')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeDebtTab==='payable' ? 'bg-white text-red-600 shadow-sm scale-[1.02]' : 'text-gray-400'}`}>Mình nợ</button>
                                            <button onClick={()=>setActiveDebtTab('receivable')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeDebtTab==='receivable' ? 'bg-white text-blue-600 shadow-sm scale-[1.02]' : 'text-gray-400'}`}>Họ nợ</button>
                                        </div>
                                        
                                        {/* STATS SUMMARY for Active Debt Tab */}
                                        {(() => {
                                            const currentDebts = debts.filter(d => d.type === activeDebtTab);
                                            const sumTotal = currentDebts.reduce((acc, d) => acc + d.total, 0);
                                            const sumPaid = currentDebts.reduce((acc, d) => acc + d.paid, 0);
                                            const sumRemaining = sumTotal - sumPaid;
                                            const isPayable = activeDebtTab === 'payable';

                                            return (
                                                <div className={`mb-4 p-4 rounded-2xl text-white shadow-lg bg-gradient-to-r ${isPayable ? 'from-red-500 to-rose-600 shadow-red-200' : 'from-blue-400 to-indigo-500 shadow-blue-200'}`}>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <div>
                                                            <div className="text-[10px] font-black uppercase opacity-80 mb-1">{isPayable ? 'Tổng tiền nợ' : 'Tổng cho vay'}</div>
                                                            <div className="text-2xl font-black">{formatCurrency(sumTotal)} đ</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[10px] font-black uppercase opacity-80 mb-1">Còn lại</div>
                                                            <div className="text-lg font-black">{formatCurrency(sumRemaining)} đ</div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white/20 p-2 rounded-xl flex justify-between items-center backdrop-blur-sm">
                                                        <span className="text-[10px] font-black uppercase">{isPayable ? 'Đã trả được' : 'Đã thu hồi'}</span>
                                                        <span className="text-sm font-black">{formatCurrency(sumPaid)} đ</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="space-y-4">
                                        {debts.filter(d => d.type === activeDebtTab).sort((a,b) => {
                                            const aDone = a.total - a.paid <= 0;
                                            const bDone = b.total - b.paid <= 0;
                                            if (aDone === bDone) return 0;
                                            return aDone ? 1 : -1;
                                        }).map(item => {
                                            let progressBarColor = activeDebtTab === 'receivable' ? 'bg-blue-500' : 'bg-red-500';
                                            if (activeDebtTab === 'payable') {
                                                const percentage = (item.paid / item.total) * 100;
                                                if (item.total - item.paid <= 0) progressBarColor = 'bg-green-500';
                                                else if (percentage >= 50) progressBarColor = 'bg-yellow-400';
                                                else progressBarColor = 'bg-red-500';
                                            } else {
                                                if (item.total - item.paid <= 0) progressBarColor = 'bg-green-500';
                                            }

                                            return (
                                                <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.total - item.paid <= 0 ? 'bg-green-500' : (activeDebtTab === 'payable' ? 'bg-red-500' : 'bg-blue-500')}`}></div>
                                                    <div className="pl-3 flex-1 mr-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="font-black text-gray-800 text-sm uppercase">{item.name}</p>
                                                            <span className="text-[9px] font-black text-gray-400">{Math.round((item.paid/item.total)*100)}%</span>
                                                        </div>
                                                        
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5 my-1.5 overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`} style={{width: `${Math.min(100, (item.paid/item.total)*100)}%`}}></div>
                                                        </div>

                                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                                            <span className="text-gray-400">ĐÃ TRẢ: <span className="text-gray-600">{formatCurrency(item.paid)}</span></span>
                                                            <span className={item.total - item.paid <= 0 ? "text-green-500" : "text-gray-400"}>
                                                                {item.total - item.paid <= 0 ? 'XONG' : `CÒN: ${formatCurrency(item.total - item.paid)}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={()=>{if(confirm('Xóa sổ nợ?')) saveData(incomes, expenses, fixedTemplate, categories, debts.filter(d => d.id !== item.id));}} className="text-red-400 p-2 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={16}/></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {debts.filter(d => d.type === activeDebtTab).length === 0 && <div className="text-center py-12 text-gray-400 text-[10px] font-black uppercase tracking-widest bg-gray-50 rounded-3xl border border-dashed border-gray-200">Danh sách trống</div>}
                                    </div>
                                </>
                             ) : (
                                <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100 animate-fadeIn space-y-5">
                                    <div className="flex gap-2 mb-2">
                                        <button onClick={()=>setDebtType('payable')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl border transition-all ${debtType==='payable'?'bg-red-100 text-red-700 border-red-300 shadow-inner scale-105':'bg-gray-50 text-gray-400 border-transparent'}`}>Mình nợ</button>
                                        <button onClick={()=>setDebtType('receivable')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl border transition-all ${debtType==='receivable'?'bg-blue-100 text-blue-700 border-blue-300 shadow-inner scale-105':'bg-gray-50 text-gray-400 border-transparent'}`}>Họ nợ</button>
                                    </div>
                                    <input type="text" value={debtName} onChange={e=>setDebtName(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black outline-none text-sm placeholder:text-gray-300" placeholder="TÊN NGƯỜI LIÊN QUAN..."/>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="text-[9px] text-gray-400 font-black uppercase block mb-1 tracking-widest pl-2">Tổng nợ</label>
                                            <input type="text" value={debtTotal} onChange={e=>handleAmountInput(e.target.value, setDebtTotal)} className={`w-full p-3 bg-gray-50 border-none rounded-xl font-black ${debtType==='payable' ? 'text-red-600' : 'text-blue-600'} outline-none text-lg`} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[9px] text-gray-400 font-black uppercase block mb-1 tracking-widest pl-2">Đã trả/thu</label>
                                            <input type="text" value={debtPaid} onChange={e=>handleAmountInput(e.target.value, setDebtPaid)} className="w-full p-3 bg-gray-50 border-none rounded-xl font-black text-gray-700 outline-none text-lg" />
                                        </div>
                                    </div>
                                    <input type="text" value={debtNote} onChange={e=>setDebtNote(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-medium outline-none text-sm placeholder:text-gray-300" placeholder="Ghi chú (tùy chọn)..."/>
                                    <div className="flex items-center gap-2 px-2">
                                        <input type="checkbox" checked={autoCreateTransaction} onChange={e=>setAutoCreateTransaction(e.target.checked)} id="autoSync" className="w-4 h-4 rounded-md accent-blue-600"/>
                                        <label htmlFor="autoSync" className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">Đồng bộ vào sổ thu chi</label>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={()=>setShowDebtForm(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl text-[10px] uppercase tracking-widest btn-effect">Hủy</button>
                                        <button onClick={handleSaveDebt} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-100 text-[10px] uppercase tracking-widest btn-effect">Lưu Sổ</button>
                                    </div>
                                </div>
                             )}
                        </div>
                    )}

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
                                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-50 shadow-inner">
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
                            {/* Heo Đất - Hiển thị tích lũy trọn đời (không reset theo tháng) */}
                            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                                    <h3 className="font-black text-gray-800 flex items-center gap-2 uppercase text-sm tracking-widest"><PiggyBank size={18} className="text-rose-500"/> Heo Đất Tiết Kiệm</h3>
                                    <button onClick={()=>setShowSavingForm(true)} className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter btn-effect shadow-md shadow-rose-200">Nạp Heo</button>
                                </div>
                                
                                <div className="text-center mb-8">
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tổng tích lũy</div>
                                    <div className="text-3xl font-black text-rose-600">{formatCurrency(totalAccumulatedSavings)} đ</div>
                                </div>

                                <div className="space-y-4">
                                    {savingsSummary.map((item) => (
                                        <div key={item.category} className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex justify-between items-center">
                                            <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight">{item.category}</span>
                                            <span className="font-black text-rose-600 text-sm">{formatCurrency(item.total)} đ</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-fadeIn mt-2 space-y-3">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex gap-3 items-center group focus-within:ring-2 ring-blue-500/10 transition-all">
                                <Search size={18} className="text-gray-300 group-focus-within:text-blue-500"/>
                                <input type="text" placeholder="Tìm kiếm giao dịch..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="flex-1 outline-none text-xs font-black uppercase tracking-widest placeholder:text-gray-200"/>
                            </div>
                            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                                {[...filteredIncomes.map(i=>({...i,type:'income'})), ...filteredExpenses.map(e=>({...e,type:'expense'}))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                                    <div key={item.id} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${item.type==='income'?'bg-green-50 text-green-600 shadow-green-100':'bg-red-50 text-red-600 shadow-red-100'}`}>
                                                {item.type==='income'?<TrendingUp size={22}/>:<TrendingDown size={22}/>}
                                            </div>
                                            <div className="max-w-[180px] overflow-hidden">
                                                <p className="font-black text-gray-800 text-[11px] truncate uppercase tracking-tight">{(item as any).source || (item as any).category}</p>
                                                {item.note && <p className="text-[10px] text-gray-500 font-medium truncate italic my-0.5">{item.note}</p>}
                                                <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest mt-0.5">{formatDate(item.date)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black text-[13px] ${item.type==='income'?'text-green-600':'text-red-600'}`}>{item.type==='income'?'+':'-'}{formatCurrency(item.amount)}</p>
                                            <button onClick={()=>deleteItem(item.id, item.type as any)} className="opacity-0 group-hover:opacity-100 text-[9px] text-red-400 font-black uppercase mt-1 tracking-widest transition-all">Xóa</button>
                                        </div>
                                    </div>
                                ))}
                                {(filteredIncomes.length === 0 && filteredExpenses.length === 0) && <div className="p-16 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.3em]">Lịch sử trống</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-fadeIn mt-2">
                            {/* SYNC STATUS / DEBUG INFO */}
                            {isConnected && (
                                <div className="bg-slate-800 p-6 rounded-[32px] text-white shadow-xl space-y-3">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Trạng thái Cloud</h4>
                                        <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-black">ACTIVE</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[9px] font-black">
                                            <span className="text-white/40 uppercase">Project ID:</span>
                                            <span className="text-white/80">{projectId}</span>
                                        </div>
                                        <div className="flex justify-between text-[9px] font-black">
                                            <span className="text-white/40 uppercase">Document:</span>
                                            <span className="text-white/80">{familyCode}</span>
                                        </div>
                                        <div className="flex justify-between text-[9px] font-black">
                                            <span className="text-white/40 uppercase">Máy chủ:</span>
                                            <span className="text-blue-300">Firestore Google</span>
                                        </div>
                                    </div>
                                    <button onClick={()=>window.location.reload()} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-white/10 transition-all flex items-center justify-center gap-2"><RefreshCw size={12}/> Buộc đồng bộ lại</button>
                                </div>
                            )}

                            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-black text-gray-800 border-b border-gray-50 pb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><SettingsIcon size={20} className="text-slate-500"/> Thiết lập hệ thống</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <button onClick={()=>setShowFixedConfig(true)} className="w-full p-4 bg-purple-50 text-purple-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm active:scale-95 transition-all">Chi Tiêu Cố Định <Clock size={18}/></button>
                                    <button onClick={handleExportExcel} className="w-full p-4 bg-green-50 text-green-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm active:scale-95 transition-all">Xuất Báo Cáo Excel <FileSpreadsheet size={18}/></button>
                                    <button onClick={()=>setShowCloudForm(true)} className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm active:scale-95 transition-all">Cấu Hình Đám Mây <Cloud size={18}/></button>
                                </div>
                                <div className="pt-6 border-t border-gray-50 text-center">
                                    <p className="text-[8px] text-gray-300 font-black uppercase tracking-[0.4em]">CashFlow v2.5 • Private Cloud</p>
                                </div>
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

                <div onClick={()=>setShowReloadConfirm(true)} className="fixed bottom-8 right-4 z-50">
                    <div className={`shadow-2xl rounded-[24px] px-6 py-4 flex items-center gap-4 border-2 border-white/40 transform active:scale-90 transition-all ring-8 ${balance>=0?'bg-gradient-to-r from-blue-700 to-indigo-600 ring-blue-500/10':'bg-gradient-to-r from-red-700 to-orange-600 ring-red-500/10'}`}>
                        <div className="bg-white/20 p-2 rounded-xl"><Wallet size={22} className="text-white"/></div>
                        <div className="flex flex-col items-start text-white font-black text-xl leading-none tracking-tight">{formatCurrency(balance)} đ</div>
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
                                    <select value={savingCategory} onChange={e=>setSavingCategory(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl text-xs font-black outline-none">
                                        {SAVING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 pl-2">Số tiền:</label>
                                        <input type="text" value={savingAmount} onChange={e=>handleAmountInput(e.target.value, setSavingAmount)} className="w-full p-3 bg-gray-50 border-none rounded-xl font-black text-lg text-rose-600 outline-none" placeholder="0 đ"/>
                                    </div>
                                    <div className="flex-1">
                                         <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 pl-2">Ngày:</label>
                                         <CustomDatePicker value={savingDate} onChange={e=>setSavingDate(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 pl-2">Ghi chú:</label>
                                    <input type="text" value={savingNote} onChange={e=>setSavingNote(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium outline-none" placeholder="Ví dụ: Tiền thưởng tết..."/>
                                </div>
                                <button onClick={handleAddSavings} className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-200 uppercase text-xs tracking-[0.2em] active:scale-95 transition-all mt-2">Xác Nhận Nạp</button>
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
                                    <input type="text" value={familyCode} onChange={e=>setFamilyCode(e.target.value.trim().toUpperCase())} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-black outline-none focus:border-blue-500 transition-all" placeholder="VÍ DỤ: GIADINH001" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-2">Firebase Config (Dán đúng JSON)</label>
                                    <textarea value={firebaseConfigStr} onChange={e=>setFirebaseConfigStr(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-[9px] h-40 outline-none resize-none font-mono focus:border-blue-500 transition-all" placeholder='{"apiKey": "...", "projectId": "...", ...}'></textarea>
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
                                }} className="w-full py-5 bg-blue-600 text-white font-black rounded-[24px] shadow-xl shadow-blue-100 uppercase text-xs tracking-[0.3em] active:scale-95 transition-all">Lưu & Kết Nối</button>
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
                                <button onClick={()=>window.location.reload()} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100">Đồng ý</button>
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
                                                    <div className={`w-2 h-8 rounded-full ${done ? 'bg-green-500' : 'bg-indigo-500'}`}></div>
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
                                                <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${done ? 'bg-green-500' : (progress > 80 ? 'bg-orange-500' : 'bg-indigo-500')}`} style={{width: `${progress}%`}}></div>
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
                                                            className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300" 
                                                            placeholder="Nhập số tiền..." 
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">VNĐ</div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleConfirmFixedItem(item, parseAmount(inp))} 
                                                        className="px-5 py-3 bg-indigo-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-indigo-200 uppercase tracking-widest active:scale-95 transition-all hover:bg-indigo-700"
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
                                        <input type="text" inputMode="numeric" value={tempFixedList[cat] ? formatCurrency(tempFixedList[cat]) : (fixedTemplate.find(f => f.category === cat)?.amount ? formatCurrency(fixedTemplate.find(f => f.category === cat)!.amount) : '')} onChange={(e) => handleAmountInput(e.target.value, (v)=>setTempFixedList(p=>({...p, [cat]: parseAmount(v)})))} className="w-24 p-2 bg-white border-2 border-transparent rounded-xl text-[11px] font-black text-right text-purple-700 outline-none focus:border-purple-300 transition-all" placeholder="0 đ"/>
                                    </div>
                                ))}
                            </div>
                            <button onClick={()=>{saveData(incomes, expenses, Object.entries(tempFixedList).filter(([,a])=>(a as number)>0).map(([c,a])=>({category:c, amount:a as number}))); setShowFixedConfig(false);}} className="w-full py-5 bg-slate-900 text-white font-black rounded-[24px] mt-8 uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-slate-200 active:scale-95 transition-all">Lưu Cấu Hình</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;

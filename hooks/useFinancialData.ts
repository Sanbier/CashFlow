
import { useState, useEffect, useRef } from 'react';
import { Income, Expense, Debt, FixedTemplateItem } from '../types';
import { DEFAULT_CATEGORIES, DEBT_CATEGORY_NAME } from '../constants';
import { getCombinedDate } from '../utils';

declare const firebase: any;

export const useFinancialData = (firebaseConfigStr: string, familyCode: string) => {
    // Data States
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [fixedTemplate, setFixedTemplate] = useState<FixedTemplateItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [fixedTracking, setFixedTracking] = useState<Record<string, string[]>>({});
    
    // Sync States
    const [isConnected, setIsConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [projectId, setProjectId] = useState<string>('');

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

                        // Update LocalStorage backup
                        localStorage.setItem('family_incomes', JSON.stringify(data.incomes || []));
                        localStorage.setItem('family_expenses', JSON.stringify(data.expenses || []));
                        localStorage.setItem('family_fixed_template', JSON.stringify(data.fixedTemplate || []));
                        localStorage.setItem('family_categories', JSON.stringify(data.categories || DEFAULT_CATEGORIES));
                        localStorage.setItem('family_debts', JSON.stringify(data.debts || []));
                        localStorage.setItem('family_fixed_tracking', JSON.stringify(data.fixedTracking || {}));
                        setSyncError(null);
                    } else { 
                        // First time sync: push local data to cloud
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

    // Core Save Function
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

    // Business Logic Handlers
    const addIncome = (source: string, amount: number, dateInput: string, note: string) => {
        const newItem: Income = { id: Date.now(), source, amount, date: getCombinedDate(dateInput), note };
        saveData([newItem, ...incomes], expenses);
    };

    const addExpense = (category: string, amount: number, dateInput: string, note: string, whoSpent: 'Ba' | 'Mẹ', selectedDebtorId: string) => {
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

    const updateDebts = (newDebts: Debt[] | null, newItem?: Debt, isEditId?: number | null, autoCreateTransaction: boolean = true) => {
        if (newDebts) {
            saveData(incomes, expenses, fixedTemplate, categories, newDebts);
            return;
        }

        if (newItem) {
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

    const addSavings = (category: string, amount: number, date: string, note: string) => {
        const newItem: Expense = {
            id: Date.now(),
            category: category,
            amount: amount,
            date: getCombinedDate(date),
            note: note
        };
        saveData(incomes, [newItem, ...expenses], fixedTemplate, categories, debts);
    };

    const updateCategories = (newCats: string[]) => {
        saveData(incomes, expenses, fixedTemplate, newCats);
    };

    const confirmFixedItem = (item: FixedTemplateItem, confirmedAmount: number, viewDate: Date) => {
        const newExpense: Expense = { id: Date.now(), category: item.category, amount: confirmedAmount, date: new Date().toISOString(), note: `Khoản chi cố định` };
        const newExpenses = [newExpense, ...expenses];
        const trackingKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;
        const currentTracking = fixedTracking[trackingKey] || [];
        const newTrackingList = currentTracking.includes(item.category) ? currentTracking : [...currentTracking, item.category];
        saveData(incomes, newExpenses, fixedTemplate, categories, debts, { ...fixedTracking, [trackingKey]: newTrackingList });
    };

    const saveFixedConfig = (newTemplate: FixedTemplateItem[]) => {
        saveData(incomes, expenses, newTemplate);
    };

    return {
        // Data
        incomes, expenses, debts, fixedTemplate, categories, fixedTracking,
        // Sync Status
        isConnected, isSyncing, syncError, projectId,
        // Actions
        addIncome, addExpense, updateDebts, deleteItem, updateNote, addSavings, updateCategories, confirmFixedItem, saveFixedConfig
    };
};
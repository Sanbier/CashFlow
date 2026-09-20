import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, Firestore, Unsubscribe } from 'firebase/firestore';
import { Income, Expense, Debt, FixedTemplateItem, FamilyCloudData, FirebaseConfig, UpdateDebtsHandler } from '../types';
import { DEFAULT_CATEGORIES, DEBT_CATEGORY_NAME } from '../constants';
import { getCombinedDate } from '../utils';
import { encryptCloudData, decryptCloudData } from '../crypto';

function mergeTransactions<T extends { id: number; date: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<number, T>();
  for (const item of remote) map.set(item.id, item);
  for (const item of local) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function mergeDebts(local: Debt[], remote: Debt[]): Debt[] {
  const map = new Map<number, Debt>();
  for (const item of remote) map.set(item.id, item);
  for (const item of local) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      const localTime = new Date(item.updatedAt || 0).getTime();
      const remoteTime = new Date(existing.updatedAt || 0).getTime();
      if (localTime > remoteTime) {
        map.set(item.id, item);
      }
    }
  }
  return Array.from(map.values());
}

function mergeCategories(local: string[], remote: string[]): string[] {
  return Array.from(new Set([...DEFAULT_CATEGORIES, ...local, ...remote]));
}

function mergeTracking(
  local: Record<string, string[]>,
  remote: Record<string, string[]>
): Record<string, string[]> {
  const keys = Array.from(new Set([...Object.keys(local), ...Object.keys(remote)]));
  const merged: Record<string, string[]> = {};
  for (const key of keys) {
    merged[key] = Array.from(new Set([...(local[key] || []), ...(remote[key] || [])]));
  }
  return merged;
}

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

  const dbRef = useRef<Firestore | null>(null);
  const passphraseRef = useRef<string>(localStorage.getItem('fb_passphrase') || '');

  // Local Storage Loader
  const loadLocal = useCallback(() => {
    try {
      const localIncomes: Income[] = JSON.parse(localStorage.getItem('family_incomes') || '[]');
      const localExpenses: Expense[] = JSON.parse(localStorage.getItem('family_expenses') || '[]');
      const localFixed: FixedTemplateItem[] = JSON.parse(localStorage.getItem('family_fixed_template') || '[]');
      const localFixedTracking: Record<string, string[]> = JSON.parse(localStorage.getItem('family_fixed_tracking') || '{}');
      const localCats: string[] = JSON.parse(localStorage.getItem('family_categories') || JSON.stringify(DEFAULT_CATEGORIES));
      const localDebts: Debt[] = JSON.parse(localStorage.getItem('family_debts') || '[]');

      setIncomes(localIncomes);
      setExpenses(localExpenses);
      setFixedTemplate(localFixed);
      setCategories(localCats);
      setDebts(localDebts);
      setFixedTracking(localFixedTracking);

      return {
        incomes: localIncomes,
        expenses: localExpenses,
        fixedTemplate: localFixed,
        categories: localCats,
        debts: localDebts,
        fixedTracking: localFixedTracking,
      };
    } catch {
      return {
        incomes: [],
        expenses: [],
        fixedTemplate: [],
        categories: DEFAULT_CATEGORIES,
        debts: [],
        fixedTracking: {},
      };
    }
  }, []);

  // Save to LocalStorage
  const persistLocal = useCallback((
    newIncomes: Income[],
    newExpenses: Expense[],
    newFixed: FixedTemplateItem[],
    newCats: string[],
    newDebts: Debt[],
    newTracking: Record<string, string[]>
  ) => {
    localStorage.setItem('family_incomes', JSON.stringify(newIncomes));
    localStorage.setItem('family_expenses', JSON.stringify(newExpenses));
    localStorage.setItem('family_fixed_template', JSON.stringify(newFixed));
    localStorage.setItem('family_categories', JSON.stringify(newCats));
    localStorage.setItem('family_debts', JSON.stringify(newDebts));
    localStorage.setItem('family_fixed_tracking', JSON.stringify(newTracking));
  }, []);

  // Sync to Cloud
  const syncToCloud = useCallback(async (payload: FamilyCloudData) => {
    if (!dbRef.current || !familyCode) return;

    try {
      setIsSyncing(true);
      const passphrase = passphraseRef.current.trim();
      let dataToSave: Record<string, unknown>;

      if (passphrase) {
        const encrypted = await encryptCloudData(payload, passphrase);
        dataToSave = {
          encrypted: true,
          cipherPayload: encrypted.cipherPayload,
          iv: encrypted.iv,
          salt: encrypted.salt,
          lastUpdate: payload.lastUpdate,
        };
      } else {
        dataToSave = {
          ...payload,
          encrypted: false,
        };
      }

      await setDoc(doc(dbRef.current, 'families', familyCode), dataToSave);
      setIsSyncing(false);
      setSyncError(null);
    } catch (err: unknown) {
      setIsSyncing(false);
      const msg = err instanceof Error ? err.message : 'Lỗi đồng bộ Firebase';
      setSyncError(msg);
    }
  }, [familyCode]);

  // Master Save Function
  const saveData = useCallback((
    newIncomes: Income[],
    newExpenses: Expense[],
    newFixed = fixedTemplate,
    newCats = categories,
    newDebts = debts,
    newTracking = fixedTracking
  ) => {
    setIncomes(newIncomes);
    setExpenses(newExpenses);
    setFixedTemplate(newFixed);
    setCategories(newCats);
    setDebts(newDebts);
    setFixedTracking(newTracking);

    persistLocal(newIncomes, newExpenses, newFixed, newCats, newDebts, newTracking);

    const payload: FamilyCloudData = {
      incomes: newIncomes,
      expenses: newExpenses,
      fixedTemplate: newFixed,
      categories: newCats,
      debts: newDebts,
      fixedTracking: newTracking,
      lastUpdate: new Date().toISOString(),
    };

    if (isConnected && dbRef.current && familyCode) {
      syncToCloud(payload);
    }
  }, [fixedTemplate, categories, debts, fixedTracking, persistLocal, isConnected, familyCode, syncToCloud]);

  // Firebase Realtime Listener Setup
  useEffect(() => {
    const localData = loadLocal();

    if (!firebaseConfigStr || !familyCode) {
      setIsConnected(false);
      dbRef.current = null;
      return;
    }

    let unsubscribe: Unsubscribe | null = null;

    try {
      const config: FirebaseConfig = JSON.parse(firebaseConfigStr);
      setProjectId(config.projectId || 'Unknown');

      const app: FirebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
      const db: Firestore = getFirestore(app);
      dbRef.current = db;

      setIsConnected(true);
      setIsSyncing(true);
      setSyncError(null);

      const docRef = doc(db, 'families', familyCode);
      unsubscribe = onSnapshot(
        docRef,
        async (snapshot) => {
          if (snapshot.exists()) {
            const rawData = snapshot.data();
            let resolvedData: FamilyCloudData;

            if (rawData.encrypted && rawData.cipherPayload) {
              const passphrase = passphraseRef.current.trim();
              if (!passphrase) {
                setSyncError('Dữ liệu đã được mã hóa. Vui lòng nhập Mã Bảo Mật trong Cấu hình Cloud.');
                setIsSyncing(false);
                return;
              }
              try {
                resolvedData = await decryptCloudData(
                  rawData.cipherPayload,
                  rawData.iv,
                  rawData.salt,
                  passphrase
                );
              } catch {
                setSyncError('Mã Bảo Mật không đúng! Không thể giải mã dữ liệu.');
                setIsSyncing(false);
                return;
              }
            } else {
              resolvedData = rawData as FamilyCloudData;
            }

            // Merge with local state to preserve any local edits
            const mergedIncomes = mergeTransactions(localData.incomes, resolvedData.incomes || []);
            const mergedExpenses = mergeTransactions(localData.expenses, resolvedData.expenses || []);
            const mergedDebts = mergeDebts(localData.debts, resolvedData.debts || []);
            const mergedCats = mergeCategories(localData.categories, resolvedData.categories || DEFAULT_CATEGORIES);
            const mergedFixed = resolvedData.fixedTemplate || localData.fixedTemplate;
            const mergedTracking = mergeTracking(localData.fixedTracking, resolvedData.fixedTracking || {});

            setIncomes(mergedIncomes);
            setExpenses(mergedExpenses);
            setDebts(mergedDebts);
            setCategories(mergedCats);
            setFixedTemplate(mergedFixed);
            setFixedTracking(mergedTracking);

            persistLocal(mergedIncomes, mergedExpenses, mergedFixed, mergedCats, mergedDebts, mergedTracking);
            setSyncError(null);
          } else {
            // First time sync: push existing local data to cloud
            if (localData.incomes.length > 0 || localData.expenses.length > 0 || localData.debts.length > 0) {
              const initialPayload: FamilyCloudData = {
                incomes: localData.incomes,
                expenses: localData.expenses,
                fixedTemplate: localData.fixedTemplate,
                categories: localData.categories,
                debts: localData.debts,
                fixedTracking: localData.fixedTracking,
                lastUpdate: new Date().toISOString(),
              };
              syncToCloud(initialPayload);
            }
          }
          setIsSyncing(false);
        },
        (error) => {
          console.error('Firebase Sync Error:', error);
          setIsConnected(false);
          setIsSyncing(false);
          setSyncError(error.message || 'Lỗi quyền truy cập Firebase');
        }
      );
    } catch {
      setIsConnected(false);
      setSyncError('Cấu hình JSON Firebase không hợp lệ');
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseConfigStr, familyCode, loadLocal, persistLocal, syncToCloud]);

  // Business Logic Handlers
  const addIncome = (source: string, amount: number, dateInput: string, note: string) => {
    const newItem: Income = { id: Date.now(), source, amount, date: getCombinedDate(dateInput), note };
    saveData([newItem, ...incomes], expenses);
  };

  const addExpense = (
    category: string,
    amount: number,
    dateInput: string,
    note: string,
    whoSpent: 'Ba' | 'Mẹ',
    selectedDebtorId: string
  ) => {
    let updatedDebts = debts;
    let finalNote = note;
    let linkedDebtId: number | null = null;
    let actionType: 'repay' | 'lend' | null = null;

    if (category === 'Cá Nhân (Ba-Mẹ)') {
      finalNote = `[${whoSpent}] ${note}`.trim();
    }

    if (category === DEBT_CATEGORY_NAME) {
      if (!selectedDebtorId) return;
      const debtItem = debts.find((d) => d.id === Number(selectedDebtorId));
      if (debtItem) {
        linkedDebtId = debtItem.id;
        if (debtItem.type === 'receivable') {
          const newPaid = debtItem.paid + amount;
          updatedDebts = debts.map((d) =>
            d.id === debtItem.id ? { ...d, paid: newPaid, updatedAt: new Date().toISOString() } : d
          );
          const newItem: Income = {
            id: Date.now(),
            source: `Thu nợ: ${debtItem.name}`,
            amount: amount,
            date: getCombinedDate(dateInput),
            note: `Nhận lại nợ: ${debtItem.name} ${note ? '- ' + note : ''}`,
            relatedDebtId: linkedDebtId,
            debtAction: 'collect',
          };
          saveData([newItem, ...incomes], expenses, fixedTemplate, categories, updatedDebts);
          return;
        } else {
          const newPaid = debtItem.paid + amount;
          updatedDebts = debts.map((d) =>
            d.id === debtItem.id ? { ...d, paid: newPaid, updatedAt: new Date().toISOString() } : d
          );
          finalNote = `Trả nợ: ${debtItem.name} ${note ? '- ' + note : ''}`;
          actionType = 'repay';
        }
      }
    }
    const newItem: Expense = {
      id: Date.now(),
      category: category,
      amount: amount,
      date: getCombinedDate(dateInput),
      note: finalNote,
      relatedDebtId: linkedDebtId,
      debtAction: actionType,
    };
    saveData(incomes, [newItem, ...expenses], fixedTemplate, categories, updatedDebts);
  };

  const updateDebts: UpdateDebtsHandler = (
    newDebts,
    newItem,
    isEditId,
    autoCreateTransaction = true
  ) => {
    if (newDebts) {
      saveData(incomes, expenses, fixedTemplate, categories, newDebts);
      return;
    }

    if (newItem) {
      const currentIncomes = [...incomes];
      const currentExpenses = [...expenses];

      if (autoCreateTransaction) {
        const old = isEditId ? debts.find((d) => d.id === isEditId) : null;
        const oldPaid = old ? old.paid : 0;
        const oldTotal = old ? old.total : 0;

        if (newItem.type === 'receivable') {
          if (newItem.total > oldTotal) {
            currentExpenses.unshift({
              id: Date.now(),
              category: DEBT_CATEGORY_NAME,
              amount: newItem.total - oldTotal,
              date: new Date().toISOString(),
              note: `Cho vay thêm: ${newItem.name}`,
              debtAction: 'lend',
            });
          }
          if (newItem.paid > oldPaid) {
            currentIncomes.unshift({
              id: Date.now() + 1,
              source: `Thu nợ: ${newItem.name}`,
              amount: newItem.paid - oldPaid,
              date: new Date().toISOString(),
              debtAction: 'collect',
            });
          }
        } else if (newItem.paid > oldPaid) {
          currentExpenses.unshift({
            id: Date.now(),
            category: DEBT_CATEGORY_NAME,
            amount: newItem.paid - oldPaid,
            date: new Date().toISOString(),
            note: `Trả nợ: ${newItem.name}`,
            debtAction: 'repay',
          });
        }
      }

      const finalDebts = isEditId
        ? debts.map((d) => (d.id === isEditId ? newItem : d))
        : [newItem, ...debts];
      saveData(currentIncomes, currentExpenses, fixedTemplate, categories, finalDebts);
    }
  };

  const deleteItem = (id: number, type: 'income' | 'expense') => {
    if (type === 'income') {
      saveData(incomes.filter((i) => i.id !== id), expenses);
    } else {
      saveData(incomes, expenses.filter((e) => e.id !== id));
    }
  };

  const updateNote = (id: number, type: 'income' | 'expense', newNote: string) => {
    if (type === 'income') {
      saveData(incomes.map((i) => (i.id === id ? { ...i, note: newNote } : i)), expenses);
    } else {
      saveData(incomes, expenses.map((e) => (e.id === id ? { ...e, note: newNote } : e)));
    }
  };

  const addSavings = (category: string, amount: number, date: string, note: string) => {
    const newItem: Expense = {
      id: Date.now(),
      category: category,
      amount: amount,
      date: getCombinedDate(date),
      note: note,
    };
    saveData(incomes, [newItem, ...expenses], fixedTemplate, categories, debts);
  };

  const updateCategories = (newCats: string[]) => {
    saveData(incomes, expenses, fixedTemplate, newCats);
  };

  const confirmFixedItem = (item: FixedTemplateItem, confirmedAmount: number, viewDate: Date) => {
    const newExpense: Expense = {
      id: Date.now(),
      category: item.category,
      amount: confirmedAmount,
      date: new Date().toISOString(),
      note: `Khoản chi cố định`,
    };
    const newExpenses = [newExpense, ...expenses];
    const trackingKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;
    const currentTracking = fixedTracking[trackingKey] || [];
    const newTrackingList = currentTracking.includes(item.category)
      ? currentTracking
      : [...currentTracking, item.category];
    saveData(incomes, newExpenses, fixedTemplate, categories, debts, {
      ...fixedTracking,
      [trackingKey]: newTrackingList,
    });
  };

  const saveFixedConfig = (newTemplate: FixedTemplateItem[]) => {
    saveData(incomes, expenses, newTemplate);
  };

  return {
    incomes,
    expenses,
    debts,
    fixedTemplate,
    categories,
    fixedTracking,
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
  };
};

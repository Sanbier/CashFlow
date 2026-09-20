import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, Firestore, Unsubscribe } from 'firebase/firestore';
import {
  Income,
  Expense,
  Debt,
  FixedTemplateItem,
  FamilyCloudData,
  FirebaseConfig,
  UpdateDebtsHandler,
  ChildEducationData,
  ChildEducationConfig,
  AttendanceStatus,
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEBT_CATEGORY_NAME,
  DEFAULT_EXCEL_BUDGETS,
  DEFAULT_CHILD_EDUCATION_DATA,
} from '../constants';
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
  if (remote && remote.length > 0) return remote;
  if (local && local.length > 0) return local;
  return [...DEFAULT_CATEGORIES];
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
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(DEFAULT_EXCEL_BUDGETS);
  const [childEducation, setChildEducation] = useState<ChildEducationData>(DEFAULT_CHILD_EDUCATION_DATA);
  const [initialYearBalance, setInitialYearBalance] = useState<Record<number, number>>({ 2026: 0 });

  // Sync States
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>('');

  const dbRef = useRef<Firestore | null>(null);
  const passphraseRef = useRef<string>(localStorage.getItem('fb_passphrase') || '');
  const isInitialSyncRef = useRef<boolean>(true);

  // Local Storage Loader
  const loadLocal = useCallback(() => {
    try {
      const localIncomes: Income[] = JSON.parse(localStorage.getItem('family_incomes') || '[]');
      const localExpenses: Expense[] = JSON.parse(localStorage.getItem('family_expenses') || '[]');
      const localFixed: FixedTemplateItem[] = JSON.parse(localStorage.getItem('family_fixed_template') || '[]');
      const localFixedTracking: Record<string, string[]> = JSON.parse(localStorage.getItem('family_fixed_tracking') || '{}');
      const localCats: string[] = JSON.parse(localStorage.getItem('family_categories') || JSON.stringify(DEFAULT_CATEGORIES));
      const localDebts: Debt[] = JSON.parse(localStorage.getItem('family_debts') || '[]');
      const localBudgets: Record<string, number> = JSON.parse(
        localStorage.getItem('family_category_budgets') || JSON.stringify(DEFAULT_EXCEL_BUDGETS)
      );
      const localChildEdu: ChildEducationData = JSON.parse(
        localStorage.getItem('family_child_education') || JSON.stringify(DEFAULT_CHILD_EDUCATION_DATA)
      );
      if (localChildEdu?.config?.monthlyAllowances) {
        localChildEdu.config.monthlyAllowances = localChildEdu.config.monthlyAllowances.filter(
          (item) => item.id !== 'an' && !item.name.toLowerCase().includes('tiền ăn')
        );
      }
      const localInitBalance: Record<number, number> = JSON.parse(
        localStorage.getItem('family_initial_year_balance') || '{"2026": 0}'
      );

      setIncomes(localIncomes);
      setExpenses(localExpenses);
      setFixedTemplate(localFixed);
      setCategories(localCats);
      setDebts(localDebts);
      setFixedTracking(localFixedTracking);
      setCategoryBudgets(localBudgets);
      setChildEducation(localChildEdu);
      setInitialYearBalance(localInitBalance);

      return {
        incomes: localIncomes,
        expenses: localExpenses,
        fixedTemplate: localFixed,
        categories: localCats,
        debts: localDebts,
        fixedTracking: localFixedTracking,
        categoryBudgets: localBudgets,
        childEducation: localChildEdu,
        initialYearBalance: localInitBalance,
      };
    } catch {
      return {
        incomes: [],
        expenses: [],
        fixedTemplate: [],
        categories: DEFAULT_CATEGORIES,
        debts: [],
        fixedTracking: {},
        categoryBudgets: DEFAULT_EXCEL_BUDGETS,
        childEducation: DEFAULT_CHILD_EDUCATION_DATA,
        initialYearBalance: { 2026: 0 },
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
    newTracking: Record<string, string[]>,
    newBudgets: Record<string, number>,
    newChildEdu: ChildEducationData,
    newInitBalance: Record<number, number>
  ) => {
    localStorage.setItem('family_incomes', JSON.stringify(newIncomes));
    localStorage.setItem('family_expenses', JSON.stringify(newExpenses));
    localStorage.setItem('family_fixed_template', JSON.stringify(newFixed));
    localStorage.setItem('family_categories', JSON.stringify(newCats));
    localStorage.setItem('family_debts', JSON.stringify(newDebts));
    localStorage.setItem('family_fixed_tracking', JSON.stringify(newTracking));
    localStorage.setItem('family_category_budgets', JSON.stringify(newBudgets));
    localStorage.setItem('family_child_education', JSON.stringify(newChildEdu));
    localStorage.setItem('family_initial_year_balance', JSON.stringify(newInitBalance));
  }, []);

  // Sync to Cloud
  const syncToCloud = useCallback(async (payload: FamilyCloudData) => {
    if (!dbRef.current || !familyCode) return;

    try {
      setIsSyncing(true);
      const passphrase = passphraseRef.current.trim();
      let dataToSave: Record<string, unknown>;

      // Deep sanitize payload: strip out any 'undefined' values which Firestore rejects
      const cleanPayload: FamilyCloudData = JSON.parse(JSON.stringify(payload));

      if (passphrase) {
        const encrypted = await encryptCloudData(cleanPayload, passphrase);
        dataToSave = {
          encrypted: true,
          cipherPayload: encrypted.cipherPayload,
          iv: encrypted.iv,
          salt: encrypted.salt,
          lastUpdate: cleanPayload.lastUpdate,
        };
      } else {
        dataToSave = {
          ...cleanPayload,
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
    newTracking = fixedTracking,
    newBudgets = categoryBudgets,
    newChildEdu = childEducation,
    newInitBalance = initialYearBalance
  ) => {
    setIncomes(newIncomes);
    setExpenses(newExpenses);
    setFixedTemplate(newFixed);
    setCategories(newCats);
    setDebts(newDebts);
    setFixedTracking(newTracking);
    setCategoryBudgets(newBudgets);
    setChildEducation(newChildEdu);
    setInitialYearBalance(newInitBalance);

    persistLocal(
      newIncomes,
      newExpenses,
      newFixed,
      newCats,
      newDebts,
      newTracking,
      newBudgets,
      newChildEdu,
      newInitBalance
    );

    const payload: FamilyCloudData = {
      incomes: newIncomes,
      expenses: newExpenses,
      fixedTemplate: newFixed,
      categories: newCats,
      debts: newDebts,
      fixedTracking: newTracking,
      categoryBudgets: newBudgets,
      childEducation: newChildEdu,
      initialYearBalance: newInitBalance,
      lastUpdate: new Date().toISOString(),
    };

    if (isConnected && dbRef.current && familyCode) {
      syncToCloud(payload);
    }
  }, [
    fixedTemplate,
    categories,
    debts,
    fixedTracking,
    categoryBudgets,
    childEducation,
    initialYearBalance,
    persistLocal,
    isConnected,
    familyCode,
    syncToCloud,
  ]);

  // Firebase Realtime Listener Setup
  useEffect(() => {
    isInitialSyncRef.current = true;
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
          // If this snapshot is our own pending local write, skip re-merging to prevent ghost resurrection
          if (snapshot.metadata.hasPendingWrites) {
            setIsSyncing(false);
            return;
          }

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

            if (isInitialSyncRef.current) {
              isInitialSyncRef.current = false;
              const currentLocal = loadLocal();

              // On initial sync, merge local with cloud
              const mergedIncomes = mergeTransactions(currentLocal.incomes, resolvedData.incomes || []);
              const mergedExpenses = mergeTransactions(currentLocal.expenses, resolvedData.expenses || []);
              const mergedDebts = mergeDebts(currentLocal.debts, resolvedData.debts || []);
              const mergedCats = resolvedData.categories && resolvedData.categories.length > 0
                ? resolvedData.categories
                : (currentLocal.categories && currentLocal.categories.length > 0 ? currentLocal.categories : DEFAULT_CATEGORIES);
              const mergedFixed = resolvedData.fixedTemplate || currentLocal.fixedTemplate;
              const mergedTracking = mergeTracking(currentLocal.fixedTracking, resolvedData.fixedTracking || {});
              const mergedBudgets = {
                ...DEFAULT_EXCEL_BUDGETS,
                ...(currentLocal.categoryBudgets || {}),
                ...(resolvedData.categoryBudgets || {}),
              };
              const mergedChildEdu: ChildEducationData = {
                config: {
                  ...DEFAULT_CHILD_EDUCATION_DATA.config,
                  ...(currentLocal.childEducation?.config || {}),
                  ...(resolvedData.childEducation?.config || {}),
                },
                attendance: {
                  ...(currentLocal.childEducation?.attendance || {}),
                  ...(resolvedData.childEducation?.attendance || {}),
                },
                payments: {
                  ...(currentLocal.childEducation?.payments || {}),
                  ...(resolvedData.childEducation?.payments || {}),
                },
              };
              if (mergedChildEdu?.config?.monthlyAllowances) {
                mergedChildEdu.config.monthlyAllowances = mergedChildEdu.config.monthlyAllowances.filter(
                  (item) => item.id !== 'an' && !item.name.toLowerCase().includes('tiền ăn')
                );
              }
              const mergedInitBalance = {
                ...currentLocal.initialYearBalance,
                ...(resolvedData.initialYearBalance || {}),
              };

              setIncomes(mergedIncomes);
              setExpenses(mergedExpenses);
              setDebts(mergedDebts);
              setCategories(mergedCats);
              setFixedTemplate(mergedFixed);
              setFixedTracking(mergedTracking);
              setCategoryBudgets(mergedBudgets);
              setChildEducation(mergedChildEdu);
              setInitialYearBalance(mergedInitBalance);

              persistLocal(
                mergedIncomes,
                mergedExpenses,
                mergedFixed,
                mergedCats,
                mergedDebts,
                mergedTracking,
                mergedBudgets,
                mergedChildEdu,
                mergedInitBalance
              );

              // If local had unsynced items not in cloud, push the merged state to cloud
              if (currentLocal.incomes.length > (resolvedData.incomes?.length || 0) ||
                  currentLocal.expenses.length > (resolvedData.expenses?.length || 0)) {
                syncToCloud({
                  incomes: mergedIncomes,
                  expenses: mergedExpenses,
                  fixedTemplate: mergedFixed,
                  categories: mergedCats,
                  debts: mergedDebts,
                  fixedTracking: mergedTracking,
                  categoryBudgets: mergedBudgets,
                  childEducation: mergedChildEdu,
                  initialYearBalance: mergedInitBalance,
                  lastUpdate: new Date().toISOString(),
                });
              }
            } else {
              // Remote server update: authoritative state replaces local without resurrecting deleted items
              const newIncomes = resolvedData.incomes || [];
              const newExpenses = resolvedData.expenses || [];
              const newDebts = resolvedData.debts || [];
              const newCats = resolvedData.categories && resolvedData.categories.length > 0
                ? resolvedData.categories
                : DEFAULT_CATEGORIES;
              const newFixed = resolvedData.fixedTemplate || [];
              const newTracking = resolvedData.fixedTracking || {};
              const newBudgets = {
                ...DEFAULT_EXCEL_BUDGETS,
                ...(resolvedData.categoryBudgets || {}),
              };
              const newChildEdu: ChildEducationData = {
                config: {
                  ...DEFAULT_CHILD_EDUCATION_DATA.config,
                  ...(resolvedData.childEducation?.config || {}),
                },
                attendance: {
                  ...(resolvedData.childEducation?.attendance || {}),
                },
                payments: {
                  ...(resolvedData.childEducation?.payments || {}),
                },
              };
              if (newChildEdu?.config?.monthlyAllowances) {
                newChildEdu.config.monthlyAllowances = newChildEdu.config.monthlyAllowances.filter(
                  (item) => item.id !== 'an' && !item.name.toLowerCase().includes('tiền ăn')
                );
              }
              const newInitBalance = resolvedData.initialYearBalance || { 2026: 0 };

              setIncomes(newIncomes);
              setExpenses(newExpenses);
              setDebts(newDebts);
              setCategories(newCats);
              setFixedTemplate(newFixed);
              setFixedTracking(newTracking);
              setCategoryBudgets(newBudgets);
              setChildEducation(newChildEdu);
              setInitialYearBalance(newInitBalance);

              persistLocal(
                newIncomes,
                newExpenses,
                newFixed,
                newCats,
                newDebts,
                newTracking,
                newBudgets,
                newChildEdu,
                newInitBalance
              );
            }
            setSyncError(null);
          } else {
            // First time sync: push existing local data to cloud
            isInitialSyncRef.current = false;
            if (localData.incomes.length > 0 || localData.expenses.length > 0 || localData.debts.length > 0) {
              const initialPayload: FamilyCloudData = {
                incomes: localData.incomes,
                expenses: localData.expenses,
                fixedTemplate: localData.fixedTemplate,
                categories: localData.categories,
                debts: localData.debts,
                fixedTracking: localData.fixedTracking,
                categoryBudgets: localData.categoryBudgets,
                childEducation: localData.childEducation,
                initialYearBalance: localData.initialYearBalance,
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
  const addIncome = (
    source: string,
    amount: number,
    dateInput: string,
    note: string,
    incomeType?: 'salary' | 'loan' | 'other'
  ) => {
    // Detect type if not provided
    let detectedType = incomeType;
    if (!detectedType) {
      const lowerSource = source.toLowerCase();
      if (lowerSource.includes('lương')) detectedType = 'salary';
      else if (lowerSource.includes('mượn') || lowerSource.includes('vay')) detectedType = 'loan';
      else detectedType = 'other';
    }

    const newItem: Income = {
      id: Date.now(),
      source,
      amount,
      date: getCombinedDate(dateInput),
      note,
      incomeType: detectedType,
    };
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

    if (category === 'Cá nhân' || category === 'Cá Nhân (Ba-Mẹ)') {
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
            incomeType: 'other',
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
              incomeType: 'other',
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
    let updatedDebts = debts;

    if (type === 'income') {
      const itemToDelete = incomes.find((i) => i.id === id);
      if (itemToDelete?.relatedDebtId && itemToDelete.debtAction === 'collect') {
        updatedDebts = debts.map((d) =>
          d.id === itemToDelete.relatedDebtId
            ? { ...d, paid: Math.max(0, d.paid - itemToDelete.amount), updatedAt: new Date().toISOString() }
            : d
        );
      }
      saveData(
        incomes.filter((i) => i.id !== id),
        expenses,
        fixedTemplate,
        categories,
        updatedDebts
      );
    } else {
      const itemToDelete = expenses.find((e) => e.id === id);
      if (itemToDelete?.relatedDebtId) {
        if (itemToDelete.debtAction === 'repay') {
          updatedDebts = debts.map((d) =>
            d.id === itemToDelete.relatedDebtId
              ? { ...d, paid: Math.max(0, d.paid - itemToDelete.amount), updatedAt: new Date().toISOString() }
              : d
          );
        } else if (itemToDelete.debtAction === 'lend') {
          updatedDebts = debts.map((d) =>
            d.id === itemToDelete.relatedDebtId
              ? { ...d, total: Math.max(0, d.total - itemToDelete.amount), updatedAt: new Date().toISOString() }
              : d
          );
        }
      }
      saveData(
        incomes,
        expenses.filter((e) => e.id !== id),
        fixedTemplate,
        categories,
        updatedDebts
      );
    }
  };

  const updateTransaction = (
    id: number,
    type: 'income' | 'expense',
    updates: {
      amount?: number;
      note?: string;
      date?: string;
      categoryOrSource?: string;
    }
  ) => {
    let updatedDebts = debts;

    if (type === 'income') {
      const oldItem = incomes.find((i) => i.id === id);
      if (!oldItem) return;

      const newAmount = updates.amount !== undefined ? updates.amount : oldItem.amount;
      const diff = newAmount - oldItem.amount;

      if (oldItem.relatedDebtId && oldItem.debtAction === 'collect' && diff !== 0) {
        updatedDebts = debts.map((d) =>
          d.id === oldItem.relatedDebtId
            ? { ...d, paid: Math.max(0, d.paid + diff), updatedAt: new Date().toISOString() }
            : d
        );
      }

      const updatedIncomes = incomes.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          amount: newAmount,
          note: updates.note !== undefined ? updates.note : item.note,
          date: updates.date !== undefined ? updates.date : item.date,
          source: updates.categoryOrSource !== undefined ? updates.categoryOrSource : item.source,
        };
      });

      saveData(updatedIncomes, expenses, fixedTemplate, categories, updatedDebts);
    } else {
      const oldItem = expenses.find((e) => e.id === id);
      if (!oldItem) return;

      const newAmount = updates.amount !== undefined ? updates.amount : oldItem.amount;
      const diff = newAmount - oldItem.amount;

      if (oldItem.relatedDebtId && diff !== 0) {
        if (oldItem.debtAction === 'repay') {
          updatedDebts = debts.map((d) =>
            d.id === oldItem.relatedDebtId
              ? { ...d, paid: Math.max(0, d.paid + diff), updatedAt: new Date().toISOString() }
              : d
          );
        } else if (oldItem.debtAction === 'lend') {
          updatedDebts = debts.map((d) =>
            d.id === oldItem.relatedDebtId
              ? { ...d, total: Math.max(0, d.total + diff), updatedAt: new Date().toISOString() }
              : d
          );
        }
      }

      const updatedExpenses = expenses.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          amount: newAmount,
          note: updates.note !== undefined ? updates.note : item.note,
          date: updates.date !== undefined ? updates.date : item.date,
          category: updates.categoryOrSource !== undefined ? updates.categoryOrSource : item.category,
        };
      });

      saveData(incomes, updatedExpenses, fixedTemplate, categories, updatedDebts);
    }
  };

  const updateNote = (id: number, type: 'income' | 'expense', newNote: string) => {
    updateTransaction(id, type, { note: newNote });
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
    saveData(
      incomes,
      newExpenses,
      fixedTemplate,
      categories,
      debts,
      {
        ...fixedTracking,
        [trackingKey]: newTrackingList,
      },
      categoryBudgets,
      childEducation,
      initialYearBalance
    );
  };

  const saveFixedConfig = (newTemplate: FixedTemplateItem[]) => {
    saveData(incomes, expenses, newTemplate);
  };

  // Excel Sheet 1: Update Category Budgets
  const updateCategoryBudgets = (newBudgets: Record<string, number>) => {
    saveData(
      incomes,
      expenses,
      fixedTemplate,
      categories,
      debts,
      fixedTracking,
      newBudgets,
      childEducation,
      initialYearBalance
    );
  };

  // Excel Sheet 3: Toggle Attendance for Child (key: "YYYY-MM-DD")
  const toggleChildAttendance = (dateStr: string, currentStatus?: AttendanceStatus, note?: string) => {
    const nextStatus: AttendanceStatus = currentStatus === 'hoc' ? 'nghi' : 'hoc';
    const existingNote = childEducation.attendance[dateStr]?.note;
    const resolvedNote = note !== undefined ? note : (existingNote || '');

    const newAttendance = {
      ...childEducation.attendance,
      [dateStr]: {
        status: nextStatus,
        note: resolvedNote,
      },
    };
    const newChildEdu: ChildEducationData = {
      ...childEducation,
      attendance: newAttendance,
    };
    saveData(
      incomes,
      expenses,
      fixedTemplate,
      categories,
      debts,
      fixedTracking,
      categoryBudgets,
      newChildEdu,
      initialYearBalance
    );
  };

  const updateChildEducationConfig = (newConfig: ChildEducationConfig) => {
    const newChildEdu: ChildEducationData = {
      ...childEducation,
      config: newConfig,
    };
    saveData(
      incomes,
      expenses,
      fixedTemplate,
      categories,
      debts,
      fixedTracking,
      categoryBudgets,
      newChildEdu,
      initialYearBalance
    );
  };

  const updateChildPayment = (
    month: number,
    year: number,
    actualPaid: number,
    calculatedFee: number,
    note?: string
  ) => {
    const paymentKey = `${year}-${month}`;
    let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (actualPaid >= calculatedFee && calculatedFee > 0) {
      status = 'paid';
    } else if (actualPaid > 0) {
      status = 'partial';
    }

    const newPayments = {
      ...childEducation.payments,
      [paymentKey]: {
        month,
        year,
        calculatedFee,
        actualPaid,
        status,
        note: note || '',
      },
    };
    const newChildEdu: ChildEducationData = {
      ...childEducation,
      payments: newPayments,
    };
    saveData(
      incomes,
      expenses,
      fixedTemplate,
      categories,
      debts,
      fixedTracking,
      categoryBudgets,
      newChildEdu,
      initialYearBalance
    );
  };

  // 1-Click Sync Child Fee to Expense ("Con cái")
  const syncChildFeeToExpense = (month: number, year: number, calculatedFee: number) => {
    // Check if there is already an expense recorded for child education in this month
    const existingExpense = expenses.find((e) => {
      if (e.category !== 'Con cái') return false;
      const d = new Date(e.date);
      return (
        d.getFullYear() === year &&
        d.getMonth() + 1 === month &&
        (e.note?.includes('Tiền học con') || e.note?.includes('Học phí'))
      );
    });

    let updatedExpenses: Expense[];
    if (existingExpense) {
      updatedExpenses = expenses.map((e) =>
        e.id === existingExpense.id
          ? {
              ...e,
              amount: calculatedFee,
              note: `Tiền học con T${month}/${year} (Đồng bộ tự động)`,
            }
          : e
      );
    } else {
      const newExpense: Expense = {
        id: Date.now(),
        category: 'Con cái',
        amount: calculatedFee,
        date: new Date(year, month - 1, 10).toISOString(), // ghi vào ngày 10 của tháng
        note: `Tiền học con T${month}/${year} (Đồng bộ tự động)`,
      };
      updatedExpenses = [newExpense, ...expenses];
    }

    // Also update payment record status to 'paid' if amount matches
    const paymentKey = `${year}-${month}`;
    const existingPayment = childEducation.payments[paymentKey];
    const newPayments = {
      ...childEducation.payments,
      [paymentKey]: {
        month,
        year,
        calculatedFee,
        actualPaid: calculatedFee,
        status: 'paid' as const,
        note: existingPayment?.note || 'Đã đồng bộ vào sổ chi tiêu',
      },
    };
    const newChildEdu: ChildEducationData = {
      ...childEducation,
      payments: newPayments,
    };

    saveData(
      incomes,
      updatedExpenses,
      fixedTemplate,
      categories,
      debts,
      fixedTracking,
      categoryBudgets,
      newChildEdu,
      initialYearBalance
    );
  };

  // Excel Sheet 2: Initial Year Balance (e.g. 2026 starting rollover)
  const updateInitialYearBalance = (year: number, amount: number) => {
    const newBalances = {
      ...initialYearBalance,
      [year]: amount,
    };
    saveData(
      incomes,
      expenses,
      fixedTemplate,
      categories,
      debts,
      fixedTracking,
      categoryBudgets,
      childEducation,
      newBalances
    );
  };

  return {
    incomes,
    expenses,
    debts,
    fixedTemplate,
    categories,
    fixedTracking,
    categoryBudgets,
    childEducation,
    initialYearBalance,
    isConnected,
    isSyncing,
    syncError,
    projectId,
    addIncome,
    addExpense,
    updateDebts,
    deleteItem,
    updateNote,
    updateTransaction,
    updateCategories,
    confirmFixedItem,
    saveFixedConfig,
    updateCategoryBudgets,
    toggleChildAttendance,
    updateChildEducationConfig,
    updateChildPayment,
    syncChildFeeToExpense,
    updateInitialYearBalance,
  };
};

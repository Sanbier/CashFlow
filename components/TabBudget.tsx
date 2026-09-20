import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Users,
  SettingsIcon,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Check,
  History,
  CalendarIcon,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  RefreshCw,
  Wallet,
} from '../constants';
import { CORE_EXPENSE_CATEGORIES, CORE_SAVING_CATEGORY, DEFAULT_EXCEL_BUDGETS } from '../constants';
import { Expense, Income, Debt, UpdateDebtsHandler, MonthCashFlowRow } from '../types';
import { formatCurrency, handleAmountInput, handleTextInput, parseAmount } from '../utils';
import { ModalBudgetConfig } from './modals/ModalBudgetConfig';
import ModalPortal from './common/ModalPortal';

interface TabBudgetProps {
  viewDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  monthCashFlow: MonthCashFlowRow;
  incomes: Income[];
  expenses: Expense[];
  debts: Debt[];
  categoryBudgets: Record<string, number>;
  onUpdateCategoryBudgets: (budgets: Record<string, number>) => void;
  onUpdateDebts: UpdateDebtsHandler;
  autoCreateTransaction: boolean;
  setAutoCreateTransaction: (v: boolean) => void;
}

const TabBudget: React.FC<TabBudgetProps> = ({
  viewDate,
  onPrevMonth,
  onNextMonth,
  monthCashFlow,
  incomes,
  expenses,
  debts,
  categoryBudgets,
  onUpdateCategoryBudgets,
  onUpdateDebts,
  autoCreateTransaction,
  setAutoCreateTransaction,
}) => {
  // Current view month & year strictly synchronized with global viewDate
  const selectedMonth = viewDate.getMonth() + 1;
  const selectedYear = viewDate.getFullYear();

  // Budget Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Debt UI States
  const [activeDebtTab, setActiveDebtTab] = useState<'payable' | 'receivable'>('payable');
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [isEditingDebt, setIsEditingDebt] = useState<number | null>(null);
  const [expandedDebtIds, setExpandedDebtIds] = useState<number[]>([]);
  const [showDoneDebts, setShowDoneDebts] = useState(false);

  // Debt Form States
  const [debtName, setDebtName] = useState('');
  const [debtTotal, setDebtTotal] = useState('');
  const [debtPaid, setDebtPaid] = useState('');
  const [debtMonthlyQuota, setDebtMonthlyQuota] = useState('');
  const [debtDeadline, setDebtDeadline] = useState('');
  const [debtNote, setDebtNote] = useState('');
  const [debtType, setDebtType] = useState<'payable' | 'receivable'>('payable');

  // Filter transactions strictly for the active calendar month & year
  const monthIncomes = useMemo(() => {
    return incomes.filter((item) => {
      const d = new Date(item.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [incomes, selectedMonth, selectedYear]);

  const monthExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const d = new Date(item.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  // Compute spending per category
  const categorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of monthExpenses) {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    }
    return map;
  }, [monthExpenses]);

  // All 9 Core categories + Tiết kiệm
  const allCategories = useMemo(() => {
    return [...CORE_EXPENSE_CATEGORIES, CORE_SAVING_CATEGORY];
  }, []);

  const totalMonthlyBudget = useMemo(() => {
    return allCategories.reduce(
      (sum, cat) => sum + (categoryBudgets[cat] ?? DEFAULT_EXCEL_BUDGETS[cat] ?? 0),
      0
    );
  }, [allCategories, categoryBudgets]);

  // Debt KPIs matching Sheet 1
  const payableDebts = useMemo(() => debts.filter((d) => d.type === 'payable'), [debts]);
  const receivableDebts = useMemo(() => debts.filter((d) => d.type === 'receivable'), [debts]);

  const currentDebtList = activeDebtTab === 'payable' ? payableDebts : receivableDebts;
  const activeDebts = currentDebtList.filter((d) => d.total - d.paid > 0);
  const doneDebts = currentDebtList.filter((d) => d.total - d.paid <= 0);

  const debtKpiRemaining = useMemo(() => {
    return payableDebts.reduce((sum, d) => sum + Math.max(0, d.total - d.paid), 0);
  }, [payableDebts]);

  const debtKpiTotalPaid = useMemo(() => {
    return payableDebts.reduce((sum, d) => sum + d.paid, 0);
  }, [payableDebts]);

  const debtKpiMonthlyQuota = useMemo(() => {
    return payableDebts.reduce((sum, d) => {
      const remaining = Math.max(0, d.total - d.paid);
      if (remaining <= 0) return sum;
      return sum + (d.monthlyQuota || 0);
    }, 0);
  }, [payableDebts]);

  const debtKpiActiveCount = useMemo(() => {
    return payableDebts.filter((d) => d.total - d.paid > 0).length;
  }, [payableDebts]);

  const handleOpenEditDebt = (item: Debt) => {
    setIsEditingDebt(item.id);
    setDebtName(item.name);
    setDebtTotal(item.total.toLocaleString('vi-VN'));
    setDebtPaid(item.paid.toLocaleString('vi-VN'));
    setDebtMonthlyQuota((item.monthlyQuota || 0).toLocaleString('vi-VN'));
    setDebtDeadline(item.deadline || '');
    setDebtNote(item.note || '');
    setDebtType(item.type);
    setShowDebtForm(true);
  };

  const handleSaveDebt = () => {
    const total = parseAmount(debtTotal);
    const paid = parseAmount(debtPaid);
    const quota = parseAmount(debtMonthlyQuota);

    if (!debtName.trim() || total <= 0) {
      alert('Vui lòng nhập tên và tổng tiền nợ hợp lệ.');
      return;
    }

    const newItem: Debt = {
      id: isEditingDebt || Date.now(),
      name: debtName.trim(),
      total,
      paid,
      monthlyQuota: quota > 0 ? quota : undefined,
      deadline: debtDeadline.trim() || undefined,
      note: debtNote.trim() || undefined,
      type: debtType,
      updatedAt: new Date().toISOString(),
    };

    onUpdateDebts(null, newItem, isEditingDebt, autoCreateTransaction);
    setShowDebtForm(false);
    setIsEditingDebt(null);
    setDebtName('');
    setDebtTotal('');
    setDebtPaid('');
    setDebtMonthlyQuota('');
    setDebtDeadline('');
    setDebtNote('');
  };

  const toggleDebtExpansion = (id: number) => {
    setExpandedDebtIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const prevMonthNum = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const nextMonthNum = selectedMonth === 12 ? 1 : selectedMonth + 1;

  return (
    <div className="space-y-4 animate-fadeIn pb-16 pt-1">
      {/* Month Navigation Header (Synchronized globally) */}
      <div className="glass-panel p-3.5 rounded-[28px] border border-white/60 flex items-center justify-between shadow-sm">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-2xl bg-white/50 hover:bg-white text-slate-600 transition-all active:scale-95 shadow-sm"
          title="Tháng trước"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
            <CalendarIcon size={14} className="text-blue-600" />
            Tháng {selectedMonth} / {selectedYear}
          </div>
          <p className="text-[9px] font-bold text-slate-400">Sheet 1: Chi Phí Sinh Hoạt</p>
        </div>

        <button
          onClick={onNextMonth}
          className="p-2 rounded-2xl bg-white/50 hover:bg-white text-slate-600 transition-all active:scale-95 shadow-sm"
          title="Tháng sau"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Sheet 1 & Sheet 2 Exact Rollover Linkage Card */}
      <div className="glass-panel p-4 rounded-[28px] border border-white/60 shadow-lg relative overflow-hidden space-y-3">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-300/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 relative z-10">
          <div className="flex items-center gap-1.5">
            <Wallet size={14} className="text-indigo-600" />
            <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
              Dòng Tiền Liên Tháng (Sheet 1 ↔ Sheet 2)
            </span>
          </div>
          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
            Công thức chuẩn Excel
          </span>
        </div>

        {/* 2-Tier Rollover Flow */}
        <div className="grid grid-cols-2 gap-2 relative z-10">
          {/* 1. Số Dư Đầu Tháng (Từ tháng trước chuyển sang) */}
          <div className="p-2.5 rounded-2xl bg-blue-50/80 border border-blue-200/80">
            <div className="flex items-center justify-between text-[8px] font-black uppercase text-blue-700 tracking-wider">
              <span className="flex items-center gap-1">
                <RefreshCw size={9} /> Số Dư Đầu T{selectedMonth}
              </span>
              <span className="text-[7px] text-blue-500 font-bold">Từ T{prevMonthNum}</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-blue-900 mt-1 truncate">
              {formatCurrency(monthCashFlow.startingBalance)}
            </div>
            <div className="text-[7px] text-blue-600/80 font-medium mt-0.5">
              = Số dư cuối Tháng {prevMonthNum}
            </div>
          </div>

          {/* 2. Thu Nhập Mới Tháng Này */}
          <div className="p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
            <div className="flex items-center justify-between text-[8px] font-black uppercase text-emerald-700 tracking-wider">
              <span className="flex items-center gap-1">
                <TrendingUp size={9} /> Thu Mới T{selectedMonth}
              </span>
              <span className="text-[7px] text-emerald-500 font-bold">Phát sinh</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-900 mt-1 truncate">
              {formatCurrency(monthCashFlow.totalNewIncome)}
            </div>
            <div className="text-[7px] text-emerald-600/80 font-medium mt-0.5 truncate">
              Lương: {formatCurrency(monthCashFlow.salaryIncome)}
            </div>
          </div>
        </div>

        {/* 3 Main KPI Row (E10, L149, G10) */}
        <div className="grid grid-cols-3 gap-2 text-center relative z-10 pt-1">
          {/* Ô E10: Tổng Thu Sẵn Có */}
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="text-[8px] font-black uppercase text-indigo-700 tracking-wider">
              Tổng Thu (Ô E10)
            </div>
            <div className="text-xs sm:text-sm font-black text-indigo-800 mt-1 truncate">
              {formatCurrency(monthCashFlow.totalIncome)}
            </div>
            <div className="text-[7px] text-indigo-500 font-bold mt-0.5">= S.Dư + Thu mới</div>
          </div>

          {/* Ô L149: Tổng Chi Thực Tế */}
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <div className="text-[8px] font-black uppercase text-rose-700 tracking-wider">
              Tổng Chi (Ô L149)
            </div>
            <div className="text-xs sm:text-sm font-black text-rose-800 mt-1 truncate">
              {formatCurrency(monthCashFlow.totalExpense)}
            </div>
            <div className="text-[7px] text-rose-500 font-bold mt-0.5">Sinh hoạt + T.Luỹ</div>
          </div>

          {/* Ô G10: Số Dư Cuối Tháng Chuyển Sang Tháng Sau */}
          <div
            className={`p-2.5 rounded-2xl border ${
              monthCashFlow.closingBalance >= 0
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-800'
            }`}
          >
            <div className="text-[8px] font-black uppercase tracking-wider">
              Còn Lại (Ô G10)
            </div>
            <div className="text-xs sm:text-sm font-black mt-1 truncate">
              {formatCurrency(monthCashFlow.closingBalance)}
            </div>
            <div className="text-[7px] font-bold mt-0.5 opacity-80">
              Chuyển sang T{nextMonthNum}
            </div>
          </div>
        </div>

        {/* Status Tag with Rollover Explanation */}
        <div className="pt-1 text-center relative z-10">
          <span
            className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wide shadow-sm ${
              monthCashFlow.netBalance < 0
                ? 'bg-rose-500 text-white animate-pulse'
                : monthCashFlow.netBalance > 0
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-500 text-white'
            }`}
          >
            {monthCashFlow.netBalance < 0
              ? `⚠ CHI VƯỢT THU MỚI ${formatCurrency(Math.abs(monthCashFlow.netBalance))}`
              : monthCashFlow.netBalance > 0
              ? `DƯ THU MỚI ${formatCurrency(monthCashFlow.netBalance)}`
              : 'THU CHI CÂN BẰNG'}
          </span>
          <p className="text-[8px] font-bold text-slate-400 mt-1">
            Số dư {formatCurrency(monthCashFlow.closingBalance)} sẽ tự động làm số dư đầu Tháng {nextMonthNum}
          </p>
        </div>
      </div>

      {/* 9 Core Categories + 1 Saving Tracker */}
      <div className="glass-panel p-4 rounded-[28px] border border-white/60 shadow-sm space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
          <div>
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <PieChart size={15} className="text-blue-600" />
              Định Mức Ngân Sách Sinh Hoạt
            </h3>
            <p className="text-[9px] font-bold text-slate-400">
              Tổng định mức: {formatCurrency(totalMonthlyBudget)}
            </p>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/70 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
            title="Tùy chỉnh định mức"
          >
            <SettingsIcon size={13} />
            Định Mức
          </button>
        </div>

        {/* Category List */}
        <div className="space-y-3 pt-1">
          {allCategories.map((cat) => {
            const budget = categoryBudgets[cat] ?? DEFAULT_EXCEL_BUDGETS[cat] ?? 0;
            const spent = categorySpentMap[cat] || 0;
            const remaining = budget - spent;
            const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
            const isOver = remaining < 0;
            const isSaving = cat === CORE_SAVING_CATEGORY;

            // Excel Status Formula
            let statusText = 'CÂN BẰNG';
            let badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';

            if (remaining < 0) {
              statusText = `⚠VƯỢT NGÂN SÁCH ${formatCurrency(Math.abs(remaining))}`;
              badgeStyle = 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse';
            } else if (remaining > 0) {
              statusText = `DƯ ${formatCurrency(remaining)}`;
              badgeStyle = isSaving
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';
            }

            const progressBarColor = isOver
              ? 'bg-gradient-to-r from-amber-500 to-rose-600'
              : isSaving
              ? 'bg-gradient-to-r from-teal-400 to-emerald-500'
              : percentage >= 85
              ? 'bg-gradient-to-r from-amber-400 to-amber-600'
              : 'bg-gradient-to-r from-blue-400 to-indigo-500';

            return (
              <div
                key={cat}
                className={`p-3 rounded-2xl border transition-all ${
                  isOver
                    ? 'bg-rose-50/40 border-rose-200'
                    : isSaving
                    ? 'bg-emerald-50/30 border-emerald-200/80'
                    : 'bg-white/40 border-white/60 hover:bg-white/70'
                }`}
              >
                {/* Header row */}
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-xs uppercase tracking-tight text-slate-800 flex items-center gap-1.5">
                    {isSaving && <PiggyBank size={13} className="text-emerald-600" />}
                    {cat}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                    {statusText}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden my-1.5 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                {/* Metric footer */}
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                  <span>
                    Đã chi: <strong className="text-slate-800">{formatCurrency(spent)}</strong>
                  </span>
                  <span>
                    Định mức: <strong className="text-slate-800">{formatCurrency(budget)}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integrated Section: THEO DÕI NỢ (Excel Sheet 1) */}
      <div className="glass-panel p-4 rounded-[28px] border border-white/60 shadow-sm space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
          <div>
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Users size={15} className="text-indigo-600" />
              Sổ Theo Dõi Nợ & Trả Góp
            </h3>
            <p className="text-[9px] font-bold text-slate-400">Sheet 1: Quản lý nợ & Hạn trả</p>
          </div>
          <button
            onClick={() => {
              setIsEditingDebt(null);
              setDebtName('');
              setDebtTotal('');
              setDebtPaid('');
              setDebtMonthlyQuota('');
              setDebtDeadline('');
              setDebtNote('');
              setShowDebtForm(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus size={13} /> Thêm Nợ
          </button>
        </div>

        {/* 4 KPIs Cards (Sheet 1) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800">
            <div className="text-[8px] font-black uppercase tracking-wider opacity-70">
              Tổng Nợ Còn Lại
            </div>
            <div className="text-xs sm:text-sm font-black mt-1 truncate">
              {formatCurrency(debtKpiRemaining)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800">
            <div className="text-[8px] font-black uppercase tracking-wider opacity-70">
              Đã Trả Tổng
            </div>
            <div className="text-xs sm:text-sm font-black mt-1 truncate">
              {formatCurrency(debtKpiTotalPaid)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800">
            <div className="text-[8px] font-black uppercase tracking-wider opacity-70">
              Phải Trả / Tháng
            </div>
            <div className="text-xs sm:text-sm font-black mt-1 truncate">
              {formatCurrency(debtKpiMonthlyQuota)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-800">
            <div className="text-[8px] font-black uppercase tracking-wider opacity-70">
              Khoản Đang Nợ
            </div>
            <div className="text-xs sm:text-sm font-black mt-1">
              {debtKpiActiveCount} <span className="text-[10px] font-bold">khoản</span>
            </div>
          </div>
        </div>

        {/* Toggle Tab: Mình Nợ / Họ Nợ */}
        <div className="flex p-1 bg-white/50 border border-white/60 rounded-2xl">
          <button
            onClick={() => setActiveDebtTab('payable')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              activeDebtTab === 'payable'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-white/60'
            }`}
          >
            Mình Nợ ({payableDebts.length})
          </button>
          <button
            onClick={() => setActiveDebtTab('receivable')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              activeDebtTab === 'receivable'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-white/60'
            }`}
          >
            Họ Nợ ({receivableDebts.length})
          </button>
        </div>

        {/* Active Debts List */}
        <div className="space-y-2 pt-1">
          {activeDebts.map((item) => {
            const remaining = Math.max(0, item.total - item.paid);
            const percentage = item.total > 0 ? Math.round((item.paid / item.total) * 100) : 0;
            const clamped = Math.min(100, Math.max(0, percentage));

            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white/50 border border-white/70 hover:bg-white/80 transition-all shadow-sm"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <h4 className="font-black text-xs uppercase text-slate-800 truncate pr-2">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold text-slate-400">
                      {item.monthlyQuota && (
                        <span className="text-amber-600">
                          Trả/tháng: {formatCurrency(item.monthlyQuota)}
                        </span>
                      )}
                      {item.deadline && (
                        <span className="text-slate-500">Hạn: {item.deadline}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-black text-rose-600">
                      {formatCurrency(remaining)}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400">
                      Đã trả: {clamped}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden my-1.5">
                  <div
                    className={`h-full rounded-full ${
                      activeDebtTab === 'payable'
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${clamped}%` }}
                  />
                </div>

                {/* Action Bar */}
                <div className="flex justify-between items-center pt-1 text-[9px]">
                  <span className="font-bold text-slate-400 truncate max-w-[180px]">
                    {item.note || 'Không có ghi chú'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditDebt(item)}
                      className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100"
                      title="Sửa"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Xóa sổ nợ "${item.name}"?`)) {
                          onUpdateDebts(debts.filter((d) => d.id !== item.id));
                        }
                      }}
                      className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100"
                      title="Xóa"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {activeDebts.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-2xl border border-dashed border-slate-200">
              Không có khoản nợ đang hoạt động
            </div>
          )}
        </div>

        {/* Done Debts Section */}
        {doneDebts.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowDoneDebts(!showDoneDebts)}
              className="w-full py-2 rounded-xl bg-slate-100/70 hover:bg-slate-200/70 text-slate-600 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
            >
              <History size={12} />
              Khoản Đã Hoàn Tất ({doneDebts.length})
              {showDoneDebts ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showDoneDebts && (
              <div className="space-y-1.5 mt-2 animate-fadeIn">
                {doneDebts.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">
                        <Check size={11} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-700 uppercase">
                          {item.name}
                        </div>
                        <div className="text-[8px] font-bold text-emerald-600">
                          Hoàn tất: {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Xóa sổ nợ "${item.name}"?`)) {
                          onUpdateDebts(debts.filter((d) => d.id !== item.id));
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Debt Form Modal */}
      {showDebtForm && (
        <ModalPortal>
          <div className="fixed sm:absolute inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div className="glass-panel w-full max-w-sm sm:max-w-md rounded-[32px] border border-white/60 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider text-center">
              {isEditingDebt ? 'Cập Nhật Khoản Nợ' : 'Tạo Khoản Nợ Mới'}
            </h3>

            {/* Type selector */}
            <div className="flex gap-2">
              <button
                disabled={!!isEditingDebt}
                onClick={() => setDebtType('payable')}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                  debtType === 'payable'
                    ? 'bg-rose-100 text-rose-700 border-rose-300 shadow-sm'
                    : 'bg-white/40 text-slate-400 border-white/60'
                }`}
              >
                Mình Nợ
              </button>
              <button
                disabled={!!isEditingDebt}
                onClick={() => setDebtType('receivable')}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                  debtType === 'receivable'
                    ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm'
                    : 'bg-white/40 text-slate-400 border-white/60'
                }`}
              >
                Họ Nợ
              </button>
            </div>

            {/* Name */}
            <input
              type="text"
              value={debtName}
              onChange={(e) => handleTextInput(e.target.value, setDebtName)}
              placeholder="Tên khoản nợ / Người liên quan..."
              className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-slate-200 text-slate-800 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Total & Paid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 pl-1">
                  Tổng Nợ (VNĐ)
                </label>
                <input
                  type="text"
                  value={debtTotal}
                  onChange={(e) => handleAmountInput(e.target.value, setDebtTotal)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-slate-200 text-slate-800 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 pl-1">
                  Đã Trả / Thu
                </label>
                <input
                  type="text"
                  value={debtPaid}
                  onChange={(e) => handleAmountInput(e.target.value, setDebtPaid)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-slate-200 text-slate-800 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Monthly Quota & Deadline */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 pl-1">
                  Trả/Thu Mỗi Tháng
                </label>
                <input
                  type="text"
                  value={debtMonthlyQuota}
                  onChange={(e) => handleAmountInput(e.target.value, setDebtMonthlyQuota)}
                  placeholder="VD: 1.500.000"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-slate-200 text-slate-800 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 pl-1">
                  Hạn Trả (Tháng/Năm)
                </label>
                <input
                  type="text"
                  value={debtDeadline}
                  onChange={(e) => setDebtDeadline(e.target.value)}
                  placeholder="VD: 01/12/2029"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-slate-200 text-slate-800 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Note */}
            <input
              type="text"
              value={debtNote}
              onChange={(e) => handleTextInput(e.target.value, setDebtNote)}
              placeholder="Ghi chú thêm..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-slate-200 text-slate-700 text-xs font-medium outline-none"
            />

            {!isEditingDebt && (
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[10px] font-bold text-blue-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCreateTransaction}
                  onChange={(e) => setAutoCreateTransaction(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                Tự động tạo giao dịch thu/chi tương ứng vào sổ
              </label>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDebtForm(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-200/80 text-slate-700 text-[10px] font-black uppercase tracking-wider"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveDebt}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-500/20"
              >
                {isEditingDebt ? 'Cập Nhật' : 'Lưu Hồ Sơ Nợ'}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* Budget Configuration Modal */}
      <ModalBudgetConfig
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        categoryBudgets={categoryBudgets}
        onSaveBudgets={onUpdateCategoryBudgets}
      />
    </div>
  );
};

export default TabBudget;

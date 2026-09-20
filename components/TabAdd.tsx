import React, { useState } from 'react';
import {
  DEBT_CATEGORY_NAME,
  TrendingUp,
  TrendingDown,
  Clock,
  Edit2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  X,
  Check,
  CORE_EXPENSE_CATEGORIES,
  DEFAULT_EXCEL_BUDGETS,
  DEFAULT_CATEGORIES,
} from '../constants';
import { Debt } from '../types';
import { formatCurrency, handleAmountInput, handleTextInput, parseAmount, toTitleCase } from '../utils';
import CustomDatePicker from './CustomDatePicker';

interface TabAddProps {
  viewDate?: Date;
  categories: string[];
  debts: Debt[];
  categoryBudgets?: Record<string, number>;
  onAddIncome: (source: string, amount: number, date: string, note: string, incomeType?: 'salary' | 'loan' | 'other') => void;
  onAddExpense: (
    category: string,
    amount: number,
    date: string,
    note: string,
    whoSpent: 'Ba' | 'Mẹ',
    selectedDebtorId: string
  ) => void;
  getMonthlyPaid: (cat: string) => number;
  onUpdateCategories: (newCats: string[]) => void;
}

const TabAdd: React.FC<TabAddProps> = ({
  viewDate,
  categories,
  debts,
  categoryBudgets = DEFAULT_EXCEL_BUDGETS,
  onAddIncome,
  onAddExpense,
  getMonthlyPaid,
  onUpdateCategories,
}) => {
  const getLocalToday = () => {
    const today = new Date();
    if (viewDate) {
      const isCurrentMonth =
        viewDate.getFullYear() === today.getFullYear() &&
        viewDate.getMonth() === today.getMonth();
      if (!isCurrentMonth) {
        const y = viewDate.getFullYear();
        const m = String(viewDate.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}-01`;
      }
    }
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // UI State
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');

  // Income State
  const [incomeSource, setIncomeSource] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(getLocalToday());
  const [incomeNote, setIncomeNote] = useState('');
  const [incomeType, setIncomeType] = useState<'salary' | 'loan' | 'other'>('salary');

  // Expense State
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(getLocalToday());
  const [expenseNote, setExpenseNote] = useState('');
  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  const [whoSpent, setWhoSpent] = useState<'Ba' | 'Mẹ'>('Ba');

  // Category Management State
  const [isCategoryManageMode, setIsCategoryManageMode] = useState(false);
  const [categoryModal, setCategoryModal] = useState<{
    mode: 'add' | 'rename';
    oldName?: string;
    value: string;
  } | null>(null);

  const submitIncome = () => {
    const amt = parseAmount(incomeAmount);
    if (!incomeSource.trim() || amt <= 0) return;
    onAddIncome(incomeSource.trim(), amt, incomeDate, incomeNote.trim(), incomeType);
    setIncomeSource('');
    setIncomeAmount('');
    setIncomeNote('');
  };

  const submitExpense = () => {
    const amt = parseAmount(expenseAmount);
    if (!expenseCategory || amt <= 0) return;
    if (expenseCategory === DEBT_CATEGORY_NAME && !selectedDebtorId) return;

    onAddExpense(expenseCategory, amt, expenseDate, expenseNote.trim(), whoSpent, selectedDebtorId);
    setExpenseCategory('');
    setExpenseAmount('');
    setExpenseNote('');
    setSelectedDebtorId('');
  };

  // Category Handlers
  const handleMoveCategory = (index: number, direction: 'up' | 'down' | 'left' | 'right') => {
    let targetIndex = index;
    if (direction === 'left') targetIndex = index - 1;
    else if (direction === 'right') targetIndex = index + 1;
    else if (direction === 'up') targetIndex = index - 3;
    else if (direction === 'down') targetIndex = index + 3;

    if (targetIndex >= 0 && targetIndex < categories.length) {
      const newCats = [...categories];
      [newCats[index], newCats[targetIndex]] = [newCats[targetIndex], newCats[index]];
      onUpdateCategories(newCats);
    }
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (!confirm(`Xác nhận xóa danh mục "${catToDelete}"?`)) return;
    onUpdateCategories(categories.filter((c) => c !== catToDelete));
  };

  const handleSaveCategoryModal = () => {
    if (!categoryModal) return;
    const cleanName = toTitleCase(categoryModal.value.trim());
    if (!cleanName) return;

    if (categoryModal.mode === 'add') {
      if (!categories.includes(cleanName)) {
        onUpdateCategories([...categories, cleanName]);
      }
    } else if (categoryModal.mode === 'rename' && categoryModal.oldName) {
      if (cleanName !== categoryModal.oldName) {
        onUpdateCategories(categories.map((c) => (c === categoryModal.oldName ? cleanName : c)));
      }
    }
    setCategoryModal(null);
  };

  const isExpenseDebtMissingRelation =
    expenseCategory === DEBT_CATEGORY_NAME && !selectedDebtorId;

  // Selected Category Budget Metric
  const currentCategorySpent = expenseCategory ? getMonthlyPaid(expenseCategory) : 0;
  const currentCategoryBudget = expenseCategory
    ? categoryBudgets[expenseCategory] ?? DEFAULT_EXCEL_BUDGETS[expenseCategory] ?? 0
    : 0;
  const currentCategoryRemaining = currentCategoryBudget - currentCategorySpent;

  return (
    <div className="space-y-4 animate-fadeIn pb-16 pt-1">
      {/* Tab Switcher */}
      <div className="glass-panel p-1.5 rounded-2xl flex mb-1 relative z-20">
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'income'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/50'
              : 'text-slate-400 hover:text-green-600 hover:bg-white/40'
          }`}
        >
          <TrendingUp size={14} /> Thu Nhập
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'expense'
              ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-200/50'
              : 'text-slate-400 hover:text-red-600 hover:bg-white/40'
          }`}
        >
          <TrendingDown size={14} /> Chi Tiêu
        </button>
      </div>

      {/* Nhập Thu Nhập (Liquid Card) */}
      {activeTab === 'income' && (
        <div className="glass-panel rounded-[32px] p-5 relative overflow-hidden group animate-fadeIn space-y-4">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-200/40 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
          <div className="flex items-center gap-2 text-green-700 font-black uppercase text-xs tracking-widest relative z-10 border-b border-green-100/50 pb-2">
            Nhập khoản thu nhập
          </div>

          <div className="space-y-3 relative z-10">
            {/* Income Type Selector (Sheet 2: Lương, Mượn/Vay, Khác) */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIncomeType('salary')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                  incomeType === 'salary'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white/40 text-slate-500 border-white/60'
                }`}
              >
                Tiền Lương
              </button>
              <button
                type="button"
                onClick={() => setIncomeType('loan')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                  incomeType === 'loan'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white/40 text-slate-500 border-white/60'
                }`}
              >
                Mượn / Vay
              </button>
              <button
                type="button"
                onClick={() => setIncomeType('other')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                  incomeType === 'other'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white/40 text-slate-500 border-white/60'
                }`}
              >
                Thu Khác
              </button>
            </div>

            <input
              type="text"
              placeholder="Nguồn thu (VD: Lương công ty, Thưởng, Tiền trả nợ...)"
              value={incomeSource}
              onChange={(e) => handleTextInput(e.target.value, setIncomeSource)}
              className="w-full p-3.5 glass-input rounded-2xl font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white/80 transition-all text-xs"
            />

            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Số tiền..."
                value={incomeAmount}
                onChange={(e) => handleAmountInput(e.target.value, setIncomeAmount)}
                className="w-1/2 p-3.5 glass-input rounded-2xl font-black text-green-700 text-base outline-none focus:bg-white/80 transition-all"
              />
              <CustomDatePicker
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="flex-1 glass-input rounded-2xl border-none"
              />
            </div>

            <input
              type="text"
              placeholder="Ghi chú (tùy chọn)..."
              value={incomeNote}
              onChange={(e) => handleTextInput(e.target.value, setIncomeNote)}
              className="w-full p-3 glass-input rounded-2xl font-medium text-slate-600 text-xs outline-none focus:bg-white/80 transition-all"
            />

            <button
              onClick={submitIncome}
              disabled={!incomeSource.trim() || !incomeAmount}
              className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-green-200/50 btn-effect uppercase text-xs tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lưu Khoản Thu Nhập
            </button>
          </div>
        </div>
      )}

      {/* Nhập Chi Tiêu (Liquid Card) */}
      {activeTab === 'expense' && (
        <div className="glass-panel rounded-[32px] p-5 relative overflow-hidden group animate-fadeIn space-y-4">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-red-200/40 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />

          <div className="flex items-center justify-between relative z-10 border-b border-red-100/50 pb-2">
            <div className="flex items-center gap-2 text-red-600 font-black uppercase text-xs tracking-widest">
              Chọn danh mục chi tiêu
            </div>
            <div className="flex items-center gap-1.5">
              {isCategoryManageMode && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Khôi phục danh mục về đúng 9 nhóm cốt lõi + Tiết kiệm chuẩn file Excel?')) {
                      onUpdateCategories([...DEFAULT_CATEGORIES]);
                    }
                  }}
                  className="text-[9px] font-bold px-2.5 py-1 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
                >
                  Chuẩn Excel
                </button>
              )}
              <button
                onClick={() => setIsCategoryManageMode(!isCategoryManageMode)}
                className={`text-[9px] font-bold px-3 py-1 rounded-xl border backdrop-blur-sm transition-all ${
                  isCategoryManageMode
                    ? 'bg-slate-800 text-white border-slate-700 shadow-md'
                    : 'bg-white/50 text-slate-600 border-white/60 hover:bg-white/80'
                }`}
              >
                {isCategoryManageMode ? 'Xong' : 'Sửa Mục'}
              </button>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            {/* Category Selection Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {categories.map((cat, idx) => {
                const isCore = (CORE_EXPENSE_CATEGORIES as readonly string[]).includes(cat);
                const isSelected = expenseCategory === cat;
                const catSpent = getMonthlyPaid(cat);

                return (
                  <div key={cat} className="relative h-[62px]">
                    {isCategoryManageMode ? (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl flex flex-col items-center justify-between p-1 z-20 shadow-sm animate-fadeIn">
                        <span className="text-[7px] font-extrabold text-slate-500 truncate w-full text-center uppercase tracking-tighter">
                          {cat}
                        </span>
                        <div className="grid grid-cols-3 gap-0.5 w-full place-items-center">
                          <button onClick={() => handleMoveCategory(idx, 'up')} className="p-0.5 text-slate-400">
                            <ChevronUp size={11} />
                          </button>
                          <button
                            onClick={() => setCategoryModal({ mode: 'rename', oldName: cat, value: cat })}
                            className="p-0.5 text-blue-500"
                          >
                            <Edit2 size={9} />
                          </button>
                          <button onClick={() => handleMoveCategory(idx, 'down')} className="p-0.5 text-slate-400">
                            <ChevronDown size={11} />
                          </button>
                          <button onClick={() => handleMoveCategory(idx, 'left')} className="p-0.5 text-slate-400">
                            <ChevronLeft size={11} />
                          </button>
                          <button onClick={() => handleDeleteCategory(cat)} className="p-0.5 text-red-500">
                            <Trash2 size={11} />
                          </button>
                          <button onClick={() => handleMoveCategory(idx, 'right')} className="p-0.5 text-slate-400">
                            <ChevronRight size={11} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpenseCategory(cat)}
                        className={`w-full h-full text-[10px] font-black rounded-2xl border transition-all duration-200 p-1 flex flex-col items-center justify-center relative ${
                          isSelected
                            ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white border-transparent shadow-md scale-105 z-10'
                            : isCore
                            ? 'bg-white/60 text-slate-700 border-white/70 hover:bg-white'
                            : 'bg-white/30 text-slate-500 border-white/40 hover:bg-white/50'
                        }`}
                      >
                        <span className="truncate w-full text-center">{cat}</span>
                        <span
                          className={`text-[7.5px] tracking-tight truncate max-w-full mt-0.5 ${
                            isSelected
                              ? 'text-white/90 font-black'
                              : catSpent > 0
                              ? 'text-red-600 font-black'
                              : 'text-slate-400 font-semibold'
                          }`}
                        >
                          {formatCurrency(catSpent)}đ
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}

              {!isCategoryManageMode && (
                <button
                  type="button"
                  onClick={() => setCategoryModal({ mode: 'add', value: '' })}
                  className="h-[62px] text-[10px] font-bold rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 hover:bg-white/30 hover:border-slate-400 hover:text-slate-500 transition-all flex items-center justify-center"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>

            {/* Real-time Category Spending & Budget Remaining Feedback */}
            {expenseCategory && !isCategoryManageMode && (
              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between shadow-sm animate-fadeIn">
                <div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-700 uppercase">
                    <Clock size={11} />
                    {expenseCategory} • Tháng này:
                  </div>
                  <div className="text-xs font-black text-indigo-900 mt-0.5">
                    Đã chi: {formatCurrency(currentCategorySpent)}
                  </div>
                </div>

                {currentCategoryBudget > 0 && (
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-slate-500">
                      Định mức: {formatCurrency(currentCategoryBudget)}
                    </div>
                    <div
                      className={`text-[10px] font-black ${
                        currentCategoryRemaining < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {currentCategoryRemaining < 0
                        ? `⚠ Vượt: ${formatCurrency(Math.abs(currentCategoryRemaining))}`
                        : `Còn lại: ${formatCurrency(currentCategoryRemaining)}`}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Debt Selector if category is Nợ */}
            {expenseCategory === DEBT_CATEGORY_NAME && (
              <div className="bg-blue-50/60 backdrop-blur-sm border border-blue-200 p-3 rounded-2xl animate-fadeIn shadow-inner">
                <label className="text-[9px] font-black text-blue-700 uppercase mb-1 block tracking-widest pl-1">
                  Người liên quan trong sổ nợ:
                </label>
                <select
                  value={selectedDebtorId}
                  onChange={(e) => setSelectedDebtorId(e.target.value)}
                  className="w-full p-2.5 bg-white/80 border border-blue-200 rounded-xl text-xs font-black outline-none shadow-sm focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
                >
                  <option value="">-- Chọn Sổ Nợ --</option>
                  {[...debts]
                    .filter((d) => d.total - d.paid > 0)
                    .sort((a, b) => {
                      if (a.type === 'payable' && b.type !== 'payable') return -1;
                      if (a.type !== 'payable' && b.type === 'payable') return 1;
                      return 0;
                    })
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.type === 'receivable' ? 'THU: ' : 'TRẢ: '}
                        {d.name} (Còn lại: {formatCurrency(d.total - d.paid)})
                      </option>
                    ))}
                </select>
                {isExpenseDebtMissingRelation && (
                  <span className="text-[9px] text-red-500 font-bold mt-1 block pl-1">
                    * Vui lòng chọn người trong sổ nợ để liên kết trừ tiền
                  </span>
                )}
              </div>
            )}

            {/* Amount and Date Input */}
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Số tiền..."
                value={expenseAmount}
                onChange={(e) => handleAmountInput(e.target.value, setExpenseAmount)}
                className="w-1/2 p-3.5 glass-input rounded-2xl font-black text-red-600 text-base outline-none focus:bg-white/80 transition-all"
              />
              <CustomDatePicker
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="flex-1 glass-input rounded-2xl border-none"
              />
            </div>

            {/* Ba/Mẹ toggle for Cá Nhân */}
            {(expenseCategory === 'Cá nhân' || expenseCategory === 'Cá Nhân (Ba-Mẹ)') && (
              <div className="flex gap-2 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => setWhoSpent('Ba')}
                  className={`flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase border transition-all ${
                    whoSpent === 'Ba'
                      ? 'bg-blue-100/90 text-blue-700 border-blue-200 shadow-sm'
                      : 'bg-white/40 text-slate-400 border-white/50'
                  }`}
                >
                  Ba Chi
                </button>
                <button
                  type="button"
                  onClick={() => setWhoSpent('Mẹ')}
                  className={`flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase border transition-all ${
                    whoSpent === 'Mẹ'
                      ? 'bg-pink-100/90 text-pink-700 border-pink-200 shadow-sm'
                      : 'bg-white/40 text-slate-400 border-white/50'
                  }`}
                >
                  Mẹ Chi
                </button>
              </div>
            )}

            <input
              type="text"
              placeholder="Ghi chú (tùy chọn)..."
              value={expenseNote}
              onChange={(e) => handleTextInput(e.target.value, setExpenseNote)}
              className="w-full p-3 glass-input rounded-2xl font-medium text-slate-600 text-xs outline-none focus:bg-white/80 transition-all"
            />

            <button
              onClick={submitExpense}
              disabled={!expenseCategory || !expenseAmount || isExpenseDebtMissingRelation}
              className="w-full py-3.5 bg-gradient-to-r from-red-500 to-pink-600 text-white font-black rounded-2xl shadow-lg shadow-red-200/50 btn-effect uppercase text-xs tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lưu Khoản Chi Tiêu
            </button>
          </div>
        </div>
      )}

      {/* Modal Add / Rename Category */}
      {categoryModal && (
        <div className="fixed sm:absolute inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[32px] p-5 max-w-xs w-full shadow-2xl space-y-4 border border-white/20 relative">
            <button
              onClick={() => setCategoryModal(null)}
              className="absolute top-4 right-4 p-1.5 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200"
            >
              <X size={16} />
            </button>
            <h4 className="font-black text-slate-700 text-xs uppercase tracking-tight">
              {categoryModal.mode === 'add' ? 'Thêm Danh Mục Mới' : 'Đổi Tên Danh Mục'}
            </h4>
            <input
              type="text"
              value={categoryModal.value}
              onChange={(e) => setCategoryModal({ ...categoryModal, value: e.target.value })}
              placeholder="Tên danh mục..."
              autoFocus
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-700"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setCategoryModal(null)}
                className="flex-1 py-2.5 bg-gray-100 text-slate-500 font-black rounded-xl text-[10px] uppercase tracking-wider"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveCategoryModal}
                disabled={!categoryModal.value.trim()}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black rounded-xl text-[10px] uppercase tracking-wider shadow-md disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Check size={13} /> Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabAdd;

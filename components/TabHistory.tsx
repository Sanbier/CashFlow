import React, { useState, useMemo } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  CalendarIcon,
  X,
  Check,
  Receipt,
  Wallet,
} from '../constants';
import { Expense, Income, HistoryItem } from '../types';
import { formatCurrency, formatDateTime, handleTextInput } from '../utils';

interface TabHistoryProps {
  incomes: Income[];
  expenses: Expense[];
  allIncomes?: Income[];
  allExpenses?: Expense[];
  viewDate?: Date;
  categories: string[];
  onDelete: (id: number, type: 'income' | 'expense') => void;
  onUpdateNote: (id: number, type: 'income' | 'expense', newNote: string) => void;
  onUpdateTransaction?: (
    id: number,
    type: 'income' | 'expense',
    updates: {
      amount?: number;
      note?: string;
      date?: string;
      categoryOrSource?: string;
    }
  ) => void;
}

const TabHistory: React.FC<TabHistoryProps> = ({
  incomes,
  expenses,
  allIncomes,
  allExpenses,
  viewDate,
  categories,
  onDelete,
  onUpdateNote,
  onUpdateTransaction,
}) => {
  const [timeScope, setTimeScope] = useState<'month' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewType, setViewType] = useState<'all' | 'income' | 'expense'>('all');

  // Full Edit Modal State
  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategoryOrSource, setEditCategoryOrSource] = useState('');

  // Determine active dataset based on time scope
  const currentMonthIncomes = incomes;
  const currentMonthExpenses = expenses;
  const totalAllIncomes = allIncomes || incomes;
  const totalAllExpenses = allExpenses || expenses;

  const activeIncomes = timeScope === 'month' ? currentMonthIncomes : totalAllIncomes;
  const activeExpenses = timeScope === 'month' ? currentMonthExpenses : totalAllExpenses;

  // Active Scope Metrics (Financial Summary)
  const totalIncomeAmount = useMemo(
    () => activeIncomes.reduce((sum, item) => sum + item.amount, 0),
    [activeIncomes]
  );
  const totalExpenseAmount = useMemo(
    () => activeExpenses.reduce((sum, item) => sum + item.amount, 0),
    [activeExpenses]
  );
  const netBalance = totalIncomeAmount - totalExpenseAmount;

  const handleViewTypeChange = (type: 'all' | 'income' | 'expense') => {
    setViewType(type);
    setFilterCategory('all');
  };

  const combinedList: HistoryItem[] = useMemo(() => {
    const allItems: HistoryItem[] = [
      ...activeIncomes.map((i): HistoryItem => ({ ...i, type: 'income' })),
      ...activeExpenses.map((e): HistoryItem => ({ ...e, type: 'expense' })),
    ];

    return allItems
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((item) => {
        // 1. Filter by Tab Type
        if (viewType === 'income' && item.type !== 'income') return false;
        if (viewType === 'expense' && item.type !== 'expense') return false;

        // 2. Filter by Search Term
        const searchLower = (searchTerm || '').trim().toLowerCase();
        const title = item.type === 'income' ? item.source : item.category;
        const text = (title || '').toLowerCase();
        const note = (item.note || '').toLowerCase();
        const amt = (item.amount || 0).toString();

        const matchesSearch =
          searchLower === '' ||
          text.includes(searchLower) ||
          note.includes(searchLower) ||
          amt.includes(searchLower);

        // 3. Filter by Category Dropdown
        let matchesCategory = true;
        if (filterCategory !== 'all') {
          if (item.type === 'expense') {
            matchesCategory = item.category === filterCategory;
          } else {
            matchesCategory = false;
          }
        }

        return matchesSearch && matchesCategory;
      });
  }, [activeIncomes, activeExpenses, viewType, searchTerm, filterCategory]);

  const handleOpenEdit = (item: HistoryItem) => {
    setEditingItem(item);
    setEditAmount(item.amount.toString());
    setEditNote(item.note || '');
    setEditDate(item.date ? item.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setEditCategoryOrSource(item.type === 'income' ? item.source : item.category);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const parsedAmount = Math.abs(parseInt(editAmount.replace(/\D/g, ''), 10)) || 0;
    if (parsedAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ lớn hơn 0!');
      return;
    }

    if (onUpdateTransaction) {
      onUpdateTransaction(editingItem.id, editingItem.type, {
        amount: parsedAmount,
        note: editNote.trim(),
        date: editDate ? new Date(editDate).toISOString() : editingItem.date,
        categoryOrSource: editCategoryOrSource.trim() || (editingItem.type === 'income' ? 'Khác' : 'Phát Sinh Khác'),
      });
    } else {
      onUpdateNote(editingItem.id, editingItem.type, editNote.trim());
    }
    setEditingItem(null);
  };

  const handleDeleteItem = (item: HistoryItem) => {
    const isDebt = Boolean(item.debtAction || item.relatedDebtId);
    const confirmMsg = isDebt
      ? 'Xác nhận xóa giao dịch này? Số dư Sổ Nợ liên kết sẽ được tự động hoàn lại.'
      : 'Xác nhận xóa giao dịch này khỏi sổ chi tiêu?';

    if (window.confirm(confirmMsg)) {
      onDelete(item.id, item.type);
    }
  };

  const formattedMonthLabel = viewDate
    ? `Tháng ${viewDate.getMonth() + 1}/${viewDate.getFullYear()}`
    : 'Tháng này';

  return (
    <div className="animate-fadeIn mt-2 space-y-3 pb-16">
      {/* 1. TIME SCOPE SELECTOR & FINANCIAL LINKAGE SUMMARY */}
      <div className="glass-panel p-3 rounded-2xl bg-white/70 border border-white/80 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Receipt size={14} className="text-slate-500" />
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
              Phạm Vi Lịch Sử
            </span>
          </div>

          {/* Month Scope Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => setTimeScope('month')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                timeScope === 'month'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {formattedMonthLabel}
            </button>
            <button
              type="button"
              onClick={() => setTimeScope('all')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                timeScope === 'all'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Tất cả ({totalAllIncomes.length + totalAllExpenses.length})
            </button>
          </div>
        </div>

        {/* 3 Metrics Cards Linked with Top Bar & CashFlow */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-100">
            <span className="text-[8px] text-emerald-600 font-extrabold uppercase block tracking-wider">
              Tổng Thu
            </span>
            <span className="text-[11px] font-black text-emerald-700 leading-tight block mt-0.5">
              +{formatCurrency(totalIncomeAmount)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-100">
            <span className="text-[8px] text-rose-600 font-extrabold uppercase block tracking-wider">
              Tổng Chi
            </span>
            <span className="text-[11px] font-black text-rose-700 leading-tight block mt-0.5">
              -{formatCurrency(totalExpenseAmount)}
            </span>
          </div>

          <div
            className={`p-2 rounded-xl border ${
              netBalance >= 0
                ? 'bg-blue-50/80 border-blue-100 text-blue-700'
                : 'bg-amber-50/80 border-amber-100 text-amber-700'
            }`}
          >
            <span className="text-[8px] font-extrabold uppercase block tracking-wider opacity-80">
              Chênh Lệch
            </span>
            <span className="text-[11px] font-black leading-tight block mt-0.5">
              {netBalance >= 0 ? '+' : ''}
              {formatCurrency(netBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. THANH CHUYỂN ĐỔI TAB THU / CHI */}
      <div className="flex p-1 bg-white/50 border border-white/70 rounded-2xl backdrop-blur-sm shadow-sm">
        <button
          onClick={() => handleViewTypeChange('all')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            viewType === 'all'
              ? 'bg-slate-800 text-white shadow-md'
              : 'text-slate-500 hover:bg-white/50'
          }`}
        >
          Tất cả ({activeIncomes.length + activeExpenses.length})
        </button>
        <button
          onClick={() => handleViewTypeChange('income')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            viewType === 'income'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-200'
              : 'text-slate-500 hover:bg-white/50'
          }`}
        >
          Thu Nhập ({activeIncomes.length})
        </button>
        <button
          onClick={() => handleViewTypeChange('expense')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            viewType === 'expense'
              ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md shadow-red-200'
              : 'text-slate-500 hover:bg-white/50'
          }`}
        >
          Chi Tiêu ({activeExpenses.length})
        </button>
      </div>

      {/* 3. SEARCH & CATEGORY FILTER */}
      <div className="flex gap-2 items-stretch">
        <div className="glass-panel p-1.5 rounded-xl flex gap-2 items-center group focus-within:bg-white/80 transition-all flex-1 bg-white/50">
          <div className="p-1.5 text-slate-400">
            <Search size={15} />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên, ghi chú, số tiền..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[10.5px] font-bold placeholder:text-slate-400 text-slate-700 h-full py-1"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category filter only when not in income mode */}
        {viewType !== 'income' && (
          <div className="glass-panel rounded-xl flex items-center bg-white/50 animate-fadeIn">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-full px-2 py-1.5 bg-transparent outline-none text-[9.5px] font-black uppercase text-slate-600 border-none rounded-xl cursor-pointer min-w-[100px] max-w-[140px] truncate"
            >
              <option value="all">🔍 Tất cả nhóm</option>
              <option disabled>──────────</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. TRANSACTION LIST */}
      <div className="space-y-2">
        {combinedList.map((item) => {
          const isIncome = item.type === 'income';
          const title = isIncome ? item.source : item.category;

          // Debt badges
          const debtAction = item.debtAction;
          const isDebtLinked = Boolean(item.relatedDebtId || debtAction);

          return (
            <div
              key={`${item.type}-${item.id}`}
              className="p-3 flex items-start gap-3 glass-panel rounded-2xl bg-white/70 hover:bg-white transition-all group border-white/60 shadow-sm"
            >
              {/* Icon Compact */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5 ${
                  isIncome
                    ? 'bg-gradient-to-br from-green-50 to-emerald-100 text-green-600 border border-emerald-200/50'
                    : 'bg-gradient-to-br from-red-50 to-pink-100 text-red-500 border border-rose-200/50'
                }`}
              >
                {isIncome ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              </div>

              {/* Content Area */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                {/* Row 1: Title, Debt Badge & Amount */}
                <div className="flex justify-between items-start gap-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <p className="font-black text-slate-800 text-[11px] uppercase tracking-tight truncate leading-tight">
                      {title}
                    </p>
                    {debtAction === 'repay' && (
                      <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap">
                        Trả nợ
                      </span>
                    )}
                    {debtAction === 'collect' && (
                      <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                        Thu nợ
                      </span>
                    )}
                    {debtAction === 'lend' && (
                      <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
                        Cho vay
                      </span>
                    )}
                  </div>

                  <p
                    className={`font-black text-[12px] leading-tight whitespace-nowrap flex-shrink-0 ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(item.amount)}
                  </p>
                </div>

                {/* Row 2: Note, Date & Action Buttons */}
                <div className="flex justify-between items-end mt-1">
                  <div className="flex-1 min-w-0 pr-2">
                    {item.note && (
                      <p className="text-[10px] text-slate-500 truncate italic leading-tight mb-0.5">
                        {item.note}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-[8.5px] text-slate-400 font-bold tracking-wider">
                      <CalendarIcon size={10} />
                      <span>{formatDateTime(item.date)}</span>
                    </div>
                  </div>

                  {/* Actions: Direct Edit & Delete Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-200/70 transition-transform active:scale-90"
                      title="Sửa giao dịch"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200/70 transition-transform active:scale-90"
                      title="Xóa giao dịch"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {combinedList.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] glass-panel rounded-2xl border-dashed bg-white/40">
            Không có giao dịch nào phù hợp
          </div>
        )}
      </div>

      {/* 5. FULL TRANSACTION EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[28px] p-5 w-full max-w-sm shadow-2xl border border-white/80 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    editingItem.type === 'income'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {editingItem.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                    Chỉnh sửa {editingItem.type === 'income' ? 'Khoản Thu' : 'Khoản Chi'}
                  </h3>
                  <span className="text-[8.5px] font-bold text-slate-400">ID #{editingItem.id}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Category / Source Selector */}
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  {editingItem.type === 'income' ? 'Nguồn Thu' : 'Danh Mục Chi'}
                </label>
                {editingItem.type === 'expense' ? (
                  <select
                    value={editCategoryOrSource}
                    onChange={(e) => setEditCategoryOrSource(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editCategoryOrSource}
                    onChange={(e) => handleTextInput(e.target.value, setEditCategoryOrSource)}
                    placeholder="VD: Lương, Thưởng, Thu nợ..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Số Tiền (VND)
                </label>
                <input
                  type="text"
                  value={editAmount ? Number(editAmount.replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setEditAmount(raw);
                  }}
                  placeholder="0"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Date Input */}
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Ngày Giao Dịch
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Note Input */}
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Ghi Chú
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => handleTextInput(e.target.value, setEditNote)}
                  placeholder="Nhập ghi chú chi tiết..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {Boolean(editingItem.debtAction || editingItem.relatedDebtId) && (
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-[9px] font-bold text-purple-700">
                  ℹ Giao dịch này liên kết với Sổ Nợ. Thay đổi số tiền sẽ tự động cập nhật số dư nợ tương ứng.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-slate-800 hover:bg-slate-900 shadow-md transition-all active:scale-95"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabHistory;

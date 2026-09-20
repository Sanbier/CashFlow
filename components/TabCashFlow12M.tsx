import React, { useState, useMemo } from 'react';
import {
  TableColumns,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Award,
  Edit2,
  Check,
  Percent,
  PieChart,
} from '../constants';
import { CORE_EXPENSE_CATEGORIES, CORE_SAVING_CATEGORY } from '../constants';
import { Income, Expense, MonthCashFlowRow, AnnualDashboardKPI } from '../types';
import { formatCurrency, handleAmountInput, parseAmount, computeAnnualCashFlow } from '../utils';

interface TabCashFlow12MProps {
  viewDate: Date;
  onSelectMonth?: (month: number, year: number) => void;
  incomes: Income[];
  expenses: Expense[];
  initialYearBalance: Record<number, number>;
  onUpdateInitialBalance: (year: number, amount: number) => void;
}

export const TabCashFlow12M: React.FC<TabCashFlow12MProps> = ({
  viewDate,
  onSelectMonth,
  incomes,
  expenses,
  initialYearBalance,
  onUpdateInitialBalance,
}) => {
  const currentYear = viewDate.getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeViewMode, setActiveViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [focusedMonth, setFocusedMonth] = useState<number>(viewDate.getMonth() + 1);

  // Edit Starting Balance Modal
  const [showEditBalance, setShowEditBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');

  // 12 Months Computation with Rollover Balance using single source of truth engine
  const { monthRows, annualKpi } = useMemo(() => {
    return computeAnnualCashFlow(selectedYear, incomes, expenses, initialYearBalance);
  }, [incomes, expenses, selectedYear, initialYearBalance]);

  const handleOpenEditBalance = () => {
    const current = initialYearBalance[selectedYear] || 0;
    setBalanceInput(current > 0 ? current.toLocaleString('vi-VN') : '');
    setShowEditBalance(true);
  };

  const handleSaveBalance = () => {
    const amt = parseAmount(balanceInput);
    onUpdateInitialBalance(selectedYear, amt);
    setShowEditBalance(false);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16 pt-1">
      {/* Year Navigation Header */}
      <div className="glass-panel p-3.5 rounded-[28px] border border-white/60 flex items-center justify-between shadow-sm">
        <button
          onClick={() => setSelectedYear((y) => y - 1)}
          className="p-2 rounded-2xl bg-white/50 hover:bg-white text-slate-600 transition-all active:scale-95 shadow-sm"
          title="Năm trước"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
            <TableColumns size={15} className="text-blue-600" />
            Ma Trận Dòng Tiền Năm {selectedYear}
          </div>
          <p className="text-[9px] font-bold text-slate-400">Sheet 2: THU CHI NAM {selectedYear}</p>
        </div>

        <button
          onClick={() => setSelectedYear((y) => y + 1)}
          className="p-2 rounded-2xl bg-white/50 hover:bg-white text-slate-600 transition-all active:scale-95 shadow-sm"
          title="Năm sau"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 8 Annual KPIs Dashboard (Sheet 2) */}
      <div className="glass-panel p-4 rounded-[28px] border border-white/60 shadow-lg space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-300/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 relative z-10">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Award size={14} className="text-amber-500" />
            Tổng Kết Dòng Tiền Cả Năm {selectedYear}
          </h3>
          <button
            onClick={handleOpenEditBalance}
            className="px-2.5 py-1 rounded-xl bg-white/70 hover:bg-white text-slate-600 border border-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all active:scale-95"
          >
            <Edit2 size={11} />
            Số Dư Đầu Năm: {formatCurrency(initialYearBalance[selectedYear] || 0)}
          </button>
        </div>

        {/* 8 Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
            <div className="text-[8px] font-black uppercase text-emerald-800 tracking-wider">
              Tổng Thu Năm
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-700 mt-1 truncate">
              {formatCurrency(annualKpi.totalAnnualIncome)}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200/80">
            <div className="text-[8px] font-black uppercase text-rose-800 tracking-wider">
              Tổng Chi Năm
            </div>
            <div className="text-xs sm:text-sm font-black text-rose-700 mt-1 truncate">
              {formatCurrency(annualKpi.totalAnnualExpense)}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200/80">
            <div className="text-[8px] font-black uppercase text-teal-800 tracking-wider">
              Tổng Tích Luỹ (10%)
            </div>
            <div className="text-xs sm:text-sm font-black text-teal-700 mt-1 truncate">
              {formatCurrency(annualKpi.totalAnnualSavings)}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200/80">
            <div className="text-[8px] font-black uppercase text-indigo-800 tracking-wider">
              Tỷ Lệ Tiết Kiệm
            </div>
            <div className="text-xs sm:text-sm font-black text-indigo-700 mt-1 truncate">
              {annualKpi.savingsRate.toFixed(1)}%
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80">
            <div className="text-[8px] font-black uppercase text-amber-800 tracking-wider">
              Tháng Chi Nhiều Nhất
            </div>
            <div className="text-xs font-black text-amber-700 mt-1 truncate">
              {annualKpi.highestExpenseMonth
                ? `T${annualKpi.highestExpenseMonth.month} • ${formatCurrency(
                    annualKpi.highestExpenseMonth.amount
                  )}`
                : 'Chưa có'}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200/80">
            <div className="text-[8px] font-black uppercase text-sky-800 tracking-wider">
              Tháng Chi Ít Nhất
            </div>
            <div className="text-xs font-black text-sky-700 mt-1 truncate">
              {annualKpi.lowestExpenseMonth
                ? `T${annualKpi.lowestExpenseMonth.month} • ${formatCurrency(
                    annualKpi.lowestExpenseMonth.amount
                  )}`
                : 'Chưa có'}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
            <div className="text-[8px] font-black uppercase text-emerald-800 tracking-wider">
              Tháng Dư Nhiều Nhất
            </div>
            <div className="text-xs font-black text-emerald-700 mt-1 truncate">
              {annualKpi.highestSurplusMonth
                ? `T${annualKpi.highestSurplusMonth.month} • ${formatCurrency(
                    annualKpi.highestSurplusMonth.amount
                  )}`
                : 'Chưa có'}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-200/80">
            <div className="text-[8px] font-black uppercase text-purple-800 tracking-wider">
              TB Chi / Tháng
            </div>
            <div className="text-xs sm:text-sm font-black text-purple-700 mt-1 truncate">
              {formatCurrency(annualKpi.averageMonthlyExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle (Matrix vs Monthly Cards) */}
      <div className="flex justify-between items-center px-1">
        <div className="flex p-1 bg-white/50 border border-white/60 rounded-2xl">
          <button
            onClick={() => setActiveViewMode('matrix')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              activeViewMode === 'matrix'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-white/60'
            }`}
          >
            Bảng Ma Trận 12T
          </button>
          <button
            onClick={() => setActiveViewMode('cards')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              activeViewMode === 'cards'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-white/60'
            }`}
          >
            Chi Tiết Từng Tháng
          </button>
        </div>

        {activeViewMode === 'cards' && (
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <button
                key={m}
                onClick={() => setFocusedMonth(m)}
                className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all ${
                  focusedMonth === m
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/40 text-slate-600 hover:bg-white'
                }`}
              >
                T{m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode 1: Comprehensive Horizontal Rollover Matrix */}
      {activeViewMode === 'matrix' && (
        <div className="glass-panel rounded-[28px] border border-white/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto p-3">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 font-black uppercase tracking-wider text-[8px]">
                  <th className="p-2 sticky left-0 bg-white/90 backdrop-blur-md z-20 min-w-[130px]">
                    Hạng Mục / Tháng
                  </th>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const isCurrentActive =
                      viewDate.getFullYear() === selectedYear && viewDate.getMonth() + 1 === m;
                    return (
                      <th
                        key={m}
                        onClick={() => onSelectMonth?.(m, selectedYear)}
                        className={`p-2 text-center min-w-[95px] cursor-pointer transition-all hover:bg-blue-100/60 rounded-t-xl select-none group ${
                          isCurrentActive
                            ? 'bg-blue-100 text-blue-900 ring-2 ring-blue-500 font-black'
                            : ''
                        }`}
                        title={`Bấm để chuyển sang xem chi phí sinh hoạt Tháng ${m}`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px]">T{m}</span>
                          {isCurrentActive ? (
                            <span className="text-[7px] text-blue-700 bg-blue-200/90 px-1.5 py-0.5 rounded-full uppercase font-black tracking-wider">
                              Đang xem
                            </span>
                          ) : (
                            <span className="text-[7px] text-slate-400 group-hover:text-blue-600 font-bold">
                              Xem ↗
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {/* 1. SỐ DƯ ĐẦU THÁNG */}
                <tr className="bg-blue-50/60 font-black text-blue-900">
                  <td className="p-2 sticky left-0 bg-blue-50/90 backdrop-blur-md z-10 uppercase text-[9px]">
                    Số Dư Đầu Tháng
                  </td>
                  {monthRows.map((r) => (
                    <td key={r.month} className="p-2 text-right">
                      {formatCurrency(r.startingBalance)}
                    </td>
                  ))}
                </tr>

                {/* 2. THU NHẬP */}
                <tr className="text-slate-700">
                  <td className="p-2 sticky left-0 bg-white/90 backdrop-blur-md z-10 pl-4 text-slate-500">
                    • Lương
                  </td>
                  {monthRows.map((r) => (
                    <td key={r.month} className="p-2 text-right">
                      {r.salaryIncome > 0 ? formatCurrency(r.salaryIncome) : '-'}
                    </td>
                  ))}
                </tr>
                <tr className="text-slate-700">
                  <td className="p-2 sticky left-0 bg-white/90 backdrop-blur-md z-10 pl-4 text-slate-500">
                    • Mượn / Vay
                  </td>
                  {monthRows.map((r) => (
                    <td key={r.month} className="p-2 text-right">
                      {r.loanIncome > 0 ? formatCurrency(r.loanIncome) : '-'}
                    </td>
                  ))}
                </tr>
                <tr className="text-slate-700">
                  <td className="p-2 sticky left-0 bg-white/90 backdrop-blur-md z-10 pl-4 text-slate-500">
                    • Thu khác
                  </td>
                  {monthRows.map((r) => (
                    <td key={r.month} className="p-2 text-right">
                      {r.otherIncome > 0 ? formatCurrency(r.otherIncome) : '-'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-emerald-50/70 font-black text-emerald-900">
                  <td className="p-2 sticky left-0 bg-emerald-50/90 backdrop-blur-md z-10 uppercase text-[9px]">
                    TỔNG THU SẴN CÓ
                  </td>
                  {monthRows.map((r) => (
                    <td key={r.month} className="p-2 text-right font-black">
                      {formatCurrency(r.totalIncome)}
                    </td>
                  ))}
                </tr>

                {/* 3. CHI SINH HOẠT (9 NHÓM) */}
                {CORE_EXPENSE_CATEGORIES.map((cat) => (
                  <tr key={cat} className="text-slate-700 hover:bg-slate-50/60">
                    <td className="p-2 sticky left-0 bg-white/90 backdrop-blur-md z-10 pl-4 text-slate-600">
                      {cat}
                    </td>
                    {monthRows.map((r) => {
                      const val = r.expensesByCategory[cat] || 0;
                      return (
                        <td key={r.month} className="p-2 text-right">
                          {val > 0 ? formatCurrency(val) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* 4. TÍCH LUỸ (TIẾT KIỆM) */}
                <tr className="bg-teal-50/60 font-black text-teal-900">
                  <td className="p-2 sticky left-0 bg-teal-50/90 backdrop-blur-md z-10 uppercase text-[9px]">
                    Tích Luỹ (10%)
                  </td>
                  {monthRows.map((r) => (
                    <td key={r.month} className="p-2 text-right">
                      {r.savingsAllocation > 0 ? formatCurrency(r.savingsAllocation) : '-'}
                    </td>
                  ))}
                </tr>

                {/* 5. TỔNG CHI */}
                <tr className="bg-rose-50/70 font-black text-rose-900">
                  <td className="p-2 sticky left-0 bg-rose-50/90 backdrop-blur-md z-10 uppercase text-[9px]">
                    TỔNG CHI THÁNG
                  </td>
                  {monthRows.map((r) => (
                    <td key={r.month} className="p-2 text-right font-black">
                      {formatCurrency(r.totalExpense)}
                    </td>
                  ))}
                </tr>

                {/* 6. SỐ DƯ CUỐI THÁNG (ROLLOVER) */}
                <tr className="bg-slate-900 text-white font-black">
                  <td className="p-2 sticky left-0 bg-slate-900 z-10 uppercase text-[9px]">
                    Số Dư Cuối Tháng
                  </td>
                  {monthRows.map((r) => (
                    <td key={r.month} className="p-2 text-right font-black">
                      {formatCurrency(r.closingBalance)}
                    </td>
                  ))}
                </tr>

                {/* 7. TRẠNG THÁI */}
                <tr className="bg-slate-50 text-[8.5px] font-black uppercase">
                  <td className="p-2 sticky left-0 bg-slate-50 z-10 text-slate-500">
                    Trạng Thái
                  </td>
                  {monthRows.map((r) => (
                    <td
                      key={r.month}
                      className={`p-2 text-center ${
                        r.status === 'deficit'
                          ? 'text-rose-600'
                          : r.status === 'surplus'
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {r.statusText}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode 2: Focused Single Month Detail Card */}
      {activeViewMode === 'cards' && (
        <div className="glass-panel p-4 rounded-[28px] border border-white/60 shadow-sm space-y-4">
          {(() => {
            const row = monthRows[focusedMonth - 1];
            if (!row) return null;

            return (
              <div className="space-y-4">
                {/* Header Card */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm uppercase">
                      Chi Tiết Dòng Tiền Tháng {row.month} / {row.year}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400">
                      Số dư đầu tháng:{' '}
                      <strong className="text-blue-600">{formatCurrency(row.startingBalance)}</strong>
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      row.status === 'deficit'
                        ? 'bg-rose-100 text-rose-700'
                        : row.status === 'surplus'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {row.statusText}
                  </span>
                </div>

                {/* Cash Flow Summary 3 Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/70">
                    <span className="text-[8px] font-black uppercase text-emerald-800">Tổng Thu Sẵn Có</span>
                    <div className="text-xs font-black text-emerald-700 mt-1">
                      {formatCurrency(row.totalIncome)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200/70">
                    <span className="text-[8px] font-black uppercase text-rose-800">Tổng Chi Tiêu</span>
                    <div className="text-xs font-black text-rose-700 mt-1">
                      {formatCurrency(row.totalExpense)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-900 text-white">
                    <span className="text-[8px] font-black uppercase text-slate-400">Số Dư Cuối Tháng</span>
                    <div className="text-xs font-black text-white mt-1">
                      {formatCurrency(row.closingBalance)}
                    </div>
                  </div>
                </div>

                {/* 9 Categories List in Month */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Các Nhóm Chi Sinh Hoạt
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CORE_EXPENSE_CATEGORIES.map((cat) => {
                      const spent = row.expensesByCategory[cat] || 0;
                      return (
                        <div
                          key={cat}
                          className="p-2.5 rounded-xl bg-white/50 border border-white/70 flex justify-between items-center"
                        >
                          <span className="text-xs font-bold text-slate-700">{cat}</span>
                          <span className="text-xs font-black text-slate-800">
                            {formatCurrency(spent)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Savings Pill */}
                <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200/80 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <PiggyBank size={16} className="text-teal-600" />
                    <div>
                      <div className="text-xs font-black text-teal-900">Quỹ Tích Luỹ Tiết Kiệm (10%)</div>
                      <div className="text-[9px] font-bold text-teal-600">Trích lập theo quy tắc tài chính</div>
                    </div>
                  </div>
                  <div className="text-xs font-black text-teal-700">
                    {formatCurrency(row.savingsAllocation)}
                  </div>
                </div>

                {/* Jump to Sheet 1 (TabBudget) for this Month */}
                {onSelectMonth && (
                  <button
                    onClick={() => onSelectMonth(row.month, row.year)}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all active:scale-98"
                  >
                    <PieChart size={15} />
                    Xem Ngân Sách Sinh Hoạt Tháng {row.month} (Sheet 1)
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Edit Starting Balance Modal */}
      {showEditBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-sm rounded-[32px] border border-white/60 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider text-center">
              Số Dư Chuyển Tiếp Đầu Năm {selectedYear}
            </h3>
            <p className="text-[10px] text-slate-500 text-center font-bold">
              Số dư này sẽ làm điểm khởi đầu (Tháng 1) và tự động chuyển tiếp qua 12 tháng.
            </p>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 pl-1">
                Số Tiền Đầu Năm (VNĐ)
              </label>
              <input
                type="text"
                value={balanceInput}
                onChange={(e) => handleAmountInput(e.target.value, setBalanceInput)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-slate-200 text-slate-800 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowEditBalance(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-200/80 text-slate-700 text-[10px] font-black uppercase tracking-wider"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveBalance}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-500/20"
              >
                Lưu Số Dư
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabCashFlow12M;

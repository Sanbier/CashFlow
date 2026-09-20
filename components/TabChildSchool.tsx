import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  SettingsIcon,
  Check,
  X,
  Save,
  Receipt,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
} from '../constants';
import {
  ChildEducationData,
  ChildEducationConfig,
  AttendanceStatus,
  AllowanceItem,
} from '../types';
import { formatCurrency, handleAmountInput, parseAmount } from '../utils';

interface TabChildSchoolProps {
  viewDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  childEducation: ChildEducationData;
  onToggleAttendance: (dateStr: string, currentStatus?: AttendanceStatus, note?: string) => void;
  onUpdateConfig: (config: ChildEducationConfig) => void;
  onUpdatePayment: (month: number, year: number, actualPaid: number, calculatedFee: number, note?: string) => void;
  onSyncToExpense: (month: number, year: number, calculatedFee: number) => void;
}

const WEEKDAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const TabChildSchool: React.FC<TabChildSchoolProps> = ({
  viewDate,
  onPrevMonth,
  onNextMonth,
  childEducation,
  onToggleAttendance,
  onUpdateConfig,
  onUpdatePayment,
  onSyncToExpense,
}) => {
  // Synchronize month and year strictly with the global viewDate
  const selectedMonth = viewDate.getMonth() + 1;
  const selectedYear = viewDate.getFullYear();

  // Modal States
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingPaymentMonth, setEditingPaymentMonth] = useState<number | null>(null);
  const [paymentInputAmount, setPaymentInputAmount] = useState('');
  const [paymentInputNote, setPaymentInputNote] = useState('');
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  const { config, attendance, payments } = childEducation;

  const handlePrevMonth = () => {
    onPrevMonth();
  };

  const handleNextMonth = () => {
    onNextMonth();
  };

  // Days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Days data array for the calendar
  const calendarDays = useMemo(() => {
    const list = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(selectedYear, selectedMonth - 1, day);
      const dayOfWeek = dateObj.getDay(); // 0: Sunday, 1: Mon, ..., 6: Sat
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;

      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
      const savedRecord = attendance[dateStr];

      // Default status logic if not explicitly recorded:
      // Mon-Fri: default 'hoc'
      // Saturday: default 'hoc'
      // Sunday: default 'nghi'
      let status: AttendanceStatus;
      if (savedRecord) {
        status = savedRecord.status;
      } else {
        status = isSunday ? 'nghi' : 'hoc';
      }

      // Fee for this specific day
      let fee = 0;
      if (status === 'hoc') {
        if (isSaturday) {
          fee = config.saturdayFee;
        } else if (!isSunday) {
          fee = config.regularDayFee;
        }
      }

      list.push({
        day,
        dateStr,
        dayOfWeek,
        dayName: WEEKDAY_NAMES[dayOfWeek],
        isSunday,
        isSaturday,
        status,
        fee,
        note: savedRecord?.note || '',
      });
    }
    return list;
  }, [selectedYear, selectedMonth, daysInMonth, attendance, config]);

  // Calculation Counters
  const regularDayCount = useMemo(() => {
    return calendarDays.filter((d) => d.status === 'hoc' && !d.isSunday && !d.isSaturday).length;
  }, [calendarDays]);

  const saturdayCount = useMemo(() => {
    return calendarDays.filter((d) => d.status === 'hoc' && d.isSaturday).length;
  }, [calendarDays]);

  const absentDayCount = useMemo(() => {
    return calendarDays.filter((d) => d.status === 'nghi' && !d.isSunday).length;
  }, [calendarDays]);

  const regularDayTotalFee = regularDayCount * config.regularDayFee;
  const saturdayTotalFee = saturdayCount * config.saturdayFee;

  // Monthly Allowances
  const monthlyAllowancesTotal = useMemo(() => {
    return config.monthlyAllowances
      .filter((item) => item.enabled)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [config.monthlyAllowances]);

  // Annual Allowances (applied in config.applyAnnualAllowanceMonth, default September)
  const isAnnualAllowanceApplicable =
    config.applyAnnualAllowanceMonth === null ||
    config.applyAnnualAllowanceMonth === undefined ||
    selectedMonth === config.applyAnnualAllowanceMonth;

  const annualAllowancesTotal = useMemo(() => {
    if (!isAnnualAllowanceApplicable) return 0;
    return config.annualAllowances
      .filter((item) => item.enabled)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [config.annualAllowances, isAnnualAllowanceApplicable]);

  // Total Month Tuition Fee
  const totalMonthTuition =
    regularDayTotalFee + saturdayTotalFee + monthlyAllowancesTotal + annualAllowancesTotal;

  // Current Month Payment Record
  const currentMonthPaymentKey = `${selectedYear}-${selectedMonth}`;
  const currentMonthPayment = payments[currentMonthPaymentKey];
  const actualPaidAmount = currentMonthPayment?.actualPaid || 0;

  // Handle Sync to Expense
  const handleSyncToExpense = () => {
    onSyncToExpense(selectedMonth, selectedYear, totalMonthTuition);
    setSyncSuccessMessage(
      `Đã đồng bộ ${formatCurrency(totalMonthTuition)} vào Chi phí Con Cái Tháng ${selectedMonth}/${selectedYear}!`
    );
    setTimeout(() => setSyncSuccessMessage(null), 4000);
  };

  // Open Edit Payment Modal
  const handleOpenEditPayment = (month: number) => {
    setEditingPaymentMonth(month);
    const key = `${selectedYear}-${month}`;
    const p = payments[key];
    setPaymentInputAmount(p ? p.actualPaid.toLocaleString('vi-VN') : '');
    setPaymentInputNote(p?.note || '');
  };

  const handleSavePayment = () => {
    if (editingPaymentMonth === null) return;
    const paid = parseAmount(paymentInputAmount);
    // If saving for the selected month, use current calculated fee; otherwise use stored or current
    const calculated =
      editingPaymentMonth === selectedMonth
        ? totalMonthTuition
        : payments[`${selectedYear}-${editingPaymentMonth}`]?.calculatedFee || totalMonthTuition;

    onUpdatePayment(
      editingPaymentMonth,
      selectedYear,
      paid,
      calculated,
      paymentInputNote.trim() || undefined
    );
    setEditingPaymentMonth(null);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16 pt-1">
      {/* Month Navigation Header */}
      <div className="glass-panel p-3.5 rounded-[28px] border border-white/60 flex items-center justify-between shadow-sm">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-2xl bg-white/50 hover:bg-white text-slate-600 transition-all active:scale-95 shadow-sm"
          title="Tháng trước"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
            <GraduationCap size={15} className="text-indigo-600" />
            Lịch Học & Tiền Học Con • T{selectedMonth}/{selectedYear}
          </div>
          <p className="text-[9px] font-bold text-slate-400">Sheet 3: Điểm danh & Biểu phí</p>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded-2xl bg-white/50 hover:bg-white text-slate-600 transition-all active:scale-95 shadow-sm"
          title="Tháng sau"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Sync Success Toast */}
      {syncSuccessMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500 text-white text-[11px] font-black uppercase text-center shadow-lg animate-fadeIn flex items-center justify-center gap-2">
          <Check size={14} strokeWidth={3} />
          {syncSuccessMessage}
        </div>
      )}

      {/* Month Total Summary Card */}
      <div className="glass-panel p-4 rounded-[28px] border border-white/60 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-300/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200/50 relative z-10">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
              Tổng tiền học dự toán
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-700 tracking-tight leading-tight">
              {formatCurrency(totalMonthTuition)}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2 rounded-xl bg-white/60 hover:bg-white text-slate-600 border border-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm active:scale-95 transition-all"
              title="Cấu hình biểu phí"
            >
              <SettingsIcon size={13} />
              Biểu Phí
            </button>
            <button
              onClick={handleSyncToExpense}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              title="Đồng bộ vào danh mục Con cái"
            >
              <Receipt size={13} />
              Đồng Bộ Sổ
            </button>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
            <div className="text-[8px] font-black uppercase text-emerald-800 tracking-wider">
              Học Thường ({regularDayCount} buổi)
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-700 mt-1">
              {formatCurrency(regularDayTotalFee)}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200/80">
            <div className="text-[8px] font-black uppercase text-blue-800 tracking-wider">
              Học Thứ 7 ({saturdayCount} buổi)
            </div>
            <div className="text-xs sm:text-sm font-black text-blue-700 mt-1">
              {formatCurrency(saturdayTotalFee)}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-200/80">
            <div className="text-[8px] font-black uppercase text-purple-800 tracking-wider">
              Phụ Cấp Tháng
            </div>
            <div className="text-xs sm:text-sm font-black text-purple-700 mt-1">
              {formatCurrency(monthlyAllowancesTotal)}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80">
            <div className="text-[8px] font-black uppercase text-amber-800 tracking-wider">
              Phụ Cấp Đầu Năm
            </div>
            <div className="text-xs sm:text-sm font-black text-amber-700 mt-1">
              {formatCurrency(annualAllowancesTotal)}
            </div>
          </div>
        </div>

        {/* Payment Status Pill */}
        <div className="mt-3 flex items-center justify-between text-[10px] font-bold px-1 text-slate-500">
          <span>
            Thực tế đã đóng:{' '}
            <strong className="text-slate-800 font-black">{formatCurrency(actualPaidAmount)}</strong>
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase ${
              actualPaidAmount >= totalMonthTuition && totalMonthTuition > 0
                ? 'bg-emerald-100 text-emerald-700'
                : actualPaidAmount > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {actualPaidAmount >= totalMonthTuition && totalMonthTuition > 0
              ? 'Đã Đóng Đủ'
              : actualPaidAmount > 0
              ? 'Đóng Thiếu'
              : 'Chưa Đóng'}
          </span>
        </div>
      </div>

      {/* 31-Day Attendance Calendar Grid */}
      <div className="glass-panel p-4 rounded-[28px] border border-white/60 shadow-sm space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
          <div>
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-blue-600" />
              Lịch Chấm Công Điểm Danh (1 Chạm)
            </h3>
            <p className="text-[9px] font-bold text-slate-400">
              Nghỉ: {absentDayCount} ngày • Ngày thường: {config.regularDayFee.toLocaleString('vi-VN')}đ • T7: {config.saturdayFee.toLocaleString('vi-VN')}đ
            </p>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Học
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span> Nghỉ
            </span>
          </div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {calendarDays.map((item) => {
            const isAttending = item.status === 'hoc';

            let cellBg = 'bg-white/50 border-white/70 text-slate-700 hover:bg-white';
            if (isAttending) {
              if (item.isSaturday) {
                cellBg = 'bg-blue-500/15 border-blue-500/30 text-blue-800 hover:bg-blue-500/25';
              } else if (!item.isSunday) {
                cellBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800 hover:bg-emerald-500/25';
              }
            } else {
              cellBg = 'bg-slate-100/50 border-slate-200/40 text-slate-400 hover:bg-slate-100';
            }

            return (
              <button
                key={item.day}
                onClick={() => onToggleAttendance(item.dateStr, item.status)}
                className={`p-1.5 rounded-2xl border flex flex-col items-center justify-between min-h-[58px] transition-all active:scale-95 shadow-sm group ${cellBg}`}
                title={`Ngày ${item.day} (${item.dayName}): ${isAttending ? 'Học' : 'Nghỉ'} - Bấm để đổi`}
              >
                {/* Header: Day Number & Weekday */}
                <div className="flex items-center justify-between w-full px-1">
                  <span className="text-[10px] font-black leading-none">{item.day}</span>
                  <span className={`text-[8px] font-bold ${
                    item.isSunday ? 'text-rose-500' : item.isSaturday ? 'text-blue-500' : 'text-slate-400'
                  }`}>
                    {item.dayName}
                  </span>
                </div>

                {/* Status Dot / Fee */}
                <div className="my-0.5">
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase ${
                      isAttending
                        ? item.isSaturday
                          ? 'bg-blue-500 text-white'
                          : 'bg-emerald-500 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {isAttending ? 'Học' : 'Nghỉ'}
                  </span>
                </div>

                {/* Day Fee Amount */}
                <span className="text-[7.5px] font-bold opacity-75 truncate max-w-full">
                  {item.fee > 0 ? `${(item.fee / 1000).toFixed(0)}k` : '0đ'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 12-Month Tuition Payment Tracking Matrix */}
      <div className="glass-panel p-4 rounded-[28px] border border-white/60 shadow-sm space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
          <div>
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Receipt size={14} className="text-emerald-600" />
              Sổ Theo Dõi Đóng Tiền Học 12 Tháng
            </h3>
            <p className="text-[9px] font-bold text-slate-400">Sheet 3: Bảng tổng hợp năm {selectedYear}</p>
          </div>
        </div>

        {/* 12 Months List */}
        <div className="space-y-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const paymentKey = `${selectedYear}-${m}`;
            const payment = payments[paymentKey];
            const isCurrentSelected = m === selectedMonth;
            const fee = isCurrentSelected ? totalMonthTuition : payment?.calculatedFee || 0;
            const paid = payment?.actualPaid || 0;
            const status = payment?.status || (paid >= fee && fee > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid');

            let badge = (
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200">
                Chưa Đóng
              </span>
            );

            if (status === 'paid') {
              badge = (
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Đã Đóng
                </span>
              );
            } else if (status === 'partial') {
              badge = (
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200">
                  Đóng Thiếu
                </span>
              );
            }

            return (
              <div
                key={m}
                onClick={() => handleOpenEditPayment(m)}
                className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer hover:bg-white/80 transition-all ${
                  isCurrentSelected
                    ? 'bg-indigo-50/60 border-indigo-200 shadow-sm'
                    : 'bg-white/40 border-white/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                      isCurrentSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    T{m}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800">
                      {formatCurrency(fee > 0 ? fee : paid)}
                    </div>
                    {payment?.note && (
                      <div className="text-[9px] font-medium text-slate-400 truncate max-w-[120px]">
                        {payment.note}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[10px] font-black text-slate-700">
                      Đã đóng: {formatCurrency(paid)}
                    </div>
                  </div>
                  {badge}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Payment Modal */}
      {editingPaymentMonth !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-sm rounded-[32px] border border-white/60 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider text-center">
              Ghi Nhận Đóng Tiền Học Tháng {editingPaymentMonth}/{selectedYear}
            </h3>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 pl-1">
                Số Tiền Thực Tế Đã Đóng (VNĐ)
              </label>
              <input
                type="text"
                value={paymentInputAmount}
                onChange={(e) => handleAmountInput(e.target.value, setPaymentInputAmount)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-slate-200 text-slate-800 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 pl-1">
                Ghi Chú Đóng Tiền
              </label>
              <input
                type="text"
                value={paymentInputNote}
                onChange={(e) => setPaymentInputNote(e.target.value)}
                placeholder="VD: Đã đóng cô giáo ngày 10, tạm ứng..."
                className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-slate-200 text-slate-700 text-xs font-medium outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingPaymentMonth(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-200/80 text-slate-700 text-[10px] font-black uppercase tracking-wider"
              >
                Hủy
              </button>
              <button
                onClick={handleSavePayment}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20"
              >
                Lưu Đóng Tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biểu Phí Configuration Modal */}
      {showConfigModal && (
        <ConfigModal
          config={config}
          onClose={() => setShowConfigModal(false)}
          onSaveConfig={(newCfg) => {
            onUpdateConfig(newCfg);
            setShowConfigModal(false);
          }}
        />
      )}
    </div>
  );
};

// Sub-component for Config Modal
interface ConfigModalProps {
  config: ChildEducationConfig;
  onClose: () => void;
  onSaveConfig: (cfg: ChildEducationConfig) => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ config, onClose, onSaveConfig }) => {
  const [regularFee, setRegularFee] = useState(config.regularDayFee.toLocaleString('vi-VN'));
  const [saturdayFee, setSaturdayFee] = useState(config.saturdayFee.toLocaleString('vi-VN'));
  const [applyMonth, setApplyMonth] = useState<string>(
    config.applyAnnualAllowanceMonth ? String(config.applyAnnualAllowanceMonth) : '9'
  );

  const [monthlyItems, setMonthlyItems] = useState<AllowanceItem[]>(config.monthlyAllowances);
  const [annualItems, setAnnualItems] = useState<AllowanceItem[]>(config.annualAllowances);

  const handleSave = () => {
    const newCfg: ChildEducationConfig = {
      regularDayFee: parseAmount(regularFee),
      saturdayFee: parseAmount(saturdayFee),
      monthlyAllowances: monthlyItems,
      annualAllowances: annualItems,
      applyAnnualAllowanceMonth: applyMonth ? Number(applyMonth) : null,
    };
    onSaveConfig(newCfg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md max-h-[85vh] rounded-[32px] border border-white/60 p-5 flex flex-col shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200/50">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
            Cấu Hình Biểu Phí & Phụ Cấp Con
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 my-2">
          {/* Daily Unit Fees */}
          <div className="p-3.5 rounded-2xl bg-white/50 border border-white/70 space-y-2.5">
            <h4 className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
              Đơn Giá Ngày Học
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">
                  Ngày thường (T2 - T6)
                </label>
                <input
                  type="text"
                  value={regularFee}
                  onChange={(e) => handleAmountInput(e.target.value, setRegularFee)}
                  className="w-full px-3 py-2 text-right font-black rounded-xl bg-white border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">
                  Học Thứ 7 / buổi
                </label>
                <input
                  type="text"
                  value={saturdayFee}
                  onChange={(e) => handleAmountInput(e.target.value, setSaturdayFee)}
                  className="w-full px-3 py-2 text-right font-black rounded-xl bg-white border border-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Monthly Allowances */}
          <div className="p-3.5 rounded-2xl bg-white/50 border border-white/70 space-y-2.5">
            <h4 className="text-[10px] font-black uppercase text-purple-700 tracking-wider">
              Phụ Cấp Cố Định Hàng Tháng
            </h4>
            <div className="space-y-2">
              {monthlyItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => {
                      const updated = [...monthlyItems];
                      updated[idx].enabled = e.target.checked;
                      setMonthlyItems(updated);
                    }}
                    className="w-4 h-4 rounded accent-purple-600"
                  />
                  <span className="text-xs font-bold text-slate-700 flex-1">{item.name}</span>
                  <input
                    type="text"
                    value={item.amount.toLocaleString('vi-VN')}
                    onChange={(e) => {
                      const val = parseAmount(e.target.value);
                      const updated = [...monthlyItems];
                      updated[idx].amount = val;
                      setMonthlyItems(updated);
                    }}
                    className="w-24 px-2 py-1 text-right font-black rounded-lg bg-white border border-slate-200 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Annual Allowances */}
          <div className="p-3.5 rounded-2xl bg-white/50 border border-white/70 space-y-2.5">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                Phụ Cấp Đầu Năm
              </h4>
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                <span>Áp dụng tháng:</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={applyMonth}
                  onChange={(e) => setApplyMonth(e.target.value)}
                  className="w-12 px-1 py-0.5 text-center font-black rounded bg-white border border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              {annualItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => {
                      const updated = [...annualItems];
                      updated[idx].enabled = e.target.checked;
                      setAnnualItems(updated);
                    }}
                    className="w-4 h-4 rounded accent-amber-600"
                  />
                  <span className="text-xs font-bold text-slate-700 flex-1">{item.name}</span>
                  <input
                    type="text"
                    value={item.amount.toLocaleString('vi-VN')}
                    onChange={(e) => {
                      const val = parseAmount(e.target.value);
                      const updated = [...annualItems];
                      updated[idx].amount = val;
                      setAnnualItems(updated);
                    }}
                    className="w-24 px-2 py-1 text-right font-black rounded-lg bg-white border border-slate-200 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/50 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-200/80 text-slate-700 text-[10px] font-black uppercase tracking-wider"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20"
          >
            Lưu Cấu Hình
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabChildSchool;

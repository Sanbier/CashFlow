import React, { useState } from 'react';
import { X, Save, RefreshCw } from '../../constants';
import { CORE_EXPENSE_CATEGORIES, CORE_SAVING_CATEGORY, DEFAULT_EXCEL_BUDGETS } from '../../constants';
import { formatCurrency, handleAmountInput, parseAmount } from '../../utils';

interface ModalBudgetConfigProps {
  isOpen: boolean;
  onClose: () => void;
  categoryBudgets: Record<string, number>;
  onSaveBudgets: (newBudgets: Record<string, number>) => void;
}

export const ModalBudgetConfig: React.FC<ModalBudgetConfigProps> = ({
  isOpen,
  onClose,
  categoryBudgets,
  onSaveBudgets,
}) => {
  const allCategories = [...CORE_EXPENSE_CATEGORIES, CORE_SAVING_CATEGORY];

  const [inputBudgets, setInputBudgets] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const cat of allCategories) {
      initial[cat] = (categoryBudgets[cat] ?? DEFAULT_EXCEL_BUDGETS[cat] ?? 0).toLocaleString('vi-VN');
    }
    return initial;
  });

  if (!isOpen) return null;

  const handleResetDefault = () => {
    if (confirm('Khôi phục ngân sách mặc định theo bảng Excel (Tổng 14.200.000đ)?')) {
      const resetMap: Record<string, string> = {};
      for (const cat of allCategories) {
        resetMap[cat] = (DEFAULT_EXCEL_BUDGETS[cat] ?? 0).toLocaleString('vi-VN');
      }
      setInputBudgets(resetMap);
    }
  };

  const handleSave = () => {
    const result: Record<string, number> = {};
    for (const cat of allCategories) {
      result[cat] = parseAmount(inputBudgets[cat] || '0');
    }
    onSaveBudgets(result);
    onClose();
  };

  const totalBudget = allCategories.reduce(
    (acc, cat) => acc + parseAmount(inputBudgets[cat] || '0'),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md max-h-[85vh] rounded-[32px] border border-white/60 p-5 flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-200/50">
          <div>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
              Cấu Hình Ngân Sách Sinh Hoạt
            </h3>
            <p className="text-[10px] text-slate-500 font-bold">
              Tổng định mức: <span className="text-blue-600 font-black">{formatCurrency(totalBudget)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100/80 text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 my-2">
          {allCategories.map((cat) => {
            const isSaving = cat === CORE_SAVING_CATEGORY;
            return (
              <div
                key={cat}
                className={`p-3 rounded-2xl border transition-all ${
                  isSaving
                    ? 'bg-emerald-50/50 border-emerald-200/70'
                    : 'bg-white/40 border-white/60 hover:bg-white/70'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-black uppercase tracking-tight ${
                    isSaving ? 'text-emerald-700' : 'text-slate-700'
                  }`}>
                    {cat}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">
                    Mặc định: {formatCurrency(DEFAULT_EXCEL_BUDGETS[cat] ?? 0)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={inputBudgets[cat] || ''}
                    onChange={(e) =>
                      handleAmountInput(e.target.value, (val) =>
                        setInputBudgets((prev) => ({ ...prev, [cat]: val }))
                      )
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 text-right font-black text-slate-800 rounded-xl bg-white/70 border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">
                    VNĐ
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200/50 flex gap-2">
          <button
            onClick={handleResetDefault}
            className="px-3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
            title="Khôi phục mặc định"
          >
            <RefreshCw size={13} />
            Mặc định
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 text-[10px] font-black uppercase tracking-wider transition-all"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/25 transition-all"
          >
            <Save size={14} />
            Lưu Ngân Sách
          </button>
        </div>
      </div>
    </div>
  );
};

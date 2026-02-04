
import React, { useState } from 'react';
import { Clock, X, Check, TrendingUp, AlertTriangle } from '../../constants';
import { FixedTemplateItem, Expense } from '../../types';
import { formatCurrency, handleAmountInput, parseAmount } from '../../utils';

interface ModalFixedTrackingProps {
    isOpen: boolean;
    onClose: () => void;
    viewDate: Date;
    fixedTemplate: FixedTemplateItem[];
    expenses: Expense[];
    onConfirmPayment: (item: FixedTemplateItem, amount: number) => void;
}

const ModalFixedTracking: React.FC<ModalFixedTrackingProps> = ({ isOpen, onClose, viewDate, fixedTemplate, expenses, onConfirmPayment }) => {
    const [fixedPaymentInputs, setFixedPaymentInputs] = useState<Record<string, string>>({});

    if (!isOpen) return null;

    const getMonthlyPaidForCategory = (catName: string) => {
        return expenses.filter(e => e.category === catName).reduce((acc, item) => acc + item.amount, 0);
    };

    const handlePay = (item: FixedTemplateItem) => {
        const paid = getMonthlyPaidForCategory(item.category);
        const rem = item.amount - paid;
        const defaultVal = rem > 0 ? rem : 0;
        
        const valStr = fixedPaymentInputs[item.category];
        const amountToPay = valStr ? parseAmount(valStr) : defaultVal;

        if (amountToPay <= 0) return;

        onConfirmPayment(item, amountToPay);
        setFixedPaymentInputs(prev => ({...prev, [item.category]: ''}));
    };

    // Tính toán tổng quan
    const totalBudget = fixedTemplate.reduce((acc, item) => acc + item.amount, 0);
    const totalPaid = fixedTemplate.reduce((acc, item) => acc + getMonthlyPaidForCategory(item.category), 0);
    const totalRemaining = totalBudget - totalPaid;
    const progressPercent = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;

    // Phân loại danh sách
    const listItems = fixedTemplate.map(item => {
        const paid = getMonthlyPaidForCategory(item.category);
        const rem = item.amount - paid;
        return { ...item, paid, rem, isDone: rem <= 0, progress: Math.min(100, (paid/item.amount)*100) };
    });

    const pendingItems = listItems.filter(i => !i.isDone).sort((a,b) => b.rem - a.rem); // Ưu tiên số tiền lớn trước
    const doneItems = listItems.filter(i => i.isDone);

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-end justify-center backdrop-blur-md animate-fadeIn safe-pb">
            {/* Click outside to close area */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-white/95 backdrop-blur-xl rounded-t-[32px] w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border-t border-white/50 relative z-10 transition-all">
                {/* Header Compact */}
                <div className="px-5 pt-4 pb-2 flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-tighter flex items-center gap-2">
                            <Clock size={16} className="text-indigo-600"/> Chi Cố Định
                        </h3>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">T{viewDate.getMonth() + 1}/{viewDate.getFullYear()}</span>
                    </div>
                    <button onClick={onClose} className="bg-slate-100 p-1.5 rounded-full text-slate-400 hover:bg-slate-200 transition-colors"><X size={16}/></button>
                </div>

                {/* Hero Summary - COMPACT STRIP */}
                <div className="px-4 pb-2">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-3 text-white shadow-lg shadow-indigo-200">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <span className="text-[8px] font-black uppercase opacity-70 tracking-wider block mb-0.5">Tổng ngân sách</span>
                                <span className="text-sm font-black tracking-tight leading-none">{formatCurrency(totalBudget)}</span>
                            </div>
                            <div className="text-right">
                                 <span className="text-[8px] font-black uppercase opacity-70 tracking-wider block mb-0.5">Cần chi</span>
                                 <span className="text-sm font-black text-yellow-300 tracking-tight leading-none">{formatCurrency(totalRemaining)}</span>
                            </div>
                        </div>
                         {/* Slim Progress Bar */}
                         <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-white h-full rounded-full transition-all duration-700" style={{width: `${Math.min(100, progressPercent)}%`}}></div>
                        </div>
                    </div>
                </div>

                {/* Lists Area */}
                <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 no-scrollbar">
                    
                    {/* 1. Pending List - COMPACT ITEMS */}
                    {pendingItems.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 pl-1">
                                <AlertTriangle size={10}/> Chưa xong ({pendingItems.length})
                            </div>
                            {pendingItems.map(item => {
                                const currentInput = fixedPaymentInputs[item.category] !== undefined 
                                    ? fixedPaymentInputs[item.category] 
                                    : (item.rem > 0 ? formatCurrency(item.rem) : '');

                                return (
                                    <div key={item.category} className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 group hover:border-indigo-100 transition-all">
                                        {/* Row 1: Icon + Info + Amount */}
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100/50">
                                                <Clock size={14} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h4 className="font-black text-slate-700 text-[11px] uppercase truncate pr-2">{item.category}</h4>
                                                    <span className="text-[11px] font-black text-rose-500 whitespace-nowrap">{formatCurrency(item.rem)}</span>
                                                </div>
                                                {/* Tiny Progress */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500" style={{width: `${item.progress}%`}}></div>
                                                    </div>
                                                    <span className="text-[8px] font-bold text-slate-400 w-5 text-right">{Math.round(item.progress)}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Compact Action (Input + Button) */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-8 bg-slate-50 border border-slate-100 rounded-lg px-2 flex items-center focus-within:bg-white focus-within:border-indigo-200 focus-within:shadow-sm transition-all">
                                                <input 
                                                    type="text" 
                                                    inputMode="numeric"
                                                    value={currentInput}
                                                    onChange={(e) => handleAmountInput(e.target.value, (v)=>setFixedPaymentInputs(p=>({...p, [item.category]: v})))}
                                                    className="w-full bg-transparent border-none outline-none text-[11px] font-black text-slate-700 placeholder:text-slate-300"
                                                    placeholder="Nhập số tiền..."
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handlePay(item)}
                                                className="h-8 px-3 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all whitespace-nowrap"
                                            >
                                                Chi
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 2. Done List - COMPACT ROW */}
                    {doneItems.length > 0 && (
                        <div className="space-y-1.5 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                             <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-500 pl-1 mt-2 border-t border-slate-100 pt-2">
                                <Check size={10}/> Đã xong ({doneItems.length})
                            </div>
                            {doneItems.map(item => (
                                <div key={item.category} className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase ml-1 truncate">{item.category}</span>
                                    <div className="text-green-600 text-[9px] font-black uppercase flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded-md">
                                        <Check size={8} strokeWidth={3}/> Xong
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {fixedTemplate.length === 0 && (
                         <div className="flex flex-col items-center justify-center py-8 opacity-40">
                            <Clock size={32} className="text-slate-300 mb-1"/>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Trống</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalFixedTracking;

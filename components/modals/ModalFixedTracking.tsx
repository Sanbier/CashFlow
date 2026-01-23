
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

            <div className="bg-white/90 backdrop-blur-xl rounded-t-[40px] w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border-t border-white/50 relative z-10 transition-all">
                {/* Header Compact */}
                <div className="p-6 pb-2 flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter flex items-center gap-2">
                            <Clock size={20} className="text-indigo-600"/> Chi Cố Định
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}</span>
                    </div>
                    <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:bg-slate-200 transition-colors"><X size={18}/></button>
                </div>

                {/* Hero Card - Liquid Style */}
                <div className="px-6 py-4">
                    <div className="relative w-full h-32 rounded-[28px] overflow-hidden shadow-lg shadow-indigo-300/50 group">
                        {/* Animated Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient-xy"></div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-1000"></div>
                        <div className="absolute top-10 -left-10 w-32 h-32 bg-blue-400/30 rounded-full blur-2xl"></div>

                        {/* Content */}
                        <div className="relative z-10 p-5 h-full flex flex-col justify-between text-white">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Tổng ngân sách: {formatCurrency(totalBudget)}</span>
                                <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20">
                                    <span className="text-[10px] font-bold">{Math.round(progressPercent)}%</span>
                                </div>
                            </div>
                            
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-70 block mb-1">Cần thanh toán ngay</span>
                                <div className="text-3xl font-black tracking-tight drop-shadow-sm flex items-baseline gap-1">
                                    {formatCurrency(totalRemaining)} <span className="text-sm font-medium opacity-60">VNĐ</span>
                                </div>
                            </div>
                            
                            {/* Slim Progress Bar */}
                            <div className="w-full bg-black/20 h-1 rounded-full mt-1 overflow-hidden">
                                <div className="bg-white h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-700" style={{width: `${Math.min(100, progressPercent)}%`}}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lists Area */}
                <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-6 no-scrollbar">
                    
                    {/* 1. Pending List */}
                    {pendingItems.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 pl-2">
                                <AlertTriangle size={12}/> Chưa hoàn thành ({pendingItems.length})
                            </div>
                            {pendingItems.map(item => {
                                const currentInput = fixedPaymentInputs[item.category] !== undefined 
                                    ? fixedPaymentInputs[item.category] 
                                    : (item.rem > 0 ? formatCurrency(item.rem) : '');

                                return (
                                    <div key={item.category} className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm shadow-slate-100 flex flex-col gap-3 group hover:border-indigo-100 transition-all">
                                        {/* Info Row */}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                                    <Clock size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-700 text-xs uppercase tracking-tight">{item.category}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full" style={{width: `${item.progress}%`}}></div>
                                                        </div>
                                                        <span className="text-[9px] font-bold text-slate-400">{Math.round(item.progress)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Còn thiếu</span>
                                                <span className="text-sm font-black text-rose-500">{formatCurrency(item.rem)}</span>
                                            </div>
                                        </div>

                                        {/* Action Row (Input + Button) */}
                                        <div className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-indigo-200 focus-within:shadow-sm transition-all">
                                            <input 
                                                type="text" 
                                                inputMode="numeric"
                                                value={currentInput}
                                                onChange={(e) => handleAmountInput(e.target.value, (v)=>setFixedPaymentInputs(p=>({...p, [item.category]: v})))}
                                                className="flex-1 bg-transparent border-none outline-none text-xs font-black text-slate-700 pl-3 placeholder:text-slate-300"
                                                placeholder="Nhập số tiền..."
                                            />
                                            <button 
                                                onClick={() => handlePay(item)}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                                            >
                                                Chi ngay
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 2. Done List */}
                    {doneItems.length > 0 && (
                        <div className="space-y-3 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-500 pl-2 mt-4 border-t border-slate-100 pt-4">
                                <Check size={12}/> Đã xong ({doneItems.length})
                            </div>
                            {doneItems.map(item => (
                                <div key={item.category} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase ml-2">{item.category}</span>
                                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <Check size={10}/> Hoàn tất
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {fixedTemplate.length === 0 && (
                         <div className="flex flex-col items-center justify-center py-10 opacity-40">
                            <Clock size={40} className="text-slate-300 mb-2"/>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chưa thiết lập danh mục</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalFixedTracking;

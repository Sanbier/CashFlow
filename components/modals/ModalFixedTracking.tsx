
import React, { useState } from 'react';
import { Clock, X } from '../../constants';
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
        
        // Lấy giá trị từ input, nếu không có thì lấy số dư làm mặc định để parse
        const valStr = fixedPaymentInputs[item.category];
        const amountToPay = valStr ? parseAmount(valStr) : defaultVal;

        onConfirmPayment(item, amountToPay);
        
        // Reset input
        setFixedPaymentInputs(prev => ({...prev, [item.category]: ''}));
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-end justify-center backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-50 rounded-t-[40px] w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border-t border-white/20">
                <div className="p-6 pb-2 bg-white rounded-t-[40px] flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200"><Clock size={20}/></div>
                        <div>
                            <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight leading-none">Chi Cố Định</h3>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-gray-100 p-2.5 rounded-full text-gray-400 hover:bg-gray-200 transition-colors"><X size={20}/></button>
                </div>

                <div className="px-6 py-4 bg-white border-b border-gray-100">
                    {(() => {
                        const totalFixedBudget = fixedTemplate.reduce((acc, item) => acc + item.amount, 0);
                        const totalFixedPaid = fixedTemplate.reduce((acc, item) => acc + getMonthlyPaidForCategory(item.category), 0);
                        const totalFixedRemaining = totalFixedBudget - totalFixedPaid;
                        const overallProgress = totalFixedBudget > 0 ? (totalFixedPaid / totalFixedBudget) * 100 : 0;

                        return (
                            <div className="bg-gradient-to-r from-slate-800 to-gray-900 rounded-[28px] p-5 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng Ngân Sách</div>
                                            <div className="text-2xl font-black tracking-tight">{formatCurrency(totalFixedBudget)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đã chi</div>
                                            <div className="text-lg font-bold text-white/90">{formatCurrency(totalFixedPaid)}</div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-full h-2 mb-3 overflow-hidden backdrop-blur-sm">
                                        <div className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-700" style={{width: `${Math.min(100, overallProgress)}%`}}></div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                        <span className="text-emerald-400">Còn lại: {formatCurrency(totalFixedRemaining)}</span>
                                        <span className="text-slate-500">{Math.round(overallProgress)}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-4 no-scrollbar pb-32 bg-slate-50">
                    {fixedTemplate.map(item => {
                        const paid = getMonthlyPaidForCategory(item.category); 
                        const rem = item.amount - paid; 
                        const done = rem <= 0;
                        const progress = Math.min(100, (paid/item.amount)*100);
                        // Tự tính default value nếu chưa nhập
                        const currentInput = fixedPaymentInputs[item.category] !== undefined 
                            ? fixedPaymentInputs[item.category] 
                            : (rem > 0 ? formatCurrency(rem) : '');
                        
                        return (
                            <div key={item.category} className={`bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm transition-all ${done ? 'opacity-60 grayscale' : 'hover:shadow-md'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-8 rounded-full ${done ? 'bg-green-500' : 'bg-gradient-to-b from-indigo-500 to-purple-500'}`}></div>
                                        <div>
                                            <h4 className="font-black text-gray-800 text-sm uppercase tracking-tight">{item.category}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Mục tiêu: {formatCurrency(item.amount)}</p>
                                        </div>
                                    </div>
                                    {done ? (
                                            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Hoàn thành</span>
                                    ) : (
                                            <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Còn: {formatCurrency(rem)}</span>
                                    )}
                                </div>

                                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                                    <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${done ? 'bg-green-500' : (progress > 80 ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-indigo-400 to-purple-500')}`} style={{width: `${progress}%`}}></div>
                                </div>

                                {!done && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 relative group">
                                            <input 
                                                type="text" 
                                                inputMode="numeric" 
                                                value={currentInput} 
                                                onChange={(e) => handleAmountInput(e.target.value, (v)=>setFixedPaymentInputs(p=>({...p, [item.category]: v})))} 
                                                className="w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300" 
                                                placeholder="Nhập số tiền..." 
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">VNĐ</div>
                                        </div>
                                        <button 
                                            onClick={() => handlePay(item)} 
                                            className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-indigo-200 uppercase tracking-widest active:scale-95 transition-all hover:to-purple-700"
                                        >
                                            Chi
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {fixedTemplate.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
                            <Clock size={48} className="text-gray-300 mb-4"/>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Chưa có mục cố định nào</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalFixedTracking;

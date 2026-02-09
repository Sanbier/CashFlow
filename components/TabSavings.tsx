
import React from 'react';
import { PiggyBank } from '../constants';
import { SAVING_CATEGORIES } from '../constants';
import { formatCurrency } from '../utils';
import { Expense } from '../types';

interface TabSavingsProps {
    totalAccumulated: number;
    expenses: Expense[];
    onOpenSavingForm: () => void;
}

const TabSavings: React.FC<TabSavingsProps> = ({ totalAccumulated, expenses, onOpenSavingForm }) => {
    return (
        <div className="space-y-6 animate-fadeIn mt-2">
            <div className="glass-panel p-6 rounded-[32px] shadow-lg border border-white/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-rose-200/30 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="flex justify-between items-center mb-6 border-b border-rose-100/50 pb-4 relative z-10">
                    <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest"><PiggyBank size={18} className="text-rose-500"/> Heo Đất Tiết Kiệm</h3>
                    <button onClick={onOpenSavingForm} className="bg-gradient-to-r from-rose-400 to-pink-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest btn-effect shadow-lg shadow-rose-200/50 hover:shadow-rose-300">Nạp Heo</button>
                </div>
                
                <div className="text-center mb-10 relative z-10">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Tổng tích lũy</div>
                    <div className="text-3xl font-black text-rose-500 tracking-tight">{formatCurrency(totalAccumulated)} <span className="text-sm text-slate-400">VNĐ</span></div>
                </div>

                <div className="space-y-4 relative z-10">
                    {SAVING_CATEGORIES.map(cat => {
                         const total = expenses.filter(e => e.category === cat).reduce((sum, item) => sum + item.amount, 0);
                         return (
                            <div key={cat} className="bg-gradient-to-r from-rose-50/80 to-pink-50/50 p-4 rounded-2xl border border-rose-100 flex justify-between items-center hover:bg-rose-50 transition-all">
                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{cat}</span>
                                <span className="font-black text-rose-600 text-sm">{formatCurrency(total)} VNĐ</span>
                            </div>
                         );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TabSavings;

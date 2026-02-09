
import React from 'react';
import { PieChart } from '../constants';
import { Expense } from '../types';
import { formatCurrency } from '../utils';

interface TabReportProps {
    expenses: Expense[];
    sumExpense: number; 
}

const TabReport: React.FC<TabReportProps> = ({ expenses, sumExpense }) => {
    return (
        <div className="space-y-6 animate-fadeIn mt-2">
            <div className="glass-panel p-6 rounded-[32px] relative overflow-hidden border border-white/60">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-300/30 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <h3 className="font-black text-slate-800 mb-8 flex items-center gap-2 border-b border-indigo-100 pb-4 uppercase text-xs tracking-[0.2em] relative z-10"><PieChart size={18} className="text-indigo-600"/> Phân tích chi tiêu</h3>
                <div className="space-y-7 relative z-10">
                    {Object.entries(expenses.reduce((a,c)=>{a[c.category]=(a[c.category]||0)+c.amount; return a;}, {} as any)).sort(([,a],[,b]) => (b as number)-(a as number)).map(([cat, amt]) => {
                        const pct = sumExpense > 0 ? Math.round(((amt as number)/sumExpense)*100) : 0;
                        const isHighUsage = pct > 30;
                        const progressBarColor = isHighUsage 
                            ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500' 
                            : 'bg-gradient-to-r from-indigo-300 to-violet-500';
                        
                        const textColor = isHighUsage ? 'text-rose-500' : 'text-indigo-500';

                        return (
                            <div key={cat} className="animate-fadeIn group">
                                <div className="flex justify-between text-[11px] font-black mb-2 uppercase tracking-tight">
                                    <span className="text-slate-500 group-hover:text-slate-700 transition-colors">{cat}</span>
                                    <span className="text-slate-800">{formatCurrency(amt as number)} <span className={`${textColor} font-bold ml-1 opacity-80`}>({pct}%)</span></span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-white/60 p-0.5 shadow-inner">
                                    <div className={`${progressBarColor} h-full rounded-full transition-all duration-1000 ease-out shadow-sm`} style={{width: `${Math.min(pct,100)}%`}}></div>
                                </div>
                            </div>
                        );
                    })}
                    {expenses.length === 0 && <div className="text-center py-12 text-slate-400 text-[10px] font-black uppercase tracking-widest">Không có dữ liệu</div>}
                </div>
            </div>
        </div>
    );
};

export default TabReport;

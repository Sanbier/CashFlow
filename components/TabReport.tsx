
import React from 'react';
import { PieChart } from '../constants';
import { Expense } from '../types';
import { formatCurrency } from '../utils';

interface TabReportProps {
    expenses: Expense[];
    sumIncome: number;
}

const TabReport: React.FC<TabReportProps> = ({ expenses, sumIncome }) => {
    return (
        <div className="space-y-6 animate-fadeIn mt-2">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-50 pb-4 uppercase text-sm tracking-widest"><PieChart size={18} className="text-indigo-600"/> Phân tích chi tiêu</h3>
                <div className="space-y-6">
                    {Object.entries(expenses.reduce((a,c)=>{a[c.category]=(a[c.category]||0)+c.amount; return a;}, {} as any)).sort(([,a],[,b]) => (b as number)-(a as number)).map(([cat, amt]) => {
                        const pct = sumIncome > 0 ? Math.round(((amt as number)/sumIncome)*100) : 0;
                        
                        // Logic màu sắc: > 30% là mức cảnh báo (Vàng -> Đỏ), ngược lại là bình thường (Indigo -> Purple)
                        const isHighUsage = pct > 30;
                        const progressBarColor = isHighUsage 
                            ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 shadow-red-200' 
                            : 'bg-gradient-to-r from-indigo-400 to-purple-500 shadow-indigo-200';
                        
                        const textColor = isHighUsage ? 'text-red-500' : 'text-indigo-400';

                        return (
                            <div key={cat} className="animate-fadeIn">
                                <div className="flex justify-between text-[11px] font-black mb-2 uppercase tracking-tight">
                                    <span className="text-gray-500">{cat}</span>
                                    <span className="text-gray-900">{formatCurrency(amt as number)} VNĐ <span className={`${textColor} font-bold ml-1`}>({pct}%)</span></span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-50 shadow-inner">
                                    <div className={`${progressBarColor} h-full rounded-full transition-all duration-700 ease-out shadow-sm`} style={{width: `${Math.min(pct,100)}%`}}></div>
                                </div>
                            </div>
                        );
                    })}
                    {expenses.length === 0 && <div className="text-center py-12 text-gray-400 text-[10px] font-black uppercase tracking-widest">Không có dữ liệu</div>}
                </div>
            </div>
        </div>
    );
};

export default TabReport;

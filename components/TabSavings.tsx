
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
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                    <h3 className="font-black text-gray-800 flex items-center gap-2 uppercase text-sm tracking-widest"><PiggyBank size={18} className="text-rose-500"/> Heo Đất Tiết Kiệm</h3>
                    <button onClick={onOpenSavingForm} className="bg-gradient-to-r from-rose-400 to-pink-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter btn-effect shadow-md shadow-rose-200">Nạp Heo</button>
                </div>
                
                <div className="text-center mb-8">
                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tổng tích lũy</div>
                    <div className="text-3xl font-black text-rose-600">{formatCurrency(totalAccumulated)} VNĐ</div>
                </div>

                <div className="space-y-4">
                    {SAVING_CATEGORIES.map(cat => {
                         const total = expenses.filter(e => e.category === cat).reduce((sum, item) => sum + item.amount, 0);
                         return (
                            <div key={cat} className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-2xl border border-rose-100 flex justify-between items-center">
                                <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight">{cat}</span>
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

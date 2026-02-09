
import React, { useState } from 'react';
import { DEBT_CATEGORY_NAME, TrendingUp, TrendingDown, Clock, Edit2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trash2, Plus } from '../constants';
import { Debt } from '../types';
import { formatCurrency, handleAmountInput, handleTextInput, parseAmount } from '../utils';
import CustomDatePicker from './CustomDatePicker';

interface TabAddProps {
    categories: string[];
    debts: Debt[];
    onAddIncome: (source: string, amount: number, date: string, note: string) => void;
    onAddExpense: (category: string, amount: number, date: string, note: string, whoSpent: 'Ba' | 'Mẹ', selectedDebtorId: string) => void;
    getMonthlyPaid: (cat: string) => number;
    onUpdateCategories: (newCats: string[]) => void;
}

const TabAdd: React.FC<TabAddProps> = ({ categories, debts, onAddIncome, onAddExpense, getMonthlyPaid, onUpdateCategories }) => {
    const getLocalToday = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // UI State
    const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');

    // Income State
    const [incomeSource, setIncomeSource] = useState('');
    const [incomeAmount, setIncomeAmount] = useState('');
    const [incomeDate, setIncomeDate] = useState(getLocalToday());
    const [incomeNote, setIncomeNote] = useState('');

    // Expense State
    const [expenseCategory, setExpenseCategory] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseDate, setExpenseDate] = useState(getLocalToday());
    const [expenseNote, setExpenseNote] = useState('');
    const [selectedDebtorId, setSelectedDebtorId] = useState('');
    const [whoSpent, setWhoSpent] = useState<'Ba' | 'Mẹ'>('Ba');
    
    // Category Management State
    const [isCategoryManageMode, setIsCategoryManageMode] = useState(false);

    const submitIncome = () => {
        const amt = parseAmount(incomeAmount);
        if (!incomeSource || amt <= 0) return;
        onAddIncome(incomeSource, amt, incomeDate, incomeNote);
        setIncomeSource(''); setIncomeAmount(''); setIncomeNote('');
    };

    const submitExpense = () => {
        const amt = parseAmount(expenseAmount);
        if (!expenseCategory || amt <= 0) return;
        onAddExpense(expenseCategory, amt, expenseDate, expenseNote, whoSpent, selectedDebtorId);
        setExpenseCategory(''); setExpenseAmount(''); setExpenseNote(''); setSelectedDebtorId('');
    };

    // Category Handlers
    const handleMoveCategory = (index: number, direction: 'up' | 'down' | 'left' | 'right') => {
        let targetIndex = index;
        if (direction === 'left') targetIndex = index - 1;
        else if (direction === 'right') targetIndex = index + 1;
        else if (direction === 'up') targetIndex = index - 3;
        else if (direction === 'down') targetIndex = index + 3;

        if (targetIndex >= 0 && targetIndex < categories.length) {
            const newCats = [...categories];
            [newCats[index], newCats[targetIndex]] = [newCats[targetIndex], newCats[index]];
            onUpdateCategories(newCats);
        }
    };

    const handleDeleteCategory = (catToDelete: string) => {
        if (!confirm(`Xác nhận xóa danh mục "${catToDelete}"?`)) return;
        onUpdateCategories(categories.filter(c => c !== catToDelete));
    };

    const handleRenameCategory = (oldName: string) => {
        const rawName = prompt(`Sửa tên danh mục:`, oldName);
        if (rawName) {
            const newName = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            if (newName !== oldName) {
                onUpdateCategories(categories.map(c => c === oldName ? newName : c));
            }
        }
    };

    const handleAddCustomCategory = () => {
        const rawName = prompt("Nhập tên danh mục mới:");
        if (rawName) {
            const name = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            if (!categories.includes(name)) onUpdateCategories([...categories, name]);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Tab Switcher - More refined */}
            <div className="glass-panel p-1.5 rounded-2xl flex mb-2 relative z-20 shadow-sm">
                <button 
                    onClick={() => setActiveTab('income')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'income' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200/50' : 'text-slate-400 hover:text-emerald-600 hover:bg-white/40'}`}
                >
                    <TrendingUp size={14} /> Thu Nhập
                </button>
                <button 
                    onClick={() => setActiveTab('expense')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'expense' ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-200/50' : 'text-slate-400 hover:text-rose-600 hover:bg-white/40'}`}
                >
                    <TrendingDown size={14} /> Chi Tiêu
                </button>
            </div>

            {/* Nhập Thu Nhập (Liquid Card) */}
            {activeTab === 'income' && (
                <div className="glass-panel rounded-[32px] p-6 relative overflow-hidden group animate-slideUp">
                    {/* Background Decor */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-300/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                    
                    <div className="flex items-center gap-2 text-emerald-600 font-black mb-6 uppercase text-xs tracking-widest relative z-10 border-b border-emerald-100/50 pb-2">
                         Nhập khoản thu
                    </div>
                    <div className="space-y-4 relative z-10">
                        <input type="text" placeholder="Nguồn thu (Lương, Thưởng...)" value={incomeSource} onChange={e=>handleTextInput(e.target.value, setIncomeSource)} className="w-full p-4 glass-input font-bold text-slate-700 placeholder:text-slate-400 text-sm"/>
                        <div className="flex gap-3">
                            <input type="text" inputMode="numeric" placeholder="Số tiền..." value={incomeAmount} onChange={e=>handleAmountInput(e.target.value, setIncomeAmount)} className="w-1/2 p-4 glass-input font-black text-emerald-600 text-lg"/>
                            <CustomDatePicker value={incomeDate} onChange={e=>setIncomeDate(e.target.value)} className="flex-1 glass-input border-none" />
                        </div>
                        <input type="text" placeholder="Ghi chú (tùy chọn)..." value={incomeNote} onChange={e=>handleTextInput(e.target.value, setIncomeNote)} className="w-full p-4 glass-input font-medium text-slate-600 text-sm"/>
                        <button onClick={submitIncome} disabled={!incomeSource || !incomeAmount} className="w-full py-4 bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-200/40 btn-effect uppercase text-xs tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed">Lưu Thu Nhập</button>
                    </div>
                </div>
            )}
            
            {/* Nhập Chi Tiêu (Liquid Card) */}
            {activeTab === 'expense' && (
                <div className="glass-panel rounded-[32px] p-6 relative overflow-hidden group animate-slideUp">
                     {/* Background Decor */}
                     <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-rose-300/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>

                    <div className="flex items-center justify-between mb-4 relative z-10 border-b border-rose-100/50 pb-2">
                        <div className="flex items-center gap-2 text-rose-600 font-black uppercase text-xs tracking-widest"> Chọn danh mục</div>
                        <button onClick={() => setIsCategoryManageMode(!isCategoryManageMode)} className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border backdrop-blur-sm transition-all ${isCategoryManageMode ? 'bg-slate-800 text-white border-slate-700 shadow-md' : 'bg-white/50 text-slate-500 border-white/60 hover:bg-white/90'}`}>{isCategoryManageMode ? 'Xong' : 'Sửa Mục'}</button>
                    </div>
                    <div className="space-y-5 relative z-10">
                        <div className="grid grid-cols-3 gap-2">
                            {categories.map((cat, idx) => (
                                <div key={cat} className="relative h-[72px]">
                                    {isCategoryManageMode ? (
                                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl flex flex-col items-center justify-between p-1 z-20 shadow-lg animate-fadeIn">
                                            <span className="text-[7px] font-extrabold text-slate-600 truncate w-full text-center uppercase tracking-tighter pt-1">{cat}</span>
                                            <div className="grid grid-cols-3 gap-0.5 w-full place-items-center pb-0.5">
                                                <button onClick={() => handleMoveCategory(idx, 'up')} className="p-0.5 text-slate-400 hover:text-slate-600"><ChevronUp size={12}/></button>
                                                <button onClick={() => handleRenameCategory(cat)} className="p-0.5 text-indigo-500"><Edit2 size={10}/></button>
                                                <button onClick={() => handleMoveCategory(idx, 'down')} className="p-0.5 text-slate-400 hover:text-slate-600"><ChevronDown size={12}/></button>
                                                <button onClick={() => handleMoveCategory(idx, 'left')} className="p-0.5 text-slate-400 hover:text-slate-600"><ChevronLeft size={12}/></button>
                                                <button onClick={() => handleDeleteCategory(cat)} className="p-0.5 text-rose-500"><Trash2 size={12}/></button>
                                                <button onClick={() => handleMoveCategory(idx, 'right')} className="p-0.5 text-slate-400 hover:text-slate-600"><ChevronRight size={12}/></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setExpenseCategory(cat)} className={`category-btn w-full h-full text-[10px] font-bold rounded-2xl border transition-all duration-300 ${expenseCategory === cat ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-white border-transparent shadow-lg shadow-rose-200 scale-105 z-10' : 'bg-white/50 text-slate-600 border-white/60 hover:bg-white/80 hover:border-white'}`}>{cat}</button>
                                    )}
                                </div>
                            ))}
                            {!isCategoryManageMode && <button onClick={handleAddCustomCategory} className="category-btn h-[72px] text-[10px] font-bold rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 hover:bg-white/40 hover:border-indigo-300 hover:text-indigo-500 transition-all"><Plus size={20}/></button>}
                        </div>
                        
                        {expenseCategory && !isCategoryManageMode && (
                            <div className="bg-indigo-50/60 backdrop-blur-md border border-indigo-100 p-3 rounded-2xl animate-fadeIn flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-2">
                                    <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><Clock size={12}/></div>
                                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tight">Tháng này đã tiêu:</span>
                                </div>
                                <span className="text-sm font-black text-indigo-800">{formatCurrency(getMonthlyPaid(expenseCategory))}</span>
                            </div>
                        )}

                        {expenseCategory === DEBT_CATEGORY_NAME && (
                            <div className="bg-blue-50/60 backdrop-blur-md border border-blue-200 p-3 rounded-2xl animate-fadeIn shadow-inner">
                                <label className="text-[9px] font-black text-blue-700 uppercase mb-1 block tracking-widest pl-1">Người liên quan:</label>
                                <select value={selectedDebtorId} onChange={(e) => setSelectedDebtorId(e.target.value)} className="w-full p-2.5 bg-white/70 border border-blue-200 rounded-xl text-xs font-black outline-none shadow-sm focus:ring-2 focus:ring-blue-100 transition-all text-slate-700">
                                    <option value="">-- Chọn Sổ Nợ --</option>
                                    {[...debts]
                                        .filter(d => d.total - d.paid > 0)
                                        .sort((a, b) => {
                                            if (a.type === 'payable' && b.type !== 'payable') return -1;
                                            if (a.type !== 'payable' && b.type === 'payable') return 1;
                                            return 0;
                                        })
                                        .map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.type === 'receivable' ? 'THU: ' : 'TRẢ: '}{d.name} (Còn: {formatCurrency(d.total - d.paid)})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <input type="text" inputMode="numeric" placeholder="Số tiền..." value={expenseAmount} onChange={e=>handleAmountInput(e.target.value, setExpenseAmount)} className="w-1/2 p-4 glass-input font-black text-rose-600 text-lg"/>
                            <CustomDatePicker value={expenseDate} onChange={e=>setExpenseDate(e.target.value)} className="flex-1 glass-input border-none" />
                        </div>

                        {expenseCategory === "Cá Nhân (Ba-Mẹ)" && (
                            <div className="flex gap-2 animate-fadeIn">
                                <button onClick={() => setWhoSpent('Ba')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all ${whoSpent === 'Ba' ? 'bg-indigo-100/80 text-indigo-700 border-indigo-200 shadow-sm' : 'bg-white/40 text-slate-400 border-white/50'}`}>Ba Chi</button>
                                <button onClick={() => setWhoSpent('Mẹ')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all ${whoSpent === 'Mẹ' ? 'bg-pink-100/80 text-pink-700 border-pink-200 shadow-sm' : 'bg-white/40 text-slate-400 border-white/50'}`}>Mẹ Chi</button>
                            </div>
                        )}

                        <input type="text" placeholder="Ghi chú (tùy chọn)..." value={expenseNote} onChange={e=>handleTextInput(e.target.value, setExpenseNote)} className="w-full p-4 glass-input font-medium text-slate-600 text-sm"/>
                        <button onClick={submitExpense} disabled={!expenseCategory || !expenseAmount} className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black rounded-2xl shadow-xl shadow-rose-200/40 btn-effect uppercase text-xs tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed">Lưu Chi Tiêu</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TabAdd;

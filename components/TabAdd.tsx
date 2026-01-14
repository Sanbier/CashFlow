
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
        <div className="space-y-6 animate-fadeIn mt-2">
            {/* Nhập Thu Nhập */}
            <div className="bg-white border border-green-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-green-400 to-green-600"></div>
                <div className="flex items-center gap-2 text-green-700 font-bold mb-3 uppercase text-xs tracking-widest"><TrendingUp size={16}/> 1. Thu Nhập</div>
                <div className="space-y-3 pl-2">
                    <input type="text" placeholder="Nguồn thu (Lương, Thưởng...)" value={incomeSource} onChange={e=>handleTextInput(e.target.value, setIncomeSource)} className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium input-effect text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"/>
                    <div className="flex gap-3">
                        <input type="text" inputMode="numeric" placeholder="Số tiền..." value={incomeAmount} onChange={e=>handleAmountInput(e.target.value, setIncomeAmount)} className="w-1/2 p-3 bg-white border border-gray-300 rounded-xl font-black text-gray-700 text-lg input-effect focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"/>
                        <CustomDatePicker value={incomeDate} onChange={e=>setIncomeDate(e.target.value)} className="flex-1" />
                    </div>
                    <input type="text" placeholder="Ghi chú (tùy chọn)..." value={incomeNote} onChange={e=>handleTextInput(e.target.value, setIncomeNote)} className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium input-effect text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"/>
                    <button onClick={submitIncome} disabled={!incomeSource || !incomeAmount} className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-xl shadow-lg shadow-green-200 btn-effect uppercase text-xs tracking-[0.2em] transition-all disabled:opacity-30">Lưu Thu Nhập</button>
                </div>
            </div>
            
            {/* Nhập Chi Tiêu */}
            <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-red-400 to-red-600"></div>
                <div className="flex items-center justify-between mb-3 pl-2">
                    <div className="flex items-center gap-2 text-red-700 font-bold uppercase text-xs tracking-widest"><TrendingDown size={16}/> 2. Chi Tiêu</div>
                    <button onClick={() => setIsCategoryManageMode(!isCategoryManageMode)} className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${isCategoryManageMode ? 'bg-gray-800 text-white border-gray-700 shadow-md' : 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-transparent shadow-md shadow-red-200'}`}>{isCategoryManageMode ? 'Xong' : 'Quản Lý Mục'}</button>
                </div>
                <div className="space-y-4 pl-2">
                    <div className="grid grid-cols-3 gap-2 pr-1">
                        {categories.map((cat, idx) => (
                            <div key={cat} className="relative h-[72px]">
                                {isCategoryManageMode ? (
                                    <div className="absolute inset-0 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-between p-1 z-20 shadow-sm animate-fadeIn">
                                        <span className="text-[7px] font-extrabold text-gray-400 truncate w-full text-center uppercase tracking-tighter">{cat}</span>
                                        <div className="grid grid-cols-3 gap-0.5 w-full place-items-center">
                                            <button onClick={() => handleMoveCategory(idx, 'up')} className="p-0.5 text-gray-400"><ChevronUp size={12}/></button>
                                            <button onClick={() => handleRenameCategory(cat)} className="p-0.5 text-blue-500"><Edit2 size={10}/></button>
                                            <button onClick={() => handleMoveCategory(idx, 'down')} className="p-0.5 text-gray-400"><ChevronDown size={12}/></button>
                                            <button onClick={() => handleMoveCategory(idx, 'left')} className="p-0.5 text-gray-400"><ChevronLeft size={12}/></button>
                                            <button onClick={() => handleDeleteCategory(cat)} className="p-0.5 text-red-500"><Trash2 size={12}/></button>
                                            <button onClick={() => handleMoveCategory(idx, 'right')} className="p-0.5 text-gray-400"><ChevronRight size={12}/></button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setExpenseCategory(cat)} className={`category-btn w-full h-full text-[10px] font-bold rounded-lg border transition-all ${expenseCategory === cat ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-600 shadow-lg scale-105 z-10 [text-shadow:0_0_5px_rgba(255,255,255,1)]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{cat}</button>
                                )}
                            </div>
                        ))}
                        {!isCategoryManageMode && <button onClick={handleAddCustomCategory} className="category-btn h-[72px] text-[10px] font-bold rounded-lg border border-dashed border-gray-400 text-gray-400 hover:bg-gray-50"><Plus size={20}/></button>}
                    </div>
                    
                    {expenseCategory && !isCategoryManageMode && (
                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl animate-fadeIn flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg text-white shadow-sm"><Clock size={12}/></div>
                                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tight">Đã tiêu tháng này :</span>
                            </div>
                            <span className="text-sm font-black text-indigo-800">{formatCurrency(getMonthlyPaid(expenseCategory))} VNĐ</span>
                        </div>
                    )}

                    {expenseCategory === DEBT_CATEGORY_NAME && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl animate-fadeIn shadow-inner">
                            <label className="text-[9px] font-black text-blue-700 uppercase mb-1 block tracking-widest pl-1">Người liên quan:</label>
                            <select value={selectedDebtorId} onChange={(e) => setSelectedDebtorId(e.target.value)} className="w-full p-2.5 bg-white border border-blue-300 rounded-lg text-xs font-black outline-none shadow-sm focus:ring-2 focus:ring-blue-100 transition-all">
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
                                            {d.type === 'receivable' ? 'THU: ' : 'TRẢ: '}{d.name} (Còn: {formatCurrency(d.total - d.paid)} VNĐ)
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <input type="text" inputMode="numeric" placeholder="Số tiền..." value={expenseAmount} onChange={e=>handleAmountInput(e.target.value, setExpenseAmount)} className="w-1/2 p-3 bg-white border border-gray-300 rounded-xl font-black text-gray-700 text-lg input-effect focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"/>
                        <CustomDatePicker value={expenseDate} onChange={e=>setExpenseDate(e.target.value)} className="flex-1" />
                    </div>

                    {expenseCategory === "Cá Nhân (Ba-Mẹ)" && (
                        <div className="flex gap-2 animate-fadeIn">
                            <button onClick={() => setWhoSpent('Ba')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${whoSpent === 'Ba' ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>Ba Chi</button>
                            <button onClick={() => setWhoSpent('Mẹ')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${whoSpent === 'Mẹ' ? 'bg-pink-100 text-pink-700 border-pink-300 shadow-sm' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>Mẹ Chi</button>
                        </div>
                    )}

                    <input type="text" placeholder="Ghi chú (tùy chọn)..." value={expenseNote} onChange={e=>handleTextInput(e.target.value, setExpenseNote)} className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium input-effect text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"/>
                    <button onClick={submitExpense} disabled={!expenseCategory || !expenseAmount} className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black rounded-xl shadow-lg shadow-red-200 btn-effect uppercase text-xs tracking-[0.2em] transition-all disabled:opacity-30">Lưu Chi Tiêu</button>
                </div>
            </div>
        </div>
    );
};

export default TabAdd;

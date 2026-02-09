
import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Edit2, Trash2, Check, X, Users } from '../constants';
import { Expense, Income } from '../types';
import { formatCurrency, formatDateTime, handleTextInput } from '../utils';

interface TabHistoryProps {
    incomes: Income[];
    expenses: Expense[];
    categories: string[];
    onDelete: (id: number, type: 'income' | 'expense') => void;
    onUpdateNote: (id: number, type: 'income' | 'expense', newNote: string) => void;
}

const TabHistory: React.FC<TabHistoryProps> = ({ incomes, expenses, categories, onDelete, onUpdateNote }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [viewType, setViewType] = useState<'all' | 'income' | 'expense'>('all'); // State phân nhánh Thu/Chi
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [tempNoteValue, setTempNoteValue] = useState('');

    // Hàm xử lý khi chuyển Tab loại giao dịch
    const handleViewTypeChange = (type: 'all' | 'income' | 'expense') => {
        setViewType(type);
        setFilterCategory('all'); // Reset bộ lọc danh mục khi chuyển tab để tránh nhầm lẫn
    };

    const combinedList = [...incomes.map(i=>({...i,type:'income'})), ...expenses.map(e=>({...e,type:'expense'}))]
        .sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime())
        .filter(item => {
            // 1. Lọc theo Tab (Phân nhánh)
            if (viewType === 'income' && item.type !== 'income') return false;
            if (viewType === 'expense' && item.type !== 'expense') return false;

            // 2. Lọc theo Từ khóa tìm kiếm
            const searchLower = searchTerm.toLowerCase();
            const text = ((item as any).source || (item as any).category).toLowerCase();
            const note = (item.note || '').toLowerCase();
            const amt = item.amount.toString();
            const matchesSearch = searchTerm === '' || text.includes(searchLower) || note.includes(searchLower) || amt.includes(searchLower);

            // 3. Lọc theo Dropdown Danh mục (Chỉ áp dụng cho Chi tiêu hoặc khi ở chế độ All)
            let matchesCategory = true;
            if (filterCategory !== 'all') {
                // Nếu item là expense thì so sánh category
                if (item.type === 'expense') {
                    matchesCategory = (item as any).category === filterCategory;
                } else {
                    // Nếu item là income mà đang lọc danh mục -> loại bỏ (vì Income ko có category này)
                    matchesCategory = false; 
                }
            }

            return matchesSearch && matchesCategory;
        });

    const handleSaveNote = (id: number, type: 'income' | 'expense') => {
        onUpdateNote(id, type, tempNoteValue);
        setEditingNoteId(null);
        setTempNoteValue('');
    };

    return (
        <div className="animate-fadeIn mt-2 space-y-3">
            {/* THANH CHUYỂN ĐỔI TAB THU / CHI */}
            <div className="flex p-1 bg-white/40 border border-white/60 rounded-2xl backdrop-blur-sm shadow-sm">
                <button 
                    onClick={() => handleViewTypeChange('all')} 
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'all' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                >
                    Tất cả
                </button>
                <button 
                    onClick={() => handleViewTypeChange('income')} 
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'income' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md shadow-green-200' : 'text-slate-500 hover:bg-white/50'}`}
                >
                    Thu Nhập
                </button>
                <button 
                    onClick={() => handleViewTypeChange('expense')} 
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'expense' ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md shadow-red-200' : 'text-slate-500 hover:bg-white/50'}`}
                >
                    Chi Tiêu
                </button>
            </div>

            <div className="flex gap-2 items-stretch">
                <div className="glass-panel p-1.5 rounded-xl flex gap-2 items-center group focus-within:bg-white/60 transition-all flex-1">
                    <div className="p-1.5 text-slate-400"><Search size={16}/></div>
                    <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="flex-1 bg-transparent outline-none text-[11px] font-bold uppercase tracking-widest placeholder:text-slate-400 text-slate-700 h-full py-1"/>
                </div>
                
                {/* Chỉ hiện Dropdown danh mục khi KHÔNG PHẢI là tab Thu Nhập */}
                {viewType !== 'income' && (
                    <div className="glass-panel rounded-xl flex items-center bg-white/40 animate-fadeIn">
                        <select 
                            value={filterCategory} 
                            onChange={(e) => setFilterCategory(e.target.value)} 
                            className="h-full px-2 py-1.5 bg-transparent outline-none text-[10px] font-black uppercase text-slate-600 border-none rounded-xl cursor-pointer min-w-[100px] max-w-[140px] truncate"
                        >
                            <option value="all">🔍 Tất cả danh mục</option>
                            <option disabled>──────────</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            
            <div className="space-y-2 pb-8">
                {combinedList.map(item => {
                    const isEditing = editingNoteId === item.id;
                    const isIncome = item.type === 'income';
                    
                    return (
                        <div key={`${item.type}-${item.id}`} className="p-3 flex items-start gap-3 glass-panel rounded-2xl hover:bg-white/60 transition-all group border-white/40 shadow-sm min-h-[64px]">
                            {/* Icon Compact */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5 ${isIncome ? 'bg-gradient-to-br from-green-50 to-emerald-100 text-green-600' : 'bg-gradient-to-br from-red-50 to-pink-100 text-red-500'}`}>
                                {isIncome ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                {/* Row 1: Title & Amount */}
                                <div className="flex justify-between items-start">
                                    <p className="font-black text-slate-700 text-[11px] uppercase tracking-tight truncate leading-tight pr-2">
                                        {(item as any).source || (item as any).category}
                                    </p>
                                    <p className={`font-black text-[12px] leading-tight whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                                        {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                                    </p>
                                </div>

                                {/* Row 2: Note/Date & Actions */}
                                <div className="flex justify-between items-end mt-1">
                                    <div className="flex-1 min-w-0 pr-2 relative">
                                        {isEditing ? (
                                            <div className="flex items-center gap-1 absolute top-0 left-0 w-full z-10 bg-white/90 p-1 rounded-lg border shadow-sm">
                                                <input
                                                    type="text"
                                                    value={tempNoteValue}
                                                    onChange={e => handleTextInput(e.target.value, setTempNoteValue)}
                                                    className="flex-1 text-[10px] bg-transparent outline-none text-slate-700"
                                                    autoFocus
                                                    placeholder="Nhập ghi chú..."
                                                />
                                                <button onClick={() => handleSaveNote(item.id, item.type as any)} className="text-green-600"><Check size={12}/></button>
                                                <button onClick={() => setEditingNoteId(null)} className="text-gray-400"><X size={12}/></button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                {item.note && (
                                                    <p className="text-[10px] text-slate-500 truncate italic leading-tight mb-0.5">
                                                        {item.note}
                                                    </p>
                                                )}
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                    {formatDateTime(item.date)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions Compact */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingNoteId(item.id); setTempNoteValue(item.note || ''); }} 
                                            className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 border border-blue-100"
                                        >
                                            <Edit2 size={10}/>
                                        </button>
                                        <button 
                                            onClick={()=>onDelete(item.id, item.type as any)} 
                                            className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 border border-red-100"
                                        >
                                            <Trash2 size={10}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {combinedList.length === 0 && <div className="p-8 text-center text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] glass-panel rounded-2xl border-dashed">Không tìm thấy giao dịch</div>}
            </div>
        </div>
    );
};

export default TabHistory;
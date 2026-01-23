
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
        <div className="animate-fadeIn mt-2 space-y-4">
            {/* THANH CHUYỂN ĐỔI TAB THU / CHI */}
            <div className="flex p-1 bg-white/40 border border-white/60 rounded-2xl backdrop-blur-sm shadow-sm">
                <button 
                    onClick={() => handleViewTypeChange('all')} 
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'all' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                >
                    Tất cả
                </button>
                <button 
                    onClick={() => handleViewTypeChange('income')} 
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'income' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md shadow-green-200' : 'text-slate-500 hover:bg-white/50'}`}
                >
                    Thu Nhập
                </button>
                <button 
                    onClick={() => handleViewTypeChange('expense')} 
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'expense' ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md shadow-red-200' : 'text-slate-500 hover:bg-white/50'}`}
                >
                    Chi Tiêu
                </button>
            </div>

            <div className="flex gap-2 items-stretch">
                <div className="glass-panel p-2 rounded-2xl flex gap-3 items-center group focus-within:bg-white/60 transition-all flex-1">
                    <div className="p-2 text-slate-400"><Search size={18}/></div>
                    <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="flex-1 bg-transparent outline-none text-xs font-bold uppercase tracking-widest placeholder:text-slate-400 text-slate-700 h-full py-2"/>
                </div>
                
                {/* Chỉ hiện Dropdown danh mục khi KHÔNG PHẢI là tab Thu Nhập */}
                {viewType !== 'income' && (
                    <div className="glass-panel rounded-2xl flex items-center bg-white/40 animate-fadeIn">
                        <select 
                            value={filterCategory} 
                            onChange={(e) => setFilterCategory(e.target.value)} 
                            className="h-full px-3 py-2 bg-transparent outline-none text-[10px] font-black uppercase text-slate-600 border-none rounded-2xl cursor-pointer min-w-[100px] max-w-[140px] truncate"
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
            
            <div className="space-y-3 pb-8">
                {combinedList.map(item => {
                    const isEditing = editingNoteId === item.id;
                    return (
                        <div key={`${item.type}-${item.id}`} className="p-4 flex justify-between items-center glass-panel rounded-3xl hover:bg-white/50 transition-all group border-white/40">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${item.type==='income'?'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-green-200/50':'bg-gradient-to-br from-red-400 to-pink-500 text-white shadow-red-200/50'}`}>
                                    {item.type==='income'?<TrendingUp size={22}/>:<TrendingDown size={22}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-700 text-[12px] truncate uppercase tracking-tight">{(item as any).source || (item as any).category}</p>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                value={tempNoteValue}
                                                onChange={e => handleTextInput(e.target.value, setTempNoteValue)}
                                                className="flex-1 p-2 text-[10px] bg-white/80 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-300"
                                                autoFocus
                                                placeholder="Nhập ghi chú..."
                                            />
                                            <button onClick={() => handleSaveNote(item.id, item.type as any)} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><Check size={12}/></button>
                                            <button onClick={() => setEditingNoteId(null)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"><X size={12}/></button>
                                        </div>
                                    ) : (
                                        <>
                                            {item.note && <p className="text-[11px] text-slate-500 font-bold truncate italic my-0.5 opacity-80">{item.note}</p>}
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{formatDateTime(item.date)}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="text-right pl-3">
                                <p className={`font-black text-[13px] ${item.type==='income'?'text-green-600':'text-red-500'}`}>{item.type==='income'?'+':'-'}{formatCurrency(item.amount)}</p>
                                <div className="flex justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingNoteId(item.id);
                                        setTempNoteValue(item.note || '');
                                    }} className="text-[9px] text-blue-500 font-bold uppercase tracking-widest p-1.5 bg-blue-100/50 hover:bg-blue-100 rounded-lg"><Edit2 size={12}/></button>
                                    <button onClick={()=>onDelete(item.id, item.type as any)} className="text-[9px] text-red-500 font-bold uppercase tracking-widest p-1.5 bg-red-100/50 hover:bg-red-100 rounded-lg"><Trash2 size={12}/></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {combinedList.length === 0 && <div className="p-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] glass-panel rounded-3xl">Không tìm thấy giao dịch</div>}
            </div>
        </div>
    );
};

export default TabHistory;


import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Edit2, Trash2, Check, X } from '../constants';
import { Expense, Income } from '../types';
import { formatCurrency, formatDateTime, handleTextInput } from '../utils';

interface TabHistoryProps {
    incomes: Income[];
    expenses: Expense[];
    onDelete: (id: number, type: 'income' | 'expense') => void;
    onUpdateNote: (id: number, type: 'income' | 'expense', newNote: string) => void;
}

const TabHistory: React.FC<TabHistoryProps> = ({ incomes, expenses, onDelete, onUpdateNote }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [tempNoteValue, setTempNoteValue] = useState('');

    const combinedList = [...incomes.map(i=>({...i,type:'income'})), ...expenses.map(e=>({...e,type:'expense'}))]
        .sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime())
        .filter(item => {
            const searchLower = searchTerm.toLowerCase();
            const text = ((item as any).source || (item as any).category).toLowerCase();
            const note = (item.note || '').toLowerCase();
            const amt = item.amount.toString();
            return searchTerm === '' || text.includes(searchLower) || note.includes(searchLower) || amt.includes(searchLower);
        });

    const handleSaveNote = (id: number, type: 'income' | 'expense') => {
        onUpdateNote(id, type, tempNoteValue);
        setEditingNoteId(null);
        setTempNoteValue('');
    };

    return (
        <div className="animate-fadeIn mt-2 space-y-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex gap-3 items-center group focus-within:ring-2 ring-blue-500/10 transition-all">
                <Search size={18} className="text-gray-300 group-focus-within:text-blue-500"/>
                <input type="text" placeholder="Tìm kiếm giao dịch..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="flex-1 outline-none text-xs font-black uppercase tracking-widest placeholder:text-gray-200"/>
            </div>
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {combinedList.map(item => {
                    const isEditing = editingNoteId === item.id;
                    return (
                        <div key={`${item.type}-${item.id}`} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-all group">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 ${item.type==='income'?'bg-gradient-to-br from-green-50 to-emerald-100 text-green-600 shadow-green-100':'bg-gradient-to-br from-red-50 to-rose-100 text-red-600 shadow-red-100'}`}>
                                    {item.type==='income'?<TrendingUp size={22}/>:<TrendingDown size={22}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-gray-800 text-[11px] truncate uppercase tracking-tight">{(item as any).source || (item as any).category}</p>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                value={tempNoteValue}
                                                onChange={e => handleTextInput(e.target.value, setTempNoteValue)}
                                                className="flex-1 p-1.5 text-[10px] bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                                                autoFocus
                                                placeholder="Nhập ghi chú..."
                                            />
                                            <button onClick={() => handleSaveNote(item.id, item.type as any)} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><Check size={12}/></button>
                                            <button onClick={() => setEditingNoteId(null)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"><X size={12}/></button>
                                        </div>
                                    ) : (
                                        <>
                                            {item.note && <p className="text-[10px] text-gray-500 font-medium truncate italic my-0.5">{item.note}</p>}
                                            {/* Sửa formatDate thành formatDateTime */}
                                            <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest mt-0.5">{formatDateTime(item.date)}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="text-right pl-2">
                                <p className={`font-black text-[13px] ${item.type==='income'?'text-green-600':'text-red-600'}`}>{item.type==='income'?'+':'-'}{formatCurrency(item.amount)} VNĐ</p>
                                <div className="flex justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingNoteId(item.id);
                                        setTempNoteValue(item.note || '');
                                    }} className="text-[9px] text-blue-400 font-black uppercase tracking-widest hover:text-blue-600 p-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg"><Edit2 size={12}/></button>
                                    <button onClick={()=>onDelete(item.id, item.type as any)} className="text-[9px] text-red-400 font-black uppercase tracking-widest hover:text-red-600 p-1 bg-gradient-to-br from-red-50 to-red-100 rounded-lg"><Trash2 size={12}/></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {combinedList.length === 0 && <div className="p-16 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.3em]">Lịch sử trống</div>}
            </div>
        </div>
    );
};

export default TabHistory;

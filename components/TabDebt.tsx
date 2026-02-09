
import React, { useState } from 'react';
import { Users, Trash2, ChevronUp, ChevronDown, Check, Edit2, History } from '../constants';
import { Debt } from '../types';
import { formatCurrency, handleAmountInput, handleTextInput, parseAmount } from '../utils';

interface TabDebtProps {
    debts: Debt[];
    onUpdateDebts: (newDebts: Debt[], syncIncome?: any, syncExpense?: any) => void;
    autoCreateTransaction: boolean;
    setAutoCreateTransaction: (v: boolean) => void;
}

const TabDebt: React.FC<TabDebtProps> = ({ debts, onUpdateDebts, autoCreateTransaction, setAutoCreateTransaction }) => {
    const [showDebtForm, setShowDebtForm] = useState(false);
    const [activeDebtTab, setActiveDebtTab] = useState<'payable' | 'receivable'>('payable');
    const [expandedDebtIds, setExpandedDebtIds] = useState<number[]>([]);
    const [showHistory, setShowHistory] = useState(false); // State để toggle phần lịch sử
    
    // Form State
    const [debtName, setDebtName] = useState('');
    const [debtTotal, setDebtTotal] = useState('');
    const [debtPaid, setDebtPaid] = useState('');
    const [debtNote, setDebtNote] = useState('');
    const [debtType, setDebtType] = useState<'payable' | 'receivable'>('payable');
    const [isEditingDebt, setIsEditingDebt] = useState<number | null>(null);

    const toggleDebtExpansion = (id: number) => {
        setExpandedDebtIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleEdit = (item: Debt) => {
        setDebtName(item.name);
        setDebtTotal(item.total.toLocaleString('vi-VN'));
        setDebtPaid(item.paid.toLocaleString('vi-VN'));
        setDebtNote(item.note || '');
        setDebtType(item.type);
        setIsEditingDebt(item.id);
        setShowDebtForm(true);
    };

    // Phân loại active và done
    const currentList = debts.filter(d => d.type === activeDebtTab);
    const activeDebts = currentList.filter(d => d.total - d.paid > 0);
    const doneDebts = currentList.filter(d => d.total - d.paid <= 0);

    return (
        <div className="space-y-4 animate-fadeIn mt-2">
             {!showDebtForm ? (
                <>
                    <div className="glass-panel p-5 rounded-[28px] shadow-sm border border-white/60 overflow-hidden relative group">
                         {/* Decor Background */}
                         <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-200/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>

                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <h3 className="font-black text-slate-700 flex items-center gap-2 uppercase text-[11px] tracking-widest"><Users className="text-indigo-600" size={16}/> Quản Lý Vay Mượn</h3>
                            <button onClick={() => { setShowDebtForm(true); setIsEditingDebt(null); setDebtName(''); setDebtTotal(''); setDebtPaid(''); setDebtNote(''); }} className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest btn-effect shadow-md shadow-indigo-200/50 hover:shadow-indigo-300 transition-all">Mới</button>
                        </div>
                        <div className="flex p-1 bg-white/40 border border-white/50 rounded-xl mb-4 backdrop-blur-sm">
                            <button onClick={()=>setActiveDebtTab('payable')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeDebtTab==='payable' ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}>Mình nợ</button>
                            <button onClick={()=>setActiveDebtTab('receivable')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeDebtTab==='receivable' ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}>Họ nợ</button>
                        </div>
                        
                        {/* STATS SUMMARY COMPACT - Premium Style */}
                        {(() => {
                            const sumTotal = currentList.reduce((acc, d) => acc + d.total, 0);
                            const sumPaid = currentList.reduce((acc, d) => acc + d.paid, 0);
                            const sumRemaining = sumTotal - sumPaid;
                            const isPayable = activeDebtTab === 'payable';

                            return (
                                <div className={`p-5 rounded-2xl text-white shadow-xl ${isPayable ? 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-200/50' : 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-200/50'} relative overflow-hidden`}>
                                    <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-20">
                                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" /></svg>
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div>
                                            <div className="text-[9px] font-black uppercase opacity-80 mb-1 tracking-widest">{isPayable ? 'Tổng tiền nợ' : 'Tổng cho vay'}</div>
                                            <div className="text-2xl font-black tracking-tight leading-none">{formatCurrency(sumTotal)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] font-black uppercase opacity-80 mb-1 tracking-widest">Còn lại</div>
                                            <div className="text-base font-black leading-none text-white/90">{formatCurrency(sumRemaining)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* DANH SÁCH ĐANG NỢ (ACTIVE) */}
                    <div className="flex flex-col gap-3 pb-4">
                        {activeDebts.map(item => {
                            let progressBarColor = activeDebtTab === 'receivable' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 'bg-gradient-to-r from-rose-500 to-pink-500';
                            if (activeDebtTab === 'payable') {
                                const percentage = (item.paid / item.total) * 100;
                                if (percentage >= 50) progressBarColor = 'bg-gradient-to-r from-amber-400 to-orange-500';
                                else progressBarColor = 'bg-gradient-to-r from-rose-500 to-pink-600';
                            }

                            return (
                                <div key={item.id} className="w-full glass-panel p-4 rounded-2xl border border-white/70 flex items-center gap-4 relative overflow-hidden group hover:bg-white/60 transition-all min-h-[72px]">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${activeDebtTab === 'payable' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                                    
                                    {/* Icon Percent Box */}
                                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-md text-white ${progressBarColor.replace('to-r', 'to-br')}`}>
                                        <span className="text-xs font-black leading-none">{Math.round((item.paid/item.total)*100)}%</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                                        <div className="flex justify-between items-center">
                                            <p className="font-black text-slate-700 text-xs uppercase truncate pr-2 leading-tight tracking-tight">
                                                {item.name}
                                            </p>
                                            <span className="text-[11px] font-black text-slate-600">
                                                {formatCurrency(item.total - item.paid)}
                                            </span>
                                        </div>
                                        
                                        {/* Slim Progress Bar */}
                                        <div className="w-full bg-slate-100/80 rounded-full h-1.5 overflow-hidden">
                                            <div className={`h-full rounded-full ${progressBarColor}`} style={{width: `${Math.min(100, (item.paid/item.total)*100)}%`}}></div>
                                        </div>

                                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 leading-none">
                                            <span>Đã trả: {formatCurrency(item.paid)}</span>
                                            <span>Tổng: {formatCurrency(item.total)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100">
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-2 bg-indigo-50 text-indigo-500 rounded-xl hover:bg-indigo-100 border border-indigo-100"><Edit2 size={14}/></button>
                                        <button onClick={(e)=>{ e.stopPropagation(); if(confirm('Xóa sổ nợ?')) onUpdateDebts(debts.filter(d => d.id !== item.id));}} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 border border-rose-100"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            );
                        })}
                        {activeDebts.length === 0 && <div className="text-center py-10 text-slate-400 text-[10px] font-black uppercase tracking-widest glass-panel rounded-2xl w-full border-dashed">Không có khoản nợ đang hoạt động</div>}
                    </div>

                    {/* DANH SÁCH ĐÃ XONG (DONE - HISTORY) */}
                    {doneDebts.length > 0 && (
                        <div className="pb-8 animate-fadeIn">
                             <button 
                                onClick={() => setShowHistory(!showHistory)} 
                                className="w-full py-3 glass-panel rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:bg-white/60 transition-all mb-3 shadow-sm border-dashed"
                             >
                                <History size={14}/> {showHistory ? 'Thu gọn lịch sử' : `Xem khoản đã hoàn thành (${doneDebts.length})`} 
                                {showHistory ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                             </button>

                             {showHistory && (
                                <div className="flex flex-wrap gap-2 animate-fadeIn">
                                    {doneDebts.map(item => {
                                        const isExpanded = expandedDebtIds.includes(item.id);
                                        
                                        // Nếu bấm vào thì hiển thị chi tiết (Card đầy đủ)
                                        if (isExpanded) {
                                            return (
                                                <div key={item.id} onClick={() => toggleDebtExpansion(item.id)} className="w-full glass-panel p-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex flex-col gap-2 relative group hover:bg-emerald-50/70 transition-all cursor-pointer">
                                                    <div className="flex justify-between items-center">
                                                         <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Check size={14}/></div>
                                                            <p className="font-black text-slate-700 text-[11px] uppercase">{item.name}</p>
                                                         </div>
                                                         <div className="flex gap-1">
                                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"><Edit2 size={10}/></button>
                                                            <button onClick={(e)=>{ e.stopPropagation(); if(confirm('Xóa sổ nợ?')) onUpdateDebts(debts.filter(d => d.id !== item.id));}} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={10}/></button>
                                                            <button className="p-1.5 bg-slate-50 text-slate-400 rounded-lg"><ChevronUp size={10}/></button>
                                                         </div>
                                                    </div>
                                                    <div className="flex justify-between text-[9px] font-bold text-slate-500 px-1">
                                                        <span>Tổng: {formatCurrency(item.total)}</span>
                                                        <span>Đã hoàn tất 100%</span>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Mặc định hiển thị CHIP/TAG SIÊU NHỎ GỌN (Thay vì ô vuông to)
                                        return (
                                            <div key={item.id} onClick={() => toggleDebtExpansion(item.id)} className="w-[48%] sm:w-[32%] flex-grow glass-panel bg-emerald-50/40 border-emerald-100 rounded-xl p-2 flex items-center gap-2 cursor-pointer hover:bg-emerald-100 transition-all shadow-sm active:scale-95 group">
                                                <div className="w-6 h-6 rounded-full bg-emerald-200/50 flex items-center justify-center text-emerald-700 flex-shrink-0">
                                                    <Check size={12} strokeWidth={4} />
                                                </div>
                                                <span className="text-[9px] font-black text-emerald-800 uppercase truncate flex-1 leading-none pt-0.5">{item.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                             )}
                        </div>
                    )}
                </>
             ) : (
                <div className="glass-panel p-6 rounded-[32px] shadow-xl border border-white/60 animate-fadeIn space-y-5 relative">
                     {/* Form Header */}
                     <div className="text-center mb-6">
                        <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight">{isEditingDebt ? 'Cập Nhật Hồ Sơ Nợ' : 'Tạo Hồ Sơ Nợ Mới'}</h3>
                        <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 mx-auto rounded-full mt-2"></div>
                     </div>

                    <div className="flex gap-3 mb-4">
                        <button disabled={!!isEditingDebt} onClick={()=>setDebtType('payable')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl border transition-all ${debtType==='payable'?'bg-rose-100/80 text-rose-700 border-rose-200 shadow-inner':'bg-white/40 text-slate-400 border-white/50'} ${isEditingDebt ? 'opacity-50 cursor-not-allowed' : ''}`}>Mình nợ</button>
                        <button disabled={!!isEditingDebt} onClick={()=>setDebtType('receivable')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl border transition-all ${debtType==='receivable'?'bg-indigo-100/80 text-indigo-700 border-indigo-200 shadow-inner':'bg-white/40 text-slate-400 border-white/50'} ${isEditingDebt ? 'opacity-50 cursor-not-allowed' : ''}`}>Họ nợ</button>
                    </div>
                    <input type="text" value={debtName} onChange={e=>handleTextInput(e.target.value, setDebtName)} className="w-full p-4 glass-input font-black text-sm placeholder:text-slate-400 text-slate-700" placeholder="TÊN NGƯỜI LIÊN QUAN..."/>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-[9px] text-slate-400 font-black uppercase block mb-1 tracking-widest pl-2">Tổng nợ</label>
                            <input 
                                type="text" 
                                value={debtTotal} 
                                onChange={e=>handleAmountInput(e.target.value, setDebtTotal)} 
                                disabled={!!isEditingDebt && debtType === 'receivable'}
                                className={`w-full p-3 glass-input font-black ${debtType==='payable' ? 'text-rose-600' : 'text-indigo-600'} text-lg ${(!!isEditingDebt && debtType === 'receivable') ? 'opacity-60 cursor-not-allowed bg-gray-50/50 text-slate-500' : ''}`} 
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[9px] text-slate-400 font-black uppercase block mb-1 tracking-widest pl-2">Đã trả/thu</label>
                            <input 
                                type="text" 
                                value={debtPaid} 
                                onChange={e=>handleAmountInput(e.target.value, setDebtPaid)} 
                                disabled={!!isEditingDebt && debtType === 'receivable'}
                                className={`w-full p-3 glass-input font-black text-slate-700 text-lg ${(!!isEditingDebt && debtType === 'receivable') ? 'opacity-60 cursor-not-allowed bg-gray-50/50 text-slate-500' : ''}`} 
                            />
                        </div>
                    </div>
                    <input type="text" value={debtNote} onChange={e=>handleTextInput(e.target.value, setDebtNote)} className="w-full p-4 glass-input font-medium text-sm placeholder:text-slate-400 text-slate-600" placeholder="Ghi chú (tùy chọn)..."/>
                    
                    {!isEditingDebt && (
                        <div className="flex items-center gap-2 px-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                            <input type="checkbox" checked={autoCreateTransaction} onChange={e=>setAutoCreateTransaction(e.target.checked)} id="autoSync" className="w-4 h-4 rounded-md accent-indigo-600 cursor-pointer"/>
                            <label htmlFor="autoSync" className="text-[10px] text-indigo-800 font-bold uppercase tracking-tight cursor-pointer select-none">Tự động tạo giao dịch thu/chi tương ứng</label>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button onClick={()=>setShowDebtForm(false)} className="flex-1 py-4 bg-white/40 border border-white/60 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest btn-effect hover:bg-white/60">Hủy</button>
                        <button onClick={() => {
                            const total = parseAmount(debtTotal);
                            const paid = parseAmount(debtPaid);
                             if (!debtName || total <= 0) { alert("Nhập tên và tổng nợ hợp lệ."); return; }
                            
                            const newItem = { id: isEditingDebt || Date.now(), name: debtName, total, paid, note: debtNote, type: debtType, updatedAt: new Date().toISOString() };
                            (onUpdateDebts as any)(null, newItem, isEditingDebt);
                            setShowDebtForm(false); setIsEditingDebt(null); setDebtName(''); setDebtTotal(''); setDebtPaid(''); setDebtNote('');
                        }} className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200/50 text-[10px] uppercase tracking-widest btn-effect hover:shadow-indigo-300">{isEditingDebt ? 'Cập Nhật' : 'Lưu Hồ Sơ'}</button>
                    </div>
                </div>
             )}
        </div>
    );
};

export default TabDebt;

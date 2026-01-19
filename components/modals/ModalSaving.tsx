
import React, { useState } from 'react';
import { PiggyBank, X, SAVING_CATEGORIES } from '../../constants';
import { formatCurrency, handleAmountInput, handleTextInput, parseAmount } from '../../utils';
import CustomDatePicker from '../CustomDatePicker';

interface ModalSavingProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: string, amount: number, date: string, note: string) => void;
}

const ModalSaving: React.FC<ModalSavingProps> = ({ isOpen, onClose, onSave }) => {
    const getLocalToday = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(SAVING_CATEGORIES[0]);
    const [note, setNote] = useState('');
    const [date, setDate] = useState(getLocalToday());

    const handleSubmit = () => {
        const parsedAmt = parseAmount(amount);
        if (!category || parsedAmt <= 0) {
            alert('Vui lòng nhập số tiền và chọn mục tiết kiệm.');
            return;
        }
        onSave(category, parsedAmt, date, note);
        setAmount('');
        setNote('');
        setDate(getLocalToday());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[110] flex items-center justify-center p-6 backdrop-blur-lg animate-fadeIn">
            <div className="glass-panel bg-white/70 rounded-[40px] w-full max-w-sm p-8 shadow-2xl relative border-white/50">
                <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-white/50 rounded-full text-slate-400 hover:bg-white hover:text-slate-600 transition-all"><X size={20}/></button>
                <h3 className="font-black text-rose-500 text-lg mb-8 uppercase tracking-tighter flex items-center gap-2"><PiggyBank size={24}/> Nạp Heo Đất</h3>
                <div className="space-y-5">
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 pl-2">Chọn Hũ:</label>
                        <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full p-4 bg-white/60 border border-white rounded-2xl text-xs font-black outline-none shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all text-slate-700">
                            {SAVING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 pl-2">Số tiền:</label>
                            <input type="text" value={amount} onChange={e=>handleAmountInput(e.target.value, setAmount)} className="w-full p-4 bg-white/60 border border-white rounded-2xl font-black text-lg text-rose-500 outline-none shadow-sm focus:border-rose-400 transition-all" placeholder="0"/>
                        </div>
                        <div className="flex-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 pl-2">Ngày:</label>
                            <CustomDatePicker value={date} onChange={e=>setDate(e.target.value)} className="glass-input rounded-2xl border-white" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 pl-2">Ghi chú:</label>
                        <input type="text" value={note} onChange={e=>handleTextInput(e.target.value, setNote)} className="w-full p-4 bg-white/60 border border-white rounded-2xl text-sm font-medium outline-none shadow-sm focus:border-rose-400 transition-all" placeholder="Ví dụ: Tiền thưởng tết..."/>
                    </div>
                    <button onClick={handleSubmit} className="w-full py-4 bg-gradient-to-r from-rose-400 to-pink-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200/50 uppercase text-xs tracking-[0.2em] active:scale-95 transition-all mt-4 border border-white/20">Xác Nhận</button>
                </div>
            </div>
        </div>
    );
};

export default ModalSaving;

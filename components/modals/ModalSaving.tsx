
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
        // Reset form
        setAmount('');
        setNote('');
        setDate(getLocalToday());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative border border-gray-100">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
                <h3 className="font-black text-rose-600 text-lg mb-6 uppercase tracking-tighter flex items-center gap-2"><PiggyBank size={24}/> Nạp Heo Đất</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 pl-2">Chọn Hũ:</label>
                        <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs font-black outline-none shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all">
                            {SAVING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 pl-2">Số tiền:</label>
                            <input type="text" value={amount} onChange={e=>handleAmountInput(e.target.value, setAmount)} className="w-full p-3 bg-white border border-gray-300 rounded-xl font-black text-lg text-rose-600 outline-none shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="0 VNĐ"/>
                        </div>
                        <div className="flex-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 pl-2">Ngày:</label>
                            <CustomDatePicker value={date} onChange={e=>setDate(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 pl-2">Ghi chú:</label>
                        <input type="text" value={note} onChange={e=>handleTextInput(e.target.value, setNote)} className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium outline-none shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all" placeholder="Ví dụ: Tiền thưởng tết..."/>
                    </div>
                    <button onClick={handleSubmit} className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200 uppercase text-xs tracking-[0.2em] active:scale-95 transition-all mt-2">Xác Nhận Nạp</button>
                </div>
            </div>
        </div>
    );
};

export default ModalSaving;

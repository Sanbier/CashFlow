
import React, { useState } from 'react';
import { Clock, X } from '../../constants';
import { FixedTemplateItem } from '../../types';
import { formatCurrency, handleAmountInput, parseAmount } from '../../utils';

interface ModalFixedConfigProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    fixedTemplate: FixedTemplateItem[];
    onSave: (newTemplate: FixedTemplateItem[]) => void;
}

const ModalFixedConfig: React.FC<ModalFixedConfigProps> = ({ isOpen, onClose, categories, fixedTemplate, onSave }) => {
    const [tempFixedList, setTempFixedList] = useState<Record<string, number>>({});

    if (!isOpen) return null;

    const handleSaveConfig = () => {
        // Merge existing template values if not modified in tempFixedList
        // Logic: Iterate all categories. If in tempList -> use it. If not -> check fixedTemplate.
        // Actually the UI shows all. We just construct the array from current state + props.
        
        // Re-construct the full list based on user edits + existing data for display
        // But simply, we should map the categories and checking what is the final value.
        const finalTemplate = categories.map(cat => {
            const tempVal = tempFixedList[cat];
            if (tempVal !== undefined) return { category: cat, amount: tempVal };
            
            const existing = fixedTemplate.find(f => f.category === cat);
            return existing ? existing : { category: cat, amount: 0 };
        }).filter(item => item.amount > 0);

        onSave(finalTemplate);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-[48px] w-full max-w-sm p-8 shadow-2xl relative border border-gray-100">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
                <h3 className="font-black text-gray-800 text-lg mb-8 uppercase tracking-tighter flex items-center gap-3"><Clock size={24} className="text-purple-600"/> Thiết lập hạn mức</h3>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                    {categories.map(cat => {
                        // Value to display: Temp state > Existing Prop > Empty
                        const existingVal = fixedTemplate.find(f => f.category === cat)?.amount;
                        const currentVal = tempFixedList[cat] !== undefined ? tempFixedList[cat] : existingVal;
                        const displayVal = currentVal ? formatCurrency(currentVal) : '';

                        return (
                            <div key={cat} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 group">
                                <span className="flex-1 text-[10px] font-black text-gray-500 uppercase truncate tracking-tighter">{cat}</span>
                                <input 
                                    type="text" 
                                    inputMode="numeric" 
                                    value={displayVal} 
                                    onChange={(e) => handleAmountInput(e.target.value, (v)=>setTempFixedList(p=>({...p, [cat]: parseAmount(v)})))} 
                                    className="w-24 p-2 bg-white border-2 border-gray-300 rounded-xl text-[11px] font-black text-right text-purple-700 outline-none focus:border-purple-300 transition-all" 
                                    placeholder="0 VNĐ"
                                />
                            </div>
                        );
                    })}
                </div>
                <button onClick={handleSaveConfig} className="w-full py-5 bg-gradient-to-r from-slate-800 to-black text-white font-black rounded-[24px] mt-8 uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-slate-200 active:scale-95 transition-all">Lưu Cấu Hình</button>
            </div>
        </div>
    );
};

export default ModalFixedConfig;
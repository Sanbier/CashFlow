
import React from 'react';
import { CalendarIcon } from '../constants';

const CustomDatePicker: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string }> = ({ value, onChange, className="" }) => {
    const displayDate = value ? value.split('-').reverse().join('/') : '';
    return (
        <div className={`relative h-full ${className}`}> 
            <input type="date" value={value} onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
            <div className="w-full h-full px-3 py-4 text-sm font-bold text-slate-700 flex items-center justify-center pointer-events-none gap-2 transition-all duration-200"> 
                <span>{displayDate}</span><CalendarIcon size={16} className="opacity-60 text-slate-500"/>
            </div>
        </div>
    );
};

export default CustomDatePicker;
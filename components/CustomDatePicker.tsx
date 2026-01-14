
import React from 'react';
import { CalendarIcon } from '../constants';

const CustomDatePicker: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string }> = ({ value, onChange, className="" }) => {
    const displayDate = value ? value.split('-').reverse().join('/') : '';
    return (
        <div className={`relative h-12 ${className}`}> 
            <input type="date" value={value} onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
            <div className="w-full h-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 flex items-center justify-center pointer-events-none gap-2 shadow-sm transition-all duration-200"> 
                <span>{displayDate}</span><CalendarIcon size={16} className="opacity-70 text-gray-500"/>
            </div>
        </div>
    );
};

export default CustomDatePicker;

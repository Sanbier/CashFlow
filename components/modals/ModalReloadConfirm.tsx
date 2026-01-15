
import React from 'react';
import { RefreshCw } from '../../constants';

interface ModalReloadConfirmProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const ModalReloadConfirm: React.FC<ModalReloadConfirmProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-[40px] p-8 shadow-2xl text-center max-w-[300px] w-full border border-gray-100">
                <div className="bg-slate-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"><RefreshCw size={28} className="text-blue-600"/></div>
                <h3 className="font-black text-lg mb-2 text-gray-800 uppercase tracking-tighter">Tải lại App?</h3>
                <p className="text-[10px] text-gray-400 font-bold mb-8 uppercase tracking-tight">Dữ liệu sẽ được cập nhật mới nhất từ Đám mây.</p>
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-400 font-black rounded-2xl text-[10px] uppercase tracking-widest">Hủy</button>
                    <button onClick={onConfirm} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100">Đồng ý</button>
                </div>
            </div>
        </div>
    );
};

export default ModalReloadConfirm;

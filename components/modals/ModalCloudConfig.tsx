
import React, { useState } from 'react';
import { Cloud, X } from '../../constants';

interface ModalCloudConfigProps {
    isOpen: boolean;
    onClose: () => void;
    currentCode: string;
    currentConfig: string;
}

const ModalCloudConfig: React.FC<ModalCloudConfigProps> = ({ isOpen, onClose, currentCode, currentConfig }) => {
    const [code, setCode] = useState(currentCode);
    const [config, setConfig] = useState(currentConfig);

    const handleSave = () => {
        const finalCode = code.trim().toUpperCase();
        if (!finalCode || !config) {
            alert("Thiếu thông tin");
            return;
        }
        localStorage.setItem('fb_config', config);
        localStorage.setItem('fb_family_code', finalCode);
        window.location.reload();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-6 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-[48px] w-full max-w-sm p-8 shadow-2xl text-left border border-white/20 relative">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
                <div className="flex items-center gap-3 mb-8"><Cloud size={28} className="text-blue-600"/><h3 className="font-black text-gray-800 text-xl uppercase tracking-tighter">Đám mây Riêng</h3></div>
                <div className="space-y-6">
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-2">Mã Gia Đình (Dùng chung 2 máy)</label>
                        <input type="text" value={code} onChange={e=>setCode(e.target.value.trim().toUpperCase())} className="w-full p-4 bg-white border-2 border-gray-300 rounded-2xl text-sm font-black outline-none focus:border-blue-500 transition-all" placeholder="VÍ DỤ: GIADINH001" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-2">Firebase Config (Dán đúng JSON)</label>
                        <textarea value={config} onChange={e=>setConfig(e.target.value)} className="w-full p-4 bg-white border-2 border-gray-300 rounded-2xl text-[9px] h-40 outline-none resize-none font-mono focus:border-blue-500 transition-all" placeholder='{"apiKey": "...", "projectId": "...", ...}'></textarea>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                        <p className="text-[8px] text-yellow-700 font-black uppercase leading-relaxed">Lưu ý: Bạn phải thiết lập Firebase Rules thành "allow read, write: if true;" để đồng bộ được.</p>
                    </div>
                    <button onClick={handleSave} className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-[24px] shadow-xl shadow-blue-100 uppercase text-xs tracking-[0.3em] active:scale-95 transition-all">Lưu & Kết Nối</button>
                </div>
            </div>
        </div>
    );
};

export default ModalCloudConfig;

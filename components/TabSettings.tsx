
import React from 'react';
import { SettingsIcon, Clock, Cloud, RefreshCw } from '../constants';

interface TabSettingsProps {
    isConnected: boolean;
    projectId: string;
    familyCode: string;
    onReload: () => void;
    onOpenFixedConfig: () => void;
    onOpenCloudForm: () => void;
}

const TabSettings: React.FC<TabSettingsProps> = ({ isConnected, projectId, familyCode, onReload, onOpenFixedConfig, onOpenCloudForm }) => {
    return (
        <div className="space-y-6 animate-fadeIn mt-2">
            {isConnected && (
                <div className="bg-gradient-to-br from-slate-800 to-gray-900 p-6 rounded-[32px] text-white shadow-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Trạng thái Cloud</h4>
                        <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-black">ACTIVE</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black">
                            <span className="text-white/40 uppercase">Project ID:</span>
                            <span className="text-white/80">{projectId}</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-black">
                            <span className="text-white/40 uppercase">Document:</span>
                            <span className="text-white/80">{familyCode}</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-black">
                            <span className="text-white/40 uppercase">Máy chủ:</span>
                            <span className="text-blue-300">Firestore Google</span>
                        </div>
                    </div>
                    <button onClick={onReload} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-white/10 transition-all flex items-center justify-center gap-2"><RefreshCw size={12}/> Buộc đồng bộ lại</button>
                </div>
            )}

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-black text-gray-800 border-b border-gray-50 pb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><SettingsIcon size={20} className="text-slate-500"/> Thiết lập hệ thống</h3>
                <div className="grid grid-cols-1 gap-3">
                    <button onClick={onOpenFixedConfig} className="w-full p-4 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm active:scale-95 transition-all">Chi Tiêu Cố Định <Clock size={18}/></button>
                    <button onClick={onOpenCloudForm} className="w-full p-4 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm active:scale-95 transition-all">Cấu Hình Đám Mây <Cloud size={18}/></button>
                </div>
                <div className="pt-6 border-t border-gray-50 text-center">
                    <p className="text-[8px] text-gray-300 font-black uppercase tracking-[0.4em]">CashFlow v2.5 • Private Cloud</p>
                </div>
            </div>
        </div>
    );
};

export default TabSettings;
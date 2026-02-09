
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
                <div className="bg-[#1e293b] p-6 rounded-[32px] text-white shadow-2xl shadow-slate-400/20 space-y-4 relative overflow-hidden border border-slate-700">
                    {/* Dark Card Decor */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    
                    <div className="flex justify-between items-center border-b border-white/5 pb-3 relative z-10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Trạng thái Cloud</h4>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg font-black border border-emerald-500/20">ACTIVE</span>
                    </div>
                    <div className="space-y-2.5 relative z-10">
                        <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400 uppercase tracking-wide">Project ID</span>
                            <span className="text-slate-200 font-mono">{projectId}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400 uppercase tracking-wide">Family Code</span>
                            <span className="text-slate-200 font-mono">{familyCode}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400 uppercase tracking-wide">Server</span>
                            <span className="text-indigo-300">Firestore Google</span>
                        </div>
                    </div>
                    <button onClick={onReload} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border border-white/10 transition-all flex items-center justify-center gap-2 relative z-10"><RefreshCw size={12}/> Buộc đồng bộ lại</button>
                </div>
            )}

            <div className="glass-panel p-6 rounded-[32px] shadow-sm border border-white/60 space-y-4">
                <h3 className="font-black text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2 uppercase text-xs tracking-[0.2em]"><SettingsIcon size={20} className="text-slate-400"/> Thiết lập hệ thống</h3>
                <div className="grid grid-cols-1 gap-3">
                    <button onClick={onOpenFixedConfig} className="w-full p-5 bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm border border-violet-100 active:scale-95 transition-all hover:shadow-md">Chi Tiêu Cố Định <Clock size={18}/></button>
                    <button onClick={onOpenCloudForm} className="w-full p-5 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm border border-sky-100 active:scale-95 transition-all hover:shadow-md">Cấu Hình Đám Mây <Cloud size={18}/></button>
                </div>
                <div className="pt-6 border-t border-slate-50 text-center">
                    <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.4em]">CashFlow v2.5 • Private Cloud</p>
                </div>
            </div>
        </div>
    );
};

export default TabSettings;

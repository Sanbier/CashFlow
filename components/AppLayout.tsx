
import React from 'react';
import { 
  CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  CloudOff, 
  SettingsIcon, 
  MessageCircle, 
  Wallet, 
  AlertTriangle 
} from '../constants';
import { formatCurrency, formatDate } from '../utils';
import { TabType } from '../types';

interface AppLayoutProps {
    // Header Data
    viewDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    startDate: Date;
    endDate: Date;
    sumIncome: number;
    sumExpense: number;
    
    // Cloud Status
    isConnected: boolean;
    isSyncing: boolean;
    syncError: string | null;
    familyCode: string;
    onOpenCloud: () => void;

    // Navigation
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;

    // Budget Status
    isOverBudget: boolean;
    balance: number;

    // Actions
    onOpenFixedTracking: () => void;
    onReload: () => void;

    // Content
    children: React.ReactNode;
    modals: React.ReactNode; // Chứa các Modal (Saving, Cloud, Fixed...)
}

const AppLayout: React.FC<AppLayoutProps> = ({
    viewDate, onPrevMonth, onNextMonth, startDate, endDate, sumIncome, sumExpense,
    isConnected, isSyncing, syncError, familyCode, onOpenCloud,
    activeTab, onTabChange,
    isOverBudget, balance,
    onOpenFixedTracking, onReload,
    children, modals
}) => {
    return (
        <div className="min-h-screen pb-24 md:pb-0 relative font-sans overflow-x-hidden">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
                {/* 1. Cảnh báo vượt hạn mức */}
                {isOverBudget && <div className="bg-red-50 text-red-600 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-pulse-red border-b border-red-100"><AlertTriangle size={16} /> CHI TIÊU QUÁ HẠN MỨC 90%!</div>}
                
                {/* 2. Header Section */}
                <div className={`bg-gradient-to-r ${isConnected ? 'from-blue-800 to-indigo-900' : 'from-slate-700 to-gray-800'} p-6 pb-6 text-white rounded-b-3xl shadow-lg relative`}>
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={onPrevMonth} className="p-2 text-white/70 hover:text-white btn-effect"><ChevronLeft size={24}/></button>
                        <div className="text-center">
                            <span className="text-[10px] font-medium text-white/60 block mb-0.5 tracking-wider">{formatDate(startDate.toISOString())} - {formatDate(endDate.toISOString())}</span>
                            <div className="font-bold text-xl text-white flex items-center gap-2 justify-center uppercase tracking-wide"><CalendarIcon size={18}/> Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}</div>
                        </div>
                        <button onClick={onNextMonth} className="p-2 text-white/70 hover:text-white btn-effect"><ChevronRight size={24}/></button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/30 backdrop-blur-sm p-4 rounded-2xl border border-green-500/30 shadow-inner">
                            <div className="text-green-300 text-[10px] font-black uppercase mb-1 flex items-center gap-1"><TrendingUp size={12}/> Thu Nhập</div>
                            <div className="font-bold text-lg">{formatCurrency(sumIncome)} VNĐ</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-500/20 to-orange-500/30 backdrop-blur-sm p-4 rounded-2xl border border-red-500/30 shadow-inner">
                            <div className="text-red-300 text-[10px] font-black uppercase mb-1 flex items-center gap-1"><TrendingDown size={12}/> Chi Tiêu</div>
                            <div className="font-bold text-lg">{formatCurrency(sumExpense)} VNĐ</div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-1">
                        {!isConnected ? (
                            <button onClick={onOpenCloud} className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all backdrop-blur-md btn-effect opacity-90 hover:opacity-100">
                                <CloudOff size={14}/> <span>Kết Nối Cloud</span>
                            </button>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-3 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                                    <div className="text-[10px] text-blue-200 uppercase font-black tracking-widest">Mã: <span className="text-white">{familyCode}</span></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                    <button onClick={onOpenCloud} className="text-[10px] text-white/60 font-bold border-l border-white/10 pl-3">Sửa</button>
                                </div>
                                {isSyncing && <span className="text-[8px] text-green-300 font-bold uppercase mt-1 tracking-widest">Đang tải dữ liệu...</span>}
                            </div>
                        )}
                        {syncError && <div className="text-[9px] bg-red-500/90 text-white px-3 py-1 rounded-full mt-2 font-bold animate-bounce shadow-lg">LỖI: {syncError}</div>}
                    </div>
                </div>

                {/* 3. Navigation Tabs */}
                <div className="px-4 -mt-6 relative z-10">
                    <div className="bg-white rounded-xl shadow-xl p-1.5 flex border border-gray-100 overflow-x-auto no-scrollbar">
                        {(['add', 'debt', 'report', 'savings', 'history', 'settings'] as TabType[]).map(tab => (
                            <button key={tab} onClick={() => onTabChange(tab)} className={`flex-1 min-w-[60px] py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all btn-effect flex flex-col items-center gap-1 ${activeTab === tab ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-md animate-scale-loop' : 'text-gray-400 hover:bg-gray-50'}`}>
                                {tab === 'add' ? 'Nhập' : tab === 'debt' ? 'Sổ Nợ' : tab === 'report' ? 'Báo Cáo' : tab === 'savings' ? 'Heo Đất' : tab === 'history' ? 'Lịch Sử' : <SettingsIcon size={16}/>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. Main Content Area */}
                <div className="p-4 pb-32">
                    {children}
                </div>

                {/* 5. Floating Action Buttons */}
                <div className="fixed bottom-8 left-4 z-50 flex flex-col gap-3">
                    <button onClick={onOpenFixedTracking} className="bg-gradient-to-br from-slate-800 to-black text-white p-4 rounded-3xl shadow-2xl border-2 border-white/20 transform hover:rotate-12 transition-all ring-8 ring-slate-900/5">
                        <MessageCircle size={22}/>
                    </button>
                </div>

                <div onClick={onReload} className="fixed bottom-8 right-4 z-50">
                    <div className={`shadow-2xl rounded-[24px] px-6 py-4 flex items-center gap-4 border-2 border-white/40 transform active:scale-90 transition-all ring-8 ${balance>=0?'bg-gradient-to-r from-blue-700 to-indigo-600 ring-blue-500/10':'bg-gradient-to-r from-red-700 to-orange-600 ring-red-500/10'}`}>
                        <div className="bg-white/20 p-2 rounded-xl"><Wallet size={22} className="text-white"/></div>
                        <div className="flex flex-col items-start text-white font-black text-xl leading-none tracking-tight">{formatCurrency(balance)} VNĐ</div>
                    </div>
                </div>

                {/* 6. Modals Container */}
                {modals}
            </div>
        </div>
    );
};

export default AppLayout;

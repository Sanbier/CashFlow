
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
    viewDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    startDate: Date;
    endDate: Date;
    sumIncome: number;
    sumExpense: number;
    isConnected: boolean;
    isSyncing: boolean;
    syncError: string | null;
    familyCode: string;
    onOpenCloud: () => void;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    isOverBudget: boolean;
    balance: number;
    onOpenFixedTracking: () => void;
    onReload: () => void;
    children: React.ReactNode;
    modals: React.ReactNode;
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
        // Sử dụng h-[100dvh] để fix lỗi layout nhảy khi thanh địa chỉ ẩn/hiện trên iOS Safari
        <div className="h-[100dvh] w-full pb-24 md:pb-0 relative font-sans overflow-x-hidden overflow-y-auto selection:bg-pink-200 selection:text-pink-900 overscroll-y-contain">
            {/* Background Blobs Animation - Optimized with will-change-transform */}
            <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden bg-white/10">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob will-change-transform"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-2000 will-change-transform"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-4000 will-change-transform"></div>
            </div>

            {/* Main Wrapper - Removed 'glass-panel' here to prevent double backdrop-filter cost */}
            <div className="max-w-md mx-auto min-h-full relative bg-white/20 sm:bg-white/40 border-x border-white/30 rounded-none sm:rounded-[40px] sm:my-4 sm:min-h-[95vh] flex flex-col shadow-2xl shadow-blue-900/5">
                {/* 1. Cảnh báo vượt hạn mức */}
                {isOverBudget && <div className="bg-red-500/90 backdrop-blur-md text-white px-4 pt-safe-top pb-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg z-50"><AlertTriangle size={16} /> CẢNH BÁO: CHI TIÊU VƯỢT 90%</div>}
                
                {/* 2. Header Section */}
                <div className="p-6 pb-2 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={onPrevMonth} className="p-3 bg-white/50 hover:bg-white/80 rounded-2xl text-slate-700 btn-effect backdrop-blur-sm shadow-sm"><ChevronLeft size={20}/></button>
                        <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold text-slate-500 block mb-0.5 tracking-wider uppercase">{formatDate(startDate.toISOString())} - {formatDate(endDate.toISOString())}</span>
                            <div className="font-black text-xl text-slate-800 flex items-center gap-2 justify-center uppercase tracking-wide drop-shadow-sm"><CalendarIcon size={18} className="text-purple-600"/> Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}</div>
                        </div>
                        <button onClick={onNextMonth} className="p-3 bg-white/50 hover:bg-white/80 rounded-2xl text-slate-700 btn-effect backdrop-blur-sm shadow-sm"><ChevronRight size={20}/></button>
                    </div>
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="glass-panel p-4 rounded-3xl border border-white/60 relative overflow-hidden group flex flex-col items-center justify-center text-center">
                            <div className="absolute -right-6 -top-6 w-16 h-16 bg-green-300/30 rounded-full blur-xl group-hover:scale-150 transition-all duration-700"></div>
                            <div className="text-green-700 text-[10px] font-black uppercase mb-1 flex items-center justify-center gap-1 relative z-10"><TrendingUp size={12}/> Thu Nhập</div>
                            <div className="font-black text-lg text-slate-800 relative z-10">{formatCurrency(sumIncome)}</div>
                        </div>
                        <div className="glass-panel p-4 rounded-3xl border border-white/60 relative overflow-hidden group flex flex-col items-center justify-center text-center">
                             <div className="absolute -right-6 -top-6 w-16 h-16 bg-red-300/30 rounded-full blur-xl group-hover:scale-150 transition-all duration-700"></div>
                            <div className="text-red-600 text-[10px] font-black uppercase mb-1 flex items-center justify-center gap-1 relative z-10"><TrendingDown size={12}/> Chi Tiêu</div>
                            <div className="font-black text-lg text-slate-800 relative z-10">{formatCurrency(sumExpense)}</div>
                        </div>
                    </div>

                    {/* Cloud Status */}
                    <div className="mt-4 flex justify-center">
                        {!isConnected ? (
                            <button onClick={onOpenCloud} className="flex items-center gap-2 bg-white/60 border border-white/60 px-4 py-1.5 rounded-full text-[10px] font-bold text-slate-600 transition-all backdrop-blur-md shadow-sm hover:bg-white/80">
                                <CloudOff size={12} className="text-gray-400"/> <span>Kết nối Cloud</span>
                            </button>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div onClick={onOpenCloud} className="flex items-center gap-2 bg-green-100/60 border border-green-200/50 px-3 py-1 rounded-full backdrop-blur-md cursor-pointer shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[10px] text-green-700 font-bold tracking-wider">{familyCode}</span>
                                </div>
                                {isSyncing && <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 tracking-widest animate-pulse">Đang đồng bộ...</span>}
                            </div>
                        )}
                        {syncError && <div className="text-[9px] bg-red-100 text-red-600 px-3 py-1 rounded-full mt-2 font-bold animate-bounce border border-red-200 mx-auto w-max shadow-sm">LỖI: {syncError}</div>}
                    </div>
                </div>

                {/* 3. Navigation Tabs */}
                <div className="px-6 sticky top-0 z-20 py-2">
                    <div className="glass-panel p-1.5 flex border border-white/50 overflow-x-auto no-scrollbar rounded-2xl">
                        {(['add', 'debt', 'report', 'savings', 'history', 'settings'] as TabType[]).map(tab => (
                            <button key={tab} onClick={() => onTabChange(tab)} className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-200 btn-effect flex flex-col items-center gap-1 ${activeTab === tab ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/40'}`}>
                                {tab === 'add' ? 'Nhập' : tab === 'debt' ? 'Nợ' : tab === 'report' ? 'Báo Cáo' : tab === 'savings' ? 'Tiết Kiệm' : tab === 'history' ? 'Lịch Sử' : <SettingsIcon size={16}/>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. Main Content Area */}
                <div className="p-6 pb-32 flex-1">
                    {children}
                </div>
            </div>

            {/* 5. Floating Action Buttons - Safe Area Optimized */}
            <div className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-6 z-50 flex flex-col gap-3">
                <button onClick={onOpenFixedTracking} className="relative w-14 h-14 rounded-full glass-panel border border-white/70 flex items-center justify-center transform hover:scale-105 active:scale-90 transition-all duration-200 group">
                    <div className="absolute inset-0 bg-indigo-100/30 rounded-full animate-pulse"></div>
                    <MessageCircle size={26} className="text-indigo-600 relative z-10 drop-shadow-sm group-hover:text-purple-600 transition-colors"/>
                </button>
            </div>

            <div onClick={onReload} className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] right-6 z-50 cursor-pointer">
                <div className={`glass-panel rounded-[28px] pl-2 pr-6 py-2 flex items-center gap-3 border border-white/70 transform active:scale-95 transition-all ${balance>=0?'bg-white/60':'bg-red-50/80'}`}>
                    <div className={`p-3 rounded-full ${balance>=0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}><Wallet size={20}/></div>
                    <div className="flex flex-col items-start">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Số dư</span>
                        <span className={`font-black text-lg leading-none tracking-tight ${balance>=0 ? 'text-slate-800' : 'text-red-500'}`}>{formatCurrency(balance)}</span>
                    </div>
                </div>
            </div>

            {/* 6. Modals Container */}
            {modals}
        </div>
    );
};

export default AppLayout;

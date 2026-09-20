import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Wifi,
  Signal,
  Battery,
  Smartphone
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
    // Dynamic Clock for the Smartphone Status Bar
    const [currentTime, setCurrentTime] = useState(() => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        }, 15000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center font-sans sm:py-8 sm:px-4 overflow-x-hidden sm:overflow-y-auto select-none sm:select-text">
            {/* Background Animated Liquid Blobs */}
            <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-white/10">
                <div className="absolute top-0 -left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob will-change-transform"></div>
                <div className="absolute top-1/4 -right-10 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 will-change-transform"></div>
                <div className="absolute -bottom-10 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000 will-change-transform"></div>
            </div>

            {/* Desktop Mode Indicator Badge */}
            <div className="hidden sm:flex fixed top-4 right-4 z-50 items-center gap-2 px-3.5 py-1.5 bg-slate-900/80 hover:bg-slate-900/95 backdrop-blur-md text-white/90 text-[11px] font-bold rounded-full shadow-2xl border border-white/15 transition-all">
                <Smartphone size={13} className="text-purple-400" />
                <span>Giao diện iPhone</span>
            </div>

            {/* Outer Hardware Chassis Wrapper (Desktop styling) */}
            <div className="relative w-full h-[100dvh] sm:w-[412px] sm:h-[870px] sm:rounded-[56px] sm:bg-slate-900 sm:p-[11px] sm:shadow-[0_30px_90px_rgba(15,23,42,0.5),0_0_0_1px_rgba(255,255,255,0.15)] sm:ring-1 sm:ring-black/40 flex flex-col transition-all duration-300 z-10 shrink-0">
                {/* Physical Hardware Buttons on Phone Frame (Desktop only) */}
                <div className="hidden sm:block absolute -left-[14px] top-28 w-[3px] h-7 bg-gradient-to-b from-slate-600 to-slate-700 rounded-l shadow-sm"></div>
                <div className="hidden sm:block absolute -left-[14px] top-40 w-[3px] h-12 bg-gradient-to-b from-slate-600 to-slate-700 rounded-l shadow-sm"></div>
                <div className="hidden sm:block absolute -left-[14px] top-56 w-[3px] h-12 bg-gradient-to-b from-slate-600 to-slate-700 rounded-l shadow-sm"></div>
                <div className="hidden sm:block absolute -right-[14px] top-44 w-[3px] h-16 bg-gradient-to-b from-slate-600 to-slate-700 rounded-r shadow-sm"></div>

                {/* Inner Screen Display (Edge-to-edge on mobile, rounded screen on desktop) */}
                <div className="relative w-full h-full sm:rounded-[45px] overflow-hidden flex flex-col bg-white/30 sm:bg-white/40 backdrop-blur-xl border sm:border border-white/40 shadow-inner">
                    {/* Smartphone Status Bar & Dynamic Island (Desktop only) */}
                    <div className="hidden sm:flex items-center justify-between px-7 pt-3.5 pb-1 shrink-0 z-30 select-none">
                        {/* Time */}
                        <span className="text-[12px] font-black text-slate-800 tracking-tight pl-1">
                            {currentTime}
                        </span>

                        {/* Dynamic Island */}
                        <div className="h-6 w-28 bg-black rounded-full flex items-center justify-between px-2.5 text-white shadow-inner group cursor-pointer transition-all hover:scale-105">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/60 ring-1 ring-blue-900/40 flex items-center justify-center">
                                <div className="w-1 h-1 rounded-full bg-blue-950/90"></div>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>

                        {/* Status Icons: Signal, Wifi, Battery */}
                        <div className="flex items-center gap-1.5 text-slate-800 pr-1">
                            <Signal size={13} strokeWidth={2.5} />
                            <Wifi size={13} strokeWidth={2.5} />
                            <div className="flex items-center gap-0.5">
                                <span className="text-[10px] font-black">98%</span>
                                <Battery size={15} strokeWidth={2.2} />
                            </div>
                        </div>
                    </div>

                    {/* Overbudget Alert Banner */}
                    {isOverBudget && (
                        <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg z-20 shrink-0">
                            <AlertTriangle size={16} /> CẢNH BÁO: CHI TIÊU VƯỢT 90%
                        </div>
                    )}

                    {/* Scrollable Main Screen Content */}
                    <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col overscroll-contain">
                        {/* 1. Header Section */}
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
                            <div className="grid grid-cols-2 gap-3.5 mt-4">
                                <div className="glass-panel p-4 rounded-3xl border border-white/60 relative overflow-hidden group flex flex-col items-center justify-center text-center">
                                    <div className="absolute -right-6 -top-6 w-16 h-16 bg-green-300/30 rounded-full blur-xl group-hover:scale-150 transition-all duration-700"></div>
                                    <div className="text-green-700 text-[10px] font-black uppercase mb-1 flex items-center justify-center gap-1 relative z-10"><TrendingUp size={12}/> Thu Nhập</div>
                                    <div className="font-black text-base sm:text-lg text-slate-800 relative z-10">{formatCurrency(sumIncome)}</div>
                                </div>
                                <div className="glass-panel p-4 rounded-3xl border border-white/60 relative overflow-hidden group flex flex-col items-center justify-center text-center">
                                    <div className="absolute -right-6 -top-6 w-16 h-16 bg-red-300/30 rounded-full blur-xl group-hover:scale-150 transition-all duration-700"></div>
                                    <div className="text-red-600 text-[10px] font-black uppercase mb-1 flex items-center justify-center gap-1 relative z-10"><TrendingDown size={12}/> Chi Tiêu</div>
                                    <div className="font-black text-base sm:text-lg text-slate-800 relative z-10">{formatCurrency(sumExpense)}</div>
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

                        {/* 2. Navigation Tabs */}
                        <div className="px-6 sticky top-0 z-20 py-2">
                            <div className="glass-panel p-1.5 flex border border-white/50 overflow-x-auto no-scrollbar rounded-2xl">
                                {(['add', 'debt', 'report', 'savings', 'history', 'settings'] as TabType[]).map(tab => (
                                    <button key={tab} onClick={() => onTabChange(tab)} className={`flex-1 min-w-[54px] py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-200 btn-effect flex flex-col items-center gap-1 ${activeTab === tab ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/40'}`}>
                                        {tab === 'add' ? 'Nhập' : tab === 'debt' ? 'Nợ' : tab === 'report' ? 'Báo Cáo' : tab === 'savings' ? 'Tiết Kiệm' : tab === 'history' ? 'Lịch Sử' : <SettingsIcon size={16}/>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Main Tab Content */}
                        <div className="p-6 pb-36 flex-1">
                            {children}
                        </div>
                    </div>

                    {/* 4. Floating Action Buttons (Pinned to Screen corners above home indicator) */}
                    <div className="absolute bottom-6 sm:bottom-7 left-4 z-40 pointer-events-auto">
                        <button
                            onClick={onOpenFixedTracking}
                            className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full glass-panel border border-white/80 flex items-center justify-center transform hover:scale-105 active:scale-90 transition-all duration-200 group shadow-xl"
                            title="Chi cố định"
                        >
                            <div className="absolute inset-0 bg-indigo-100/30 rounded-full animate-pulse"></div>
                            <MessageCircle size={24} className="text-indigo-600 relative z-10 drop-shadow-sm group-hover:text-purple-600 transition-colors"/>
                        </button>
                    </div>

                    <div
                        onClick={onReload}
                        className="absolute bottom-6 sm:bottom-7 right-4 z-40 cursor-pointer pointer-events-auto"
                        title="Số dư hiện tại"
                    >
                        <div className={`glass-panel rounded-[28px] pl-2.5 pr-5 py-2 flex items-center gap-2.5 border border-white/80 transform active:scale-95 transition-all shadow-xl backdrop-blur-md ${balance >= 0 ? 'bg-white/80' : 'bg-red-50/90'}`}>
                            <div className={`p-2.5 rounded-full ${balance >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                <Wallet size={18}/>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Số dư</span>
                                <span className={`font-black text-base leading-none tracking-tight ${balance >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
                                    {formatCurrency(balance)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 5. iOS Home Indicator Bar (Desktop only) */}
                    <div className="hidden sm:flex justify-center items-center py-2 shrink-0 z-30 select-none">
                        <div className="w-32 h-1 bg-slate-700/40 hover:bg-slate-700/60 transition-colors rounded-full"></div>
                    </div>

                    {/* 6. Modals Container (Rendered on top of phone screen) */}
                    {modals}
                </div>
            </div>
        </div>
    );
};

export default AppLayout;

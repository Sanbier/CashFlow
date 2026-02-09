
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
        // Wrapper chính
        <div className="h-[100dvh] w-full relative font-sans overflow-hidden bg-[#F8FAFC]">
            
            {/* Background Blobs Animation - NEW PREMIUM COLORS */}
            <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                {/* Top Left: Indigo/Violet */}
                <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob will-change-transform"></div>
                {/* Top Right: Cyan/Sky */}
                <div className="absolute top-[-10%] right-[-20%] w-[80vw] h-[80vw] bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000 will-change-transform"></div>
                {/* Bottom Center: Rose/Pink */}
                <div className="absolute bottom-[-10%] left-[20%] w-[80vw] h-[80vw] bg-rose-200/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000 will-change-transform"></div>
                {/* Noise Texture Overlay for texture */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
            </div>

            {/* App Container */}
            <div className="w-full h-full md:max-w-[430px] md:max-h-[92vh] mx-auto relative flex flex-col bg-white/30 sm:bg-white/50 border-x border-white/40 rounded-none sm:rounded-[55px] sm:my-[4vh] shadow-2xl shadow-slate-300/40 transition-all duration-300 backdrop-blur-2xl overflow-hidden ring-1 ring-white/60">
                
                {/* 1. Cảnh báo vượt hạn mức (Sticky Top) */}
                {isOverBudget && <div className="bg-rose-500/90 backdrop-blur-md text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg z-50 absolute top-0 w-full tracking-wide"><AlertTriangle size={16} /> CẢNH BÁO: CHI TIÊU VƯỢT 90%</div>}
                
                {/* 2. Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar overscroll-contain">
                    {/* Header Section */}
                    <div className="p-6 pb-2 relative z-10 pt-safe-top sm:pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={onPrevMonth} className="p-3 bg-white/60 hover:bg-white/90 rounded-2xl text-slate-600 btn-effect backdrop-blur-md shadow-sm border border-white/50"><ChevronLeft size={20}/></button>
                            <div className="flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] font-bold text-slate-400 block mb-0.5 tracking-[0.2em] uppercase">{formatDate(startDate.toISOString())} - {formatDate(endDate.toISOString())}</span>
                                <div className="font-extrabold text-xl text-slate-800 flex items-center gap-2 justify-center uppercase tracking-wide"><CalendarIcon size={20} className="text-indigo-500"/> Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}</div>
                            </div>
                            <button onClick={onNextMonth} className="p-3 bg-white/60 hover:bg-white/90 rounded-2xl text-slate-600 btn-effect backdrop-blur-md shadow-sm border border-white/50"><ChevronRight size={20}/></button>
                        </div>
                        
                        {/* Summary Cards - Premium Gradient Borders */}
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {/* Income Card */}
                            <div className="glass-panel p-4 rounded-[24px] relative overflow-hidden group flex flex-col items-center justify-center text-center border-t-2 border-t-emerald-200/50">
                                <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl group-hover:scale-125 transition-all duration-700"></div>
                                <div className="text-emerald-600 text-[10px] font-black uppercase mb-1.5 flex items-center justify-center gap-1.5 relative z-10 tracking-wider bg-emerald-50/80 px-2 py-0.5 rounded-full"><TrendingUp size={12}/> Thu Nhập</div>
                                <div className="font-black text-xl text-slate-800 relative z-10 tracking-tight">{formatCurrency(sumIncome)}</div>
                            </div>
                            {/* Expense Card */}
                            <div className="glass-panel p-4 rounded-[24px] relative overflow-hidden group flex flex-col items-center justify-center text-center border-t-2 border-t-rose-200/50">
                                 <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-400/20 rounded-full blur-2xl group-hover:scale-125 transition-all duration-700"></div>
                                <div className="text-rose-600 text-[10px] font-black uppercase mb-1.5 flex items-center justify-center gap-1.5 relative z-10 tracking-wider bg-rose-50/80 px-2 py-0.5 rounded-full"><TrendingDown size={12}/> Chi Tiêu</div>
                                <div className="font-black text-xl text-slate-800 relative z-10 tracking-tight">{formatCurrency(sumExpense)}</div>
                            </div>
                        </div>

                        {/* Cloud Status */}
                        <div className="mt-5 flex justify-center">
                            {!isConnected ? (
                                <button onClick={onOpenCloud} className="flex items-center gap-2 bg-white/70 border border-white/60 px-5 py-2 rounded-full text-[10px] font-bold text-slate-500 transition-all backdrop-blur-md shadow-sm hover:bg-white hover:text-indigo-600">
                                    <CloudOff size={14} className="text-slate-400"/> <span>Kết nối Cloud</span>
                                </button>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div onClick={onOpenCloud} className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-100 px-4 py-1.5 rounded-full backdrop-blur-md cursor-pointer shadow-sm hover:shadow-md transition-all">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] text-emerald-700 font-bold tracking-wider">{familyCode}</span>
                                    </div>
                                    {isSyncing && <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 tracking-[0.2em] animate-pulse">Đang đồng bộ...</span>}
                                </div>
                            )}
                            {syncError && <div className="text-[9px] bg-red-50 text-red-500 px-3 py-1 rounded-full mt-2 font-bold animate-bounce border border-red-100 mx-auto w-max shadow-sm">LỖI: {syncError}</div>}
                        </div>
                    </div>

                    {/* Navigation Tabs (Sticky) */}
                    <div className="px-6 sticky top-0 z-30 py-3 bg-gradient-to-b from-white/20 to-transparent backdrop-blur-sm -mx-1">
                        <div className="glass-panel p-1.5 flex border border-white/60 overflow-x-auto no-scrollbar rounded-2xl shadow-lg shadow-indigo-100/20">
                            {(['add', 'debt', 'report', 'savings', 'history', 'settings'] as TabType[]).map(tab => (
                                <button key={tab} onClick={() => onTabChange(tab)} className={`flex-1 min-w-[60px] py-3 rounded-xl text-[9px] font-bold uppercase transition-all duration-300 btn-effect flex flex-col items-center gap-1.5 ${activeTab === tab ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}>
                                    {tab === 'add' ? 'Nhập' : tab === 'debt' ? 'Nợ' : tab === 'report' ? 'Báo Cáo' : tab === 'savings' ? 'Tiết Kiệm' : tab === 'history' ? 'Lịch Sử' : <SettingsIcon size={16}/>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-6">
                        {children}
                    </div>
                </div>

                {/* 3. Floating Action Buttons - Bottom Fixed */}
                <div className="absolute bottom-6 left-6 z-50 flex flex-col gap-3 safe-pb">
                    <button onClick={onOpenFixedTracking} className="relative w-14 h-14 rounded-full glass-panel border border-white/80 flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all duration-200 group shadow-xl shadow-indigo-500/20 bg-white/80">
                        <div className="absolute inset-0 bg-indigo-50 rounded-full animate-pulse opacity-50"></div>
                        <MessageCircle size={26} className="text-indigo-600 relative z-10 drop-shadow-sm group-hover:text-violet-600 transition-colors"/>
                    </button>
                </div>

                <div onClick={onReload} className="absolute bottom-6 right-6 z-50 cursor-pointer safe-pb">
                    <div className={`glass-panel rounded-full pl-2 pr-6 py-2 flex items-center gap-3 border border-white/80 transform active:scale-95 transition-all shadow-xl ${balance>=0?'bg-white/80 shadow-emerald-100':'bg-rose-50/90 shadow-rose-100'}`}>
                        <div className={`p-3 rounded-full ${balance>=0 ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600' : 'bg-gradient-to-br from-rose-100 to-pink-100 text-rose-600'}`}><Wallet size={20}/></div>
                        <div className="flex flex-col items-start">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Số dư</span>
                            <span className={`font-black text-lg leading-none tracking-tight ${balance>=0 ? 'text-slate-700' : 'text-rose-500'}`}>{formatCurrency(balance)}</span>
                        </div>
                    </div>
                </div>

                {/* 4. Modals */}
                {modals}
            </div>
        </div>
    );
};

export default AppLayout;

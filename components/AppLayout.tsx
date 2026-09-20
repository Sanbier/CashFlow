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
  Smartphone,
  PieChart,
  GraduationCap,
  TableColumns,
  History,
  Plus
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

    // Dynamic Island interactive expansion state
    const [islandExpanded, setIslandExpanded] = useState(false);

    // Screen Power State (Simulated Power Button toggle)
    const [isScreenOn, setIsScreenOn] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        }, 15000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center font-sans overflow-x-hidden sm:overflow-y-auto select-none sm:select-text sm:bg-gradient-to-br sm:from-[#090b10] sm:via-[#10141f] sm:to-[#08090d] sm:py-8 sm:px-4">
            {/* Desktop Studio Lighting & Ambient Glow (Visible on PC / Tablet) */}
            <div className="hidden sm:block fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[900px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>
                <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none"></div>
            </div>

            {/* Desktop Info Badge */}
            <div className="hidden sm:flex fixed top-5 right-6 z-50 items-center gap-2.5 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-xl text-white text-xs font-bold rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/15 transition-all">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <Smartphone size={14} className="text-indigo-400" />
                <span className="tracking-wide">iPhone 16 Pro Max • iOS 18</span>
            </div>

            {/* Hyper-realistic Phone Chassis Wrapper (Active on Desktop, collapses cleanly on mobile) */}
            <div className="relative w-full h-[100dvh] sm:w-[416px] sm:h-[875px] sm:rounded-[60px] sm:bg-gradient-to-b sm:from-[#3a3b40] sm:via-[#222327] sm:to-[#121316] sm:p-[12px] sm:shadow-[0_45px_110px_-15px_rgba(0,0,0,0.85),0_20px_50px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.22),inset_0_1px_1px_rgba(255,255,255,0.3)] sm:ring-2 sm:ring-black/60 flex flex-col transition-all duration-300 z-10 shrink-0">

                {/* Metallic Antenna Bands (4 corners on titanium frame) */}
                <div className="hidden sm:block absolute -left-[1px] top-24 w-[2px] h-[5px] bg-[#141416]"></div>
                <div className="hidden sm:block absolute -left-[1px] bottom-24 w-[2px] h-[5px] bg-[#141416]"></div>
                <div className="hidden sm:block absolute -right-[1px] top-24 w-[2px] h-[5px] bg-[#141416]"></div>
                <div className="hidden sm:block absolute -right-[1px] bottom-24 w-[2px] h-[5px] bg-[#141416]"></div>

                {/* Physical Hardware Buttons on Left Side */}
                {/* 1. Action Button (with subtle orange/gold chamfer) */}
                <div
                    onClick={() => setIslandExpanded(!islandExpanded)}
                    title="Action Button (Bấm thử Dynamic Island)"
                    className="hidden sm:block absolute -left-[14px] top-24 w-[3.5px] h-7 bg-gradient-to-r from-amber-600 to-amber-500 rounded-l shadow-md cursor-pointer hover:brightness-125 active:scale-95 transition-all"
                ></div>

                {/* 2. Volume Up */}
                <div className="hidden sm:block absolute -left-[14px] top-36 w-[3.5px] h-12 bg-gradient-to-r from-slate-500 to-slate-700 rounded-l shadow-md"></div>
                {/* 3. Volume Down */}
                <div className="hidden sm:block absolute -left-[14px] top-52 w-[3.5px] h-12 bg-gradient-to-r from-slate-500 to-slate-700 rounded-l shadow-md"></div>

                {/* Physical Hardware Buttons on Right Side */}
                {/* 4. Side / Power Button (Click to toggle screen on/off!) */}
                <div
                    onClick={() => setIsScreenOn(!isScreenOn)}
                    title="Nút Nguồn (Bấm để bật/tắt màn hình)"
                    className="hidden sm:block absolute -right-[14px] top-40 w-[3.5px] h-16 bg-gradient-to-l from-slate-500 to-slate-700 rounded-r shadow-md cursor-pointer hover:brightness-125 active:scale-95 transition-all"
                ></div>

                {/* 5. Camera Control Sensor (iPhone 16 Pro feature) */}
                <div className="hidden sm:block absolute -right-[13px] bottom-44 w-[2px] h-14 bg-gradient-to-l from-slate-600 to-slate-800 rounded-r shadow-inner"></div>

                {/* Inner Bezel (True Black Uniform Screen Border) */}
                <div className="relative w-full h-full sm:rounded-[50px] sm:bg-black sm:p-[4px] overflow-hidden flex flex-col">

                    {/* Earpiece Speaker Slit (Centered in top bezel) */}
                    <div className="hidden sm:flex absolute top-[6px] left-1/2 -translate-x-1/2 w-14 h-[3.5px] bg-[#161719] rounded-full z-40 border border-neutral-800/70 items-center justify-center">
                        <div className="w-10 h-[1.5px] bg-neutral-900 rounded-full"></div>
                    </div>

                    {/* Active OLED Display Surface */}
                    <div className="relative w-full h-full sm:rounded-[46px] overflow-hidden flex flex-col bg-slate-900 select-none sm:select-text">

                        {/* SCREEN OFF (AOD / Sleep Mode when user clicks Power Button) */}
                        {!isScreenOn ? (
                            <div
                                onClick={() => setIsScreenOn(true)}
                                className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-between py-16 text-white/50 cursor-pointer animate-fadeIn"
                            >
                                <div className="text-center">
                                    <div className="text-4xl font-light tracking-tight text-white/80">{currentTime}</div>
                                    <div className="text-xs uppercase font-bold tracking-widest text-white/40 mt-1">Chạm để mở khóa</div>
                                </div>
                                <div className="text-xs font-semibold text-white/30 flex items-center gap-1.5 animate-pulse">
                                    <Smartphone size={14} /> Bấm màn hình hoặc nút nguồn
                                </div>
                                <div className="w-32 h-1 bg-white/20 rounded-full"></div>
                            </div>
                        ) : null}

                        {/* SCREEN ON: Authentic iOS 18 Dynamic Wallpaper & Glass Backdrop */}
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-br from-[#dfe9f3] via-[#ffffff] to-[#eef2f8]">
                            {/* Radiant iOS 18 Mesh Blobs strictly contained INSIDE the phone screen */}
                            <div className="absolute -top-16 -left-16 w-80 h-80 bg-gradient-to-br from-indigo-300/80 to-purple-400/70 rounded-full filter blur-3xl opacity-80 animate-blob"></div>
                            <div className="absolute top-1/3 -right-16 w-80 h-80 bg-gradient-to-br from-pink-300/80 to-rose-300/60 rounded-full filter blur-3xl opacity-75 animate-blob animation-delay-2000"></div>
                            <div className="absolute -bottom-16 left-10 w-80 h-80 bg-gradient-to-tr from-sky-200/90 to-blue-300/70 rounded-full filter blur-3xl opacity-85 animate-blob animation-delay-4000"></div>
                        </div>

                        {/* Screen Glass Specular Glare (Subtle light reflection across the glass) */}
                        <div className="hidden sm:block absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none z-30"></div>

                        {/* ========================================================================= */}
                        {/* iOS TOP STATUS BAR & DYNAMIC ISLAND                                      */}
                        {/* ========================================================================= */}
                        <div className="hidden sm:flex items-center justify-between px-7 pt-3 pb-1 shrink-0 z-30 select-none relative">
                            {/* Left: Clock */}
                            <span className="text-[13px] font-bold text-slate-800 tracking-tight pl-1 font-sans">
                                {currentTime}
                            </span>

                            {/* Center: Dynamic Island */}
                            <div
                                onClick={() => setIslandExpanded(!islandExpanded)}
                                className={`bg-black rounded-full text-white shadow-lg cursor-pointer transition-all duration-300 ease-out flex items-center justify-between ${
                                    islandExpanded
                                        ? 'w-72 h-10 px-3.5 py-1 scale-105'
                                        : 'w-[118px] h-[30px] px-2.5 hover:scale-105'
                                }`}
                                title="Bấm vào Dynamic Island để thu/phóng"
                            >
                                {!islandExpanded ? (
                                    <>
                                        {/* Front Camera Lens with Sapphire Reflection */}
                                        <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700/60 ring-1 ring-blue-900/50 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-950 flex items-center justify-center">
                                                <div className="w-0.5 h-0.5 rounded-full bg-blue-400/70"></div>
                                            </div>
                                        </div>

                                        {/* FaceID / TrueDepth Sensor & Privacy Dot */}
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-neutral-900"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full flex items-center justify-between text-xs animate-fadeIn">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                                            <span className="font-extrabold text-[11px] text-emerald-400">CashFlow Online</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                            <span>Đã đồng bộ</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Cellular, Wi-Fi, Realistic Battery */}
                            <div className="flex items-center gap-1.5 text-slate-800 pr-1">
                                <Signal size={13} strokeWidth={2.5} />
                                <Wifi size={13} strokeWidth={2.5} />

                                {/* Realistic Apple Battery Pill */}
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-black">98%</span>
                                    <div className="w-5 h-2.5 rounded-[4px] border-[1.2px] border-slate-800 p-[1.5px] flex items-center relative">
                                        <div className="h-full w-[90%] bg-slate-800 rounded-[2px]"></div>
                                        <div className="w-[1.5px] h-[3px] bg-slate-800 rounded-r-[1px] absolute -right-[2.5px] top-1/2 -translate-y-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Overbudget Warning Toast */}
                        {isOverBudget && (
                            <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg z-20 shrink-0">
                                <AlertTriangle size={16} /> CẢNH BÁO: CHI TIÊU VƯỢT 90%
                            </div>
                        )}

                        {/* Scrollable Screen Content (with smooth touch bouncing) */}
                        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col overscroll-contain z-10">

                            {/* 1. Header Section */}
                            <div className="p-6 pb-2 relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <button onClick={onPrevMonth} className="p-3 bg-white/70 hover:bg-white/90 rounded-2xl text-slate-700 btn-effect backdrop-blur-md shadow-sm border border-white/60"><ChevronLeft size={20}/></button>
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5 tracking-wider uppercase">{formatDate(startDate.toISOString())} - {formatDate(endDate.toISOString())}</span>
                                        <div className="font-black text-xl text-slate-800 flex items-center gap-2 justify-center uppercase tracking-wide drop-shadow-sm"><CalendarIcon size={18} className="text-purple-600"/> Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}</div>
                                    </div>
                                    <button onClick={onNextMonth} className="p-3 bg-white/70 hover:bg-white/90 rounded-2xl text-slate-700 btn-effect backdrop-blur-md shadow-sm border border-white/60"><ChevronRight size={20}/></button>
                                </div>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="glass-panel p-4 rounded-3xl border border-white/80 relative overflow-hidden group flex flex-col items-center justify-center text-center shadow-sm">
                                        <div className="absolute -right-6 -top-6 w-16 h-16 bg-green-300/30 rounded-full blur-xl group-hover:scale-150 transition-all duration-700"></div>
                                        <div className="text-green-700 text-[10px] font-black uppercase mb-1 flex items-center justify-center gap-1 relative z-10"><TrendingUp size={12}/> Thu Nhập</div>
                                        <div className="font-black text-base sm:text-lg text-slate-800 relative z-10">{formatCurrency(sumIncome)}</div>
                                    </div>
                                    <div className="glass-panel p-4 rounded-3xl border border-white/80 relative overflow-hidden group flex flex-col items-center justify-center text-center shadow-sm">
                                        <div className="absolute -right-6 -top-6 w-16 h-16 bg-red-300/30 rounded-full blur-xl group-hover:scale-150 transition-all duration-700"></div>
                                        <div className="text-red-600 text-[10px] font-black uppercase mb-1 flex items-center justify-center gap-1 relative z-10"><TrendingDown size={12}/> Chi Tiêu</div>
                                        <div className="font-black text-base sm:text-lg text-slate-800 relative z-10">{formatCurrency(sumExpense)}</div>
                                    </div>
                                </div>

                                {/* Cloud Status */}
                                <div className="mt-4 flex justify-center">
                                    {!isConnected ? (
                                        <button onClick={onOpenCloud} className="flex items-center gap-2 bg-white/70 border border-white/80 px-4 py-1.5 rounded-full text-[10px] font-bold text-slate-600 transition-all backdrop-blur-md shadow-sm hover:bg-white/90">
                                            <CloudOff size={12} className="text-gray-400"/> <span>Kết nối Cloud</span>
                                        </button>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div onClick={onOpenCloud} className="flex items-center gap-2 bg-green-100/70 border border-green-200/60 px-3.5 py-1 rounded-full backdrop-blur-md cursor-pointer shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="text-[10px] text-green-700 font-bold tracking-wider">{familyCode}</span>
                                            </div>
                                            {isSyncing && <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 tracking-widest animate-pulse">Đang đồng bộ...</span>}
                                        </div>
                                    )}
                                    {syncError && <div className="text-[9px] bg-red-100 text-red-600 px-3 py-1 rounded-full mt-2 font-bold animate-bounce border border-red-200 mx-auto w-max shadow-sm">LỖI: {syncError}</div>}
                                </div>
                            </div>

                            {/* 2. iOS Segmented Navigation Tabs */}
                            <div className="px-3 sm:px-6 sticky top-0 z-20 py-2">
                                <div className="glass-panel p-1.5 flex border border-white/70 overflow-x-auto no-scrollbar rounded-2xl shadow-sm gap-1">
                                    {([
                                        { key: 'add', label: 'Nhập', icon: <Plus size={13} strokeWidth={2.5}/> },
                                        { key: 'budget', label: 'Sinh Hoạt', icon: <PieChart size={13}/> },
                                        { key: 'childSchool', label: 'Lịch Học', icon: <GraduationCap size={13}/> },
                                        { key: 'cashflow12M', label: 'Dòng Tiền', icon: <TableColumns size={13}/> },
                                        { key: 'history', label: 'Lịch Sử', icon: <History size={13}/> },
                                        { key: 'settings', label: 'Cài Đặt', icon: <SettingsIcon size={13}/> }
                                    ] as const).map(({ key, label, icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => onTabChange(key as TabType)}
                                            className={`flex-1 min-w-[48px] py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all duration-200 btn-effect flex flex-col items-center justify-center gap-0.5 ${
                                                activeTab === key
                                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md'
                                                    : 'text-slate-500 hover:bg-white/40'
                                            }`}
                                        >
                                            {icon}
                                            <span className="truncate leading-none">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Main Tab Content (Ample bottom clearance so scrolling avoids floating buttons) */}
                            <div className="p-6 pb-36 flex-1">
                                {children}
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* 4. FLOATING ACTION CONTROLS & BOTTOM DOCK                                */}
                        {/* ========================================================================= */}
                        <div className="absolute bottom-5 sm:bottom-6 left-4 right-4 z-30 pointer-events-none flex items-center justify-between">
                            {/* Left FAB: Fixed Expenses Tracking */}
                            <button
                                onClick={onOpenFixedTracking}
                                className="pointer-events-auto relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white/95 border border-white/90 flex items-center justify-center transform hover:scale-105 active:scale-90 transition-all duration-200 group shadow-[0_10px_25px_rgba(0,0,0,0.12)] backdrop-blur-xl ring-1 ring-black/5"
                                title="Chi cố định hàng tháng"
                            >
                                <div className="absolute inset-0 bg-indigo-50/70 rounded-full"></div>
                                <MessageCircle size={22} className="text-indigo-600 relative z-10 drop-shadow-sm group-hover:text-purple-600 transition-colors"/>
                            </button>

                            {/* Right FAB: Wallet Balance & Quick Reload */}
                            <div
                                onClick={onReload}
                                className="pointer-events-auto cursor-pointer"
                                title="Số dư hiện tại (Bấm để tải lại)"
                            >
                                <div className={`rounded-full pl-2.5 pr-4 py-2 flex items-center gap-2.5 border border-white/90 transform active:scale-95 transition-all shadow-[0_10px_25px_rgba(0,0,0,0.12)] backdrop-blur-xl ring-1 ring-black/5 ${balance >= 0 ? 'bg-white/95' : 'bg-red-50/95'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-inner ${balance >= 0 ? 'bg-indigo-500 text-white' : 'bg-red-500 text-white'}`}>
                                        <Wallet size={16}/>
                                    </div>
                                    <div className="flex flex-col items-start pr-1">
                                        <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">Số dư</span>
                                        <span className={`font-black text-sm leading-none tracking-tight ${balance >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
                                            {formatCurrency(balance)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. iOS Home Indicator Bar (Desktop only) */}
                        <div className="hidden sm:flex justify-center items-center py-2 shrink-0 z-30 select-none">
                            <div className="w-36 h-1 bg-slate-800/45 hover:bg-slate-800/70 transition-colors rounded-full cursor-pointer"></div>
                        </div>

                        {/* 6. Modals Container */}
                        {modals}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppLayout;

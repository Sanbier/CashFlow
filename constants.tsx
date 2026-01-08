import React from 'react';

export const DEBT_CATEGORY_NAME = "Nợ (Vay - Trả Góp)";

export const SAVING_CATEGORIES = [
    "Tiết Kiệm Mục Tiêu", 
    "Tiết Kiệm Ngắn Hạn", 
    "Quỹ Khẩn Cấp"        
];

export const DEFAULT_CATEGORIES = [
    "Ăn (Sáng/Trưa/Tối)", "Ăn vặt/Nước ngọt", "Wi-Fi & Điện", "Cưới hỏi & Ma chay", 
    "Học phí cho Con", "Bỉm cho Con", "Sữa cho Con", "Xăng xe", 
    "Rác thải sinh hoạt", "Nhu Yếu Phẩm", "Đồ dùng Y Tế", 
    ...SAVING_CATEGORIES,
    "Tiền Cá Nhân", DEBT_CATEGORY_NAME, "Mua Sắm"
];

interface IconProps {
  size?: number;
  className?: string;
}

const IconBase: React.FC<IconProps & { children: React.ReactNode }> = ({ size = 24, className = "", children }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

export const Plus: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M5 12h14"/><path d="M12 5v14"/></IconBase>;
export const Trash2: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></IconBase>;
export const Wallet: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></IconBase>;
export const TrendingUp: React.FC<IconProps> = (p) => <IconBase {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></IconBase>;
export const TrendingDown: React.FC<IconProps> = (p) => <IconBase {...p}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></IconBase>;
export const CalendarIcon: React.FC<IconProps> = (p) => <IconBase {...p}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></IconBase>;
export const PieChart: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></IconBase>;
export const History: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></IconBase>;
export const Save: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></IconBase>;
export const ChevronLeft: React.FC<IconProps> = (p) => <IconBase {...p}><path d="m15 18-6-6 6-6"/></IconBase>;
export const ChevronRight: React.FC<IconProps> = (p) => <IconBase {...p}><path d="m9 18 6-6-6-6"/></IconBase>;
export const ChevronUp: React.FC<IconProps> = (p) => <IconBase {...p}><path d="m18 15-6-6-6 6"/></IconBase>;
export const ChevronDown: React.FC<IconProps> = (p) => <IconBase {...p}><path d="m6 9 6 6 6-6"/></IconBase>;
export const RefreshCw: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></IconBase>;
export const Settings: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.35a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></IconBase>;
export const Download: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></IconBase>;
export const Upload: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></IconBase>;
export const Activity: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></IconBase>;
export const Edit2: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></IconBase>;
export const Search: React.FC<IconProps> = (p) => <IconBase {...p}><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></IconBase>;
export const AlertTriangle: React.FC<IconProps> = (p) => <IconBase {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></IconBase>;
export const X: React.FC<IconProps> = (p) => <IconBase {...p}><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></IconBase>;
export const Cloud: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M17.5 19c0-1.7-1.3-3-3-3h-1.1c-.1-2.6-2.2-4.7-4.8-4.7-2.3 0-4.2 1.6-4.7 3.8C1.8 15.6 0 17.5 0 20c0 2.8 2.2 5 5 5h12.5c2.5 0 4.5-2 4.5-4.5S20 16 17.5 19Z"/></IconBase>;
export const CloudOff: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"/><line x1="1" x2="23" y1="1" y2="23"/></IconBase>;
export const FileSpreadsheet: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></IconBase>;
export const BookOpen: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></IconBase>;
export const CheckSquare: React.FC<IconProps> = (p) => <IconBase {...p}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></IconBase>;
export const PiggyBank: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M19 5c-1.5 0-2.8.6-3.5 1.5A5.6 5.6 0 0 0 12 5.5v.5h-.5a1.5 1.5 0 0 0 0 3h.5v.5a2 2 0 0 1-2 2 2 2 0 0 0-2-2h-2.5a2 2 0 0 0-2 2V13c0 2.5 4.5 4 4.5 4h1a5.5 5.5 0 0 0 5.5-5.5v-1a5.5 5.5 0 0 0 .8-2.5 1 1 0 0 0-1-1H19v-2Z"/><path d="M16 5.5a2.5 2.5 0 0 0-5 0V6h5v-.5Z"/><circle cx="16" cy="10" r="1"/></IconBase>;
export const Users: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></IconBase>;
export const MessageCircle: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></IconBase>;
export const Clock: React.FC<IconProps> = (p) => <IconBase {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></IconBase>;
export const LinkIcon: React.FC<IconProps> = (p) => <IconBase {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></IconBase>;
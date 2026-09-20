import React, { useState } from 'react';
import { Cloud, X, AlertTriangle, ShieldCheck, DEFAULT_FIREBASE_CONFIG_STR, DEFAULT_FAMILY_CODE, RefreshCw } from '../../constants';

interface ModalCloudConfigProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  currentConfig: string;
}

const ModalCloudConfig: React.FC<ModalCloudConfigProps> = ({
  isOpen,
  onClose,
  currentCode,
  currentConfig,
}) => {
  const [code, setCode] = useState(currentCode);
  const [config, setConfig] = useState(currentConfig);
  const [passphrase, setPassphrase] = useState(() => localStorage.getItem('fb_passphrase') || '');

  const handleResetDefault = () => {
    setCode(DEFAULT_FAMILY_CODE);
    setConfig(DEFAULT_FIREBASE_CONFIG_STR);
  };

  const handleSave = () => {
    const finalCode = code.trim().toUpperCase();
    if (!finalCode || !config.trim()) {
      alert('Vui lòng nhập đầy đủ Mã Gia Đình và cấu hình Firebase JSON');
      return;
    }

    try {
      JSON.parse(config);
    } catch {
      alert('Cấu hình Firebase không phải là JSON hợp lệ!');
      return;
    }

    localStorage.setItem('fb_config', config.trim());
    localStorage.setItem('fb_family_code', finalCode);
    localStorage.setItem('fb_passphrase', passphrase.trim());
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed sm:absolute inset-0 bg-black/80 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-[36px] w-full max-w-sm p-6 shadow-2xl text-left border border-white/20 relative max-h-[85vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition-all"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Cloud size={24} />
          </div>
          <div>
            <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">Đám Mây Riêng</h3>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đồng bộ Firebase Firestore</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">
              Mã Gia Đình (Đồng bộ giữa các máy)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-800"
              placeholder="VÍ DỤ: GIADINH001"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">
              Mã Bảo Mật / Passphrase (Mã hóa AES-256 E2EE)
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-800"
              placeholder="Nhập mật khẩu mã hóa chung giữa các máy..."
            />
            <span className="text-[8px] text-gray-400 block mt-1 ml-1">
              Khóa bí mật: dữ liệu lưu trên Firestore sẽ được mã hóa đầu cuối, không ai xem trộm được.
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Firebase Config JSON
              </label>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95 transition-all"
                title="Khôi phục về cấu hình Firebase mặc định"
              >
                <RefreshCw size={10} /> Khôi phục mặc định
              </button>
            </div>
            <textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[10px] h-32 outline-none resize-none font-mono focus:border-blue-500 focus:bg-white transition-all text-gray-800"
              placeholder='{"apiKey": "...", "projectId": "...", ...}'
            />
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 text-[10px] font-black uppercase">
              <ShieldCheck size={14} className="text-emerald-600" /> Hướng dẫn Firestore Security Rules
            </div>
            <p className="text-[9px] text-slate-500 font-mono leading-relaxed bg-white p-2 rounded-xl border border-slate-200 select-all">
              match /families/{'{familyCode}'} {'{'} allow read, write: if true; {'}'}
            </p>
            <p className="text-[8px] text-slate-400">
              * Khi bật Mã Bảo Mật, toàn bộ nội dung đã được mã hóa AES-256 trước khi gửi lên server.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200/50 uppercase text-xs tracking-widest btn-effect hover:shadow-blue-300 transition-all"
          >
            Lưu & Kết Nối Ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCloudConfig;

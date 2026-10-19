import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, User, Lock, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface AccountProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountProfileModal: React.FC<AccountProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, changePasswordFromProfile } = useApp();

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const res = await changePasswordFromProfile(currentPass, newPass, confirmPass);
    if (!res.success) {
      setMessage({ type: 'error', text: res.message });
    } else {
      setMessage({ type: 'success', text: res.message });
      // Xóa cả ba ô mật khẩu sau khi đổi thành công.
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  const handleClose = () => {
    // Reset inputs on close
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">Xem tài khoản và đổi mật khẩu</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tên đăng nhập (chỉ đọc) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Tên đăng nhập </label>
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-600">
              <span className="font-mono font-medium">{currentUser.username}</span>
              <span className="text-xs text-slate-400 ml-auto">(Chỉ đọc)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold text-slate-700 uppercase mb-1">Họ và tên</span>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium">
                {currentUser.fullName}
              </div>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-700 uppercase mb-1">Vai trò</span>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-blue-800 font-semibold">
                {currentUser.role}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5 mb-3">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Đổi mật khẩu </h4>

            {/* Mật khẩu hiện tại */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Nhập mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Dòng hướng dẫn: Mật khẩu mới có ít nhất 12 ký tự.</p>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {message && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Quay lại </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Đổi mật khẩu </button>
          </div>
        </form>
      </div>
    </div>
  );
};

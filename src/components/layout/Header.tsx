import { toUserMessage } from '../../utils/userMessages';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, User, LogOut, Key, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentTabName: string;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabName,
  onOpenProfile,
  onOpenLogin
}) => {
  const { currentUser, logout } = useApp();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const handleLogoutClick = () => {
    setShowAccountMenu(false);
    const res = logout();
    alert(toUserMessage(res.message));
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 py-3.5 bg-white border-b border-slate-200">
      {/* Brand title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
          AB </div>
        <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 truncate max-w-[185px] sm:max-w-xs">
          Chung cư mini An Bình </span>
      </div>

      {/* Active section breadcrumb */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 truncate">
        <span>Hệ thống Quản lý</span>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-slate-800 truncate">{currentTabName}</span>
      </div>

      {/* Primary Action & Account Menu */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Account Menu */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer text-xs font-medium text-slate-700"
            >
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <span className="max-w-[120px] truncate hidden sm:inline">{currentUser.fullName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Menu Dropdown */}
            {showAccountMenu && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="font-semibold text-slate-900 truncate">{currentUser.fullName}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</div>
                  <div className="text-[10px] text-blue-700 font-bold uppercase mt-0.5">{currentUser.role}</div>
                </div>

                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Key className="w-4 h-4 text-slate-500" />
                  <span>Xem tài khoản & đổi mật khẩu</span>
                </button>

                <button
                  onClick={handleLogoutClick}
                  className="w-full px-3.5 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Đăng nhập </button>
        )}
      </div>
    </header>
  );
};

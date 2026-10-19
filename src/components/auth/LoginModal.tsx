import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  ArrowRight
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    currentSession,
    currentUser,
    login,
    changePasswordFirstLogin,
    requestPasswordResetEmail,
    resetPasswordWithToken,
    logout
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'forgot' | 'reset_token' | 'first_change'>('login');

  // Form fields - Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields - First Time Change
  const [firstCurrentPass, setFirstCurrentPass] = useState('');
  const [firstNewPass, setFirstNewPass] = useState('');
  const [firstConfirmPass, setFirstConfirmPass] = useState('');
  const [firstChangeMsg, setFirstChangeMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Form fields - Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [demoResetToken, setDemoResetToken] = useState<string | null>(null);

  // Form fields - Reset with Token
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [tokenNewPass, setTokenNewPass] = useState('');
  const [tokenConfirmPass, setTokenConfirmPass] = useState('');
  const [tokenResetMsg, setTokenResetMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Effect to switch tab when first time change password is required
  useEffect(() => {
    if (currentSession && currentSession.type === 'temp_change_password') {
      setActiveTab('first_change');
    } else if (!currentSession && activeTab === 'first_change') {
      setActiveTab('login');
    }
  }, [currentSession]);

  if (!isOpen && currentSession && currentSession.type !== 'temp_change_password') {
    return null;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setSubmitting(true);
    let res;
    try { res = await login(username, password); } catch { res = {success:false, message:'Không thể xác thực. Vui lòng mở website bằng HTTPS.'}; }
    setSubmitting(false);
    if (!res.success) {
      setLoginError(res.message || "Lỗi đăng nhập");
    } else {
      if (res.requireChangePass) {
        setActiveTab('first_change');
      } else {
        onClose();
        if (onSuccess) onSuccess();
      }
    }
  };

  const handleFirstChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirstChangeMsg(null);
    setSubmitting(true);
    let res;
    try { res = await changePasswordFirstLogin(firstCurrentPass, firstNewPass, firstConfirmPass); } catch { res = {success:false,message:'Đổi mật khẩu thất bại. Vui lòng thử lại.'}; }
    setSubmitting(false);
    if (!res.success) {
      setFirstChangeMsg({ type: 'error', text: res.message });
    } else {
      setFirstChangeMsg({ type: 'success', text: res.message });
      setPassword(''); setFirstCurrentPass(''); setFirstNewPass(''); setFirstConfirmPass('');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    const res = requestPasswordResetEmail(forgotEmail);
    if (!res.success) {
      setForgotMsg({ type: 'error', text: res.message });
    } else {
      setForgotMsg({ type: 'success', text: res.message });
      if (res.generatedToken) {
        setDemoResetToken(res.generatedToken || null);
      }
    }
  };

  const handleResetWithTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenResetMsg(null);
    const res = await resetPasswordWithToken(resetTokenInput, tokenNewPass, tokenConfirmPass);
    if (!res.success) {
      setTokenResetMsg({ type: 'error', text: res.message });
    } else {
      setTokenResetMsg({ type: 'success', text: res.message });
      setTimeout(() => {
        setActiveTab('login');
        setForgotMsg(null);
        setDemoResetToken(null);
      }, 1500);
    }
  };

  const handleCancelFirstChange = () => {
    logout();
    setPassword(''); setFirstCurrentPass(''); setFirstNewPass(''); setFirstConfirmPass('');
    setActiveTab('login');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white text-center relative">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-3 shadow-md">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold">Chung cư mini An Bình</h2>
          <p className="text-xs text-slate-300 mt-1">Hệ thống Quản lý Vận hành Toàn diện</p>

          {/* Breadcrumb Flow indicator */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] text-blue-300 font-medium">
            {activeTab === 'login' && <span>Đăng nhập → Quản lý phòng</span>}
            {(activeTab === 'forgot' || activeTab === 'reset_token') && <span>Quên mật khẩu → Đặt lại mật khẩu</span>}
            {activeTab === 'first_change' && <span>Đổi mật khẩu lần đầu</span>}
          </div>
        </div>

        {/* Tab selection */}
        {activeTab !== 'first_change' && (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-blue-700 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đăng nhập </button>
            <button
              onClick={() => setActiveTab('forgot')}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
                activeTab === 'forgot' || activeTab === 'reset_token'
                  ? 'bg-white text-blue-700 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Quên mật khẩu </button>
          </div>
        )}

        <div className="p-6">
          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập được cấp"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    Quên mật khẩu? </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{submitting ? 'Đang xác thực...' : 'Đăng nhập'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700">Tài khoản Quản lý/Chủ nhà được cấp trước khi sử dụng. Không có chức năng tự đăng ký.</div>
              </div>
            </form>
          )}

          {/* TAB 2: FIRST TIME CHANGE PASSWORD */}
          {activeTab === 'first_change' && (
            <form onSubmit={handleFirstChangeSubmit} className="space-y-3.5">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs">
                Tài khoản của bạn được cấp mật khẩu tạm thời. Vui lòng đặt mật khẩu mới để tiếp tục vào Quản lý phòng. </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu hiện tại (được cấp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={firstCurrentPass}
                  onChange={(e) => setFirstCurrentPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Nhập mật khẩu vừa dùng đăng nhập"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={firstNewPass}
                  onChange={(e) => setFirstNewPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Mật khẩu tối thiểu 12 ký tự"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={firstConfirmPass}
                  onChange={(e) => setFirstConfirmPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </div>

              {firstChangeMsg && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    firstChangeMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {firstChangeMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{firstChangeMsg.text}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Lưu mật khẩu mới </button>
                <button
                  type="button"
                  onClick={handleCancelFirstChange}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Thoát </button>
              </div>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold mb-1">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Quên mật khẩu → Đặt lại mật khẩu</span>
              </div>
              <p className="text-xs text-slate-600">
                Khôi phục qua email yêu cầu dịch vụ gửi email và dữ liệu xác thực trên máy chủ. Bản xem thử chưa cấu hình chức năng này. </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email đã đăng ký <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Email khôi phục đã được xác minh"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {forgotMsg && (
                <div
                  className={`p-3 rounded-lg text-xs ${
                    forgotMsg.type === 'success'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {forgotMsg.text}
                </div>
              )}


              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Gửi liên kết đặt lại </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setForgotMsg(null);
                    setDemoResetToken(null);
                  }}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Quay lại Đăng nhập </button>
              </div>
            </form>
          )}

          {/* TAB 4: RESET PASSWORD WITH TOKEN */}
          {activeTab === 'reset_token' && (
            <form onSubmit={handleResetWithTokenSubmit} className="space-y-3.5">
              <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Đặt lại mật khẩu mới</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã xác nhận / Token từ email <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resetTokenInput}
                  onChange={(e) => setResetTokenInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono bg-slate-50"
                  placeholder="Mã token"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={tokenNewPass}
                  onChange={(e) => setTokenNewPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Tối thiểu 12 ký tự"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-0.5">Mật khẩu mới có ít nhất 12 ký tự.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={tokenConfirmPass}
                  onChange={(e) => setTokenConfirmPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </div>

              {tokenResetMsg && (
                <div
                  className={`p-3 rounded-lg text-xs ${
                    tokenResetMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {tokenResetMsg.text}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Hoàn tất đặt lại mật khẩu </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Quay lại Đăng nhập </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

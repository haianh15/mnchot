import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceFeeConfig } from '../../types';
import { Settings, Landmark, Zap, Droplets, Plus, Save, RotateCcw, AlertTriangle, History, CheckCircle2 } from 'lucide-react';

interface ConfigViewProps {
  onNavigateToNotices?: () => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({ onNavigateToNotices }) => {
  const {
    services,
    priceHistory,
    bankAccounts,
    activeBankAccount,
    updateUtilityPrices,
    updateBankAccount,
    paymentNotices
  } = useApp();

  const currentPrice = priceHistory[0];

  // Utility Price Form State 
  const [elecPrice, setElecPrice] = useState(currentPrice ? currentPrice.electricityPrice: 3500);
  const [waterPrice, setWaterPrice] = useState(currentPrice ? currentPrice.waterPrice: 30000);
  const [serviceList, setServiceList] = useState<ServiceFeeConfig[]>(services);
  const [effectivePeriod, setEffectivePeriod] = useState(currentPrice ? currentPrice.effectivePeriod: 'Kỳ 10/2026');
  const [priceSuccessMsg, setPriceSuccessMsg] = useState<string | null>(null);
  const [priceErrorMsg, setPriceErrorMsg] = useState<string | null>(null);

  // Bank Form State 
  const [bankName, setBankName] = useState(activeBankAccount ? activeBankAccount.bankName: 'MB Bank');
  const [accNum, setAccNum] = useState(activeBankAccount ? activeBankAccount.accountNumber: '0988123456');
  const [accHolder, setAccHolder] = useState(activeBankAccount ? activeBankAccount.accountHolder: 'NGUYEN VAN AN');
  const [bankSuccessMsg, setBankSuccessMsg] = useState<string | null>(null);
  const [bankErrorMsg, setBankErrorMsg] = useState<string | null>(null);

  // New service item
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvAmount, setNewSrvAmount] = useState(50000);

  // Check uncollected notices using old bank account
  const pendingNoticesWithOldBank = paymentNotices.filter(n =>
    n.status === 'Đang hiệu lực' &&
    n.paymentStatus === 'Chưa thu' &&
    activeBankAccount &&
    (n.qrBankSnapshot.accountNumber !== activeBankAccount.accountNumber || n.qrBankSnapshot.bankName !== activeBankAccount.bankName)
  );

  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault();
    setPriceSuccessMsg(null);
    setPriceErrorMsg(null);

    if (elecPrice <= 0 || waterPrice <= 0) {
      setPriceErrorMsg('Đơn giá điện và đơn giá nước phải là số lớn hơn 0.');
      return;
    }
    if (!effectivePeriod.trim()) {
      setPriceErrorMsg('Kỳ sử dụng bắt đầu áp dụng là trường bắt buộc.');
      return;
    }

    const success = updateUtilityPrices(elecPrice, waterPrice, serviceList, effectivePeriod);
    if (success) {
      setPriceSuccessMsg('Thiết lập và cập nhật đơn giá điện, nước và phí dịch vụ thành công!');
      setTimeout(() => setPriceSuccessMsg(null), 3000);
    } else {
      setPriceErrorMsg('Lỗi khi lưu đơn giá. Vui lòng thử lại.');
    }
  };

  const handleAddService = () => {
    if (!newSrvName.trim()) return;
    const newService: ServiceFeeConfig = {
      id: 'srv_' + Date.now(),
      name: newSrvName.trim(),
      unit: 'phòng/kỳ',
      amount: newSrvAmount,
      status: 'Đang áp dụng'
    };
    setServiceList(prev => [...prev, newService]);
    setNewSrvName('');
    setNewSrvAmount(50000);
  };

  const handleToggleServiceStatus = (id: string) => {
    setServiceList(prev => prev.map(s => {
      if (s.id !== id) return s;
      return {...s,
        status: s.status === 'Đang áp dụng' ? 'Ngừng áp dụng': 'Đang áp dụng'
      };
    }));
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setBankSuccessMsg(null);
    setBankErrorMsg(null);

    if (!bankName.trim() || !accNum.trim() || !accHolder.trim()) {
      setBankErrorMsg('Ngân hàng, Số tài khoản và Tên chủ tài khoản đều là trường bắt buộc.');
      return;
    }

    const success = updateBankAccount(bankName, accNum, accHolder);
    if (success) {
      setBankSuccessMsg('Thiết lập và cập nhật tài khoản ngân hàng nhận tiền thành công!');
      setTimeout(() => setBankSuccessMsg(null), 3000);
    } else {
      setBankErrorMsg('Lỗi khi lưu thông tin tài khoản ngân hàng.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Specs Guide */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Cài đặt</h1>
          </div>
        </div>
      </div>

      {/* Grid of Configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Đơn giá điện nước & dịch vụ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800">Đơn giá Điện, Nước & Dịch vụ</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Kỳ: {effectivePeriod}</span>
          </div>

          <form onSubmit={handleSavePrices} className="p-5 space-y-4 flex-1 flex flex-col">
            {/* Điện & Nước */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Đơn giá điện (đ/kWh) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={elecPrice}
                  onChange={(e) => setElecPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Ví dụ: 3500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  Đơn giá nước (đ/m³) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={waterPrice}
                  onChange={(e) => setWaterPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Ví dụ: 30000"
                />
              </div>
            </div>

            {/* Kỳ bắt đầu áp dụng */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kỳ sử dụng bắt đầu áp dụng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={effectivePeriod}
                onChange={(e) => setEffectivePeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="Ví dụ: Kỳ 10/2026"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Lưu ý: Mức giá mới chỉ dùng cho kỳ sử dụng chưa chốt; bảng tính tiền đã chốt giữ nguyên đơn giá gốc. </p>
            </div>

            {/* Danh mục phí dịch vụ cố định theo phòng/kỳ */}
            <div className="border-t border-slate-200 pt-3 flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Phí dịch vụ cố định (tính theo phòng/kỳ) </span>
              </div>

              <div className="space-y-2 mb-3">
                {serviceList.map((srv) => (
                  <div
                    key={srv.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{srv.name}</span>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {srv.amount.toLocaleString('vi-VN')} đ / {srv.unit}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleServiceStatus(srv.id)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${srv.status === 'Đang áp dụng' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200': 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                      {srv.status}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add service form */}
              <div className="p-2.5 rounded-lg border border-dashed border-slate-300 bg-white space-y-2">
                <span className="text-[11px] font-semibold text-slate-600">Thêm khoản phí dịch vụ mới:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSrvName}
                    onChange={(e) => setNewSrvName(e.target.value)}
                    placeholder="Tên dịch vụ (VD: Phí gửi xe máy)"
                    className="flex-1 px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={newSrvAmount}
                    onChange={(e) => setNewSrvAmount(Number(e.target.value))}
                    placeholder="Số tiền (đ)"
                    className="w-28 px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm </button>
                </div>
              </div>
            </div>

            {priceErrorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {priceErrorMsg}
              </div>
            )}
            {priceSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{priceSuccessMsg}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <History className="w-3.5 h-3.5" />
                Đã lưu {priceHistory.length} bản ghi lịch sử </span>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Lưu cấu hình đơn giá </button>
            </div>
          </form>
        </div>

        {/* Tài khoản ngân hàng nhận tiền */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-800">Tài khoản Ngân hàng Nhận Tiền</h2>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Duy nhất 1 tài khoản áp dụng </span>
          </div>

          <div className="p-5 space-y-4 flex-1 flex flex-col">
            {/* Active bank account card */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-blue-50/40">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block mb-2">
                Tài khoản đang áp dụng làm nguồn QR Code </span>
              {activeBankAccount ? (
                <div className="space-y-1.5 text-xs text-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-semibold">{activeBankAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">{activeBankAccount.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="font-semibold uppercase">{activeBankAccount.accountHolder}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-indigo-100 text-[11px] text-slate-400">
                    <span>Cập nhật gần nhất:</span>
                    <span>{new Date(activeBankAccount.updatedAt).toLocaleDateString('vi-VN')} ({activeBankAccount.updatedBy})</span>
                  </div>
                </div>
              ): (
                <p className="text-xs text-slate-500">Chưa có tài khoản ngân hàng nào được thiết lập.</p>
              )}
            </div>

            {/* Warning if old uncollected notices exist */}
            {pendingNoticesWithOldBank.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Cảnh báo: Có <strong>{pendingNoticesWithOldBank.length}</strong> thông báo chưa thu tiền đang dùng mã QR của tài khoản ngân hàng cũ. </span>
                </div>
                {onNavigateToNotices && (
                  <button
                    type="button"
                    onClick={onNavigateToNotices}
                    className="text-xs text-blue-700 font-semibold underline block cursor-pointer"
                  >
                    Xem danh sách thông báo cần phát hành lại mã QR → </button>
                )}
              </div>
            )}

            {/* Form to update bank account */}
            <form onSubmit={handleSaveBank} className="space-y-3 border-t border-slate-200 pt-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Thiết lập / Thay đổi tài khoản ngân hàng </span>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngân hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="MB Bank (Ngân hàng Quân Đội)">MB Bank (Ngân hàng Quân Đội)</option>
                  <option value="Vietcombank (Ngoại thương Việt Nam)">Vietcombank (Ngoại thương Việt Nam)</option>
                  <option value="Techcombank (Kỹ thương Việt Nam)">Techcombank (Kỹ thương Việt Nam)</option>
                  <option value="BIDV (Đầu tư và Phát triển)">BIDV (Đầu tư và Phát triển)</option>
                  <option value="Vietinbank (Công thương Việt Nam)">Vietinbank (Công thương Việt Nam)</option>
                  <option value="ACB (Á Châu)">ACB (Á Châu)</option>
                  <option value="TPBank (Tiên Phong)">TPBank (Tiên Phong)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số tài khoản nhận tiền <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accNum}
                  onChange={(e) => setAccNum(e.target.value)}
                  placeholder="Nhập số tài khoản"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên chủ tài khoản (không dấu) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accHolder}
                  onChange={(e) => setAccHolder(e.target.value)}
                  placeholder="NGUYEN VAN AN"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs uppercase font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {bankErrorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {bankErrorMsg}
                </div>
              )}
              {bankSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{bankSuccessMsg}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lưu tài khoản ngân hàng </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

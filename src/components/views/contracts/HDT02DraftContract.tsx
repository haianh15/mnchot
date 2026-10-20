import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Contract, LeaseConditionDraft } from '../../../types';
import { ContractDocument } from './ContractDocument';
import {
  FileText, Plus, Search, CheckCircle2, AlertTriangle, AlertCircle,
  Building, User, Calendar, DollarSign, CreditCard, ShieldCheck,
  Eye, ArrowRight, Printer, Sparkles, BookOpen
} from 'lucide-react';

interface HDT02Props {
  initialCondition?: LeaseConditionDraft | null;
  onNavigateToTab?: (tab: 'conditions' | 'draft' | 'negotiate' | 'sign' | 'schedules' | 'renewal' | 'activate') => void;
  onContractCreated?: (contractId: string) => void;
}

export const HDT02DraftContract: React.FC<HDT02Props> = ({
  initialCondition,
  onNavigateToTab,
  onContractCreated
}) => {
  const {
    contracts,
    leaseConditions,
    batchSchedules,
    rooms,
    tenants,
    createContractDraftHDT02,
    currentUser
  } = useApp();

  const [selectedConditionId, setSelectedConditionId] = useState<string>(initialCondition?.id || '');
  const [selectedRoomCode, setSelectedRoomCode] = useState<string>(initialCondition?.roomCode || rooms[0]?.roomCode || 'P.103');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(initialCondition?.tenantId || tenants[0]?.id || '');
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>(initialCondition?.batchCode || batchSchedules[0]?.batchCode || 'DOT-2026-K10');
  const [startDate, setStartDate] = useState<string>(initialCondition?.startDate || batchSchedules[0]?.startDate || '2026-10-01');
  const [endDate, setEndDate] = useState<string>(initialCondition?.endDate || batchSchedules[0]?.endDate || '2027-04-01');
  const [monthlyRent, setMonthlyRent] = useState<number>(initialCondition?.monthlyRent || 3500000);
  const [terms, setTerms] = useState<string>(
    initialCondition?.termsNote || ''
  );

  const [lessorName, setLessorName] = useState('');
  const [lessorIdNumber, setLessorIdNumber] = useState('');
  const [lessorAddress, setLessorAddress] = useState('');
  const [lessorPhone, setLessorPhone] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [createdContractSuccess, setCreatedContractSuccess] = useState<string | null>(null);

  // Sync if initialCondition changes
  useEffect(() => {
    if (initialCondition) {
      setSelectedConditionId(initialCondition.id);
      setSelectedRoomCode(initialCondition.roomCode);
      if (initialCondition.tenantId) {
        setSelectedTenantId(initialCondition.tenantId);
      }
      setSelectedBatchCode(initialCondition.batchCode);
      setStartDate(initialCondition.startDate);
      setEndDate(initialCondition.endDate);
      setMonthlyRent(initialCondition.monthlyRent);
      setTerms(initialCondition.termsNote || '');
    }
  }, [initialCondition]);

  const handleSelectCondition = (condId: string) => {
    setSelectedConditionId(condId);
    const cond = leaseConditions.find(c => c.id === condId);
    if (cond) {
      setSelectedRoomCode(cond.roomCode);
      if (cond.tenantId) setSelectedTenantId(cond.tenantId);
      setSelectedBatchCode(cond.batchCode);
      setStartDate(cond.startDate);
      setEndDate(cond.endDate);
      setMonthlyRent(cond.monthlyRent);
      setTerms(cond.termsNote || '');
    }
  };

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);
  const selectedRoom = rooms.find(r => r.roomCode === selectedRoomCode);
  const selectedBatch = batchSchedules.find(b => b.batchCode === selectedBatchCode);

  // Dựng cùng một mẫu văn bản cho cả xem trước và chi tiết hợp đồng đã lưu.
  // Không tạo mã hợp đồng hoặc chữ ký giả khi chưa lưu và chưa ký.
  const previewContract: Contract = {
    id: 'DỰ THẢO (chưa lưu)',
    contractType: 'Hợp đồng lần đầu',
    leaseId: '',
    roomCode: selectedRoomCode,
    tenantId: selectedTenant?.id || '',
    tenantName: selectedTenant?.fullName || '',
    tenantPhone: selectedTenant?.phoneNumber,
    tenantIdNumber: selectedTenant?.idNumber,
    lessorName: lessorName.trim() || undefined,
    lessorIdNumber: lessorIdNumber.trim() || undefined,
    lessorAddress: lessorAddress.trim() || undefined,
    lessorPhone: lessorPhone.trim() || undefined,
    propertyAddress: propertyAddress.trim() || undefined,
    batchCode: selectedBatchCode,
    startDate,
    endDate,
    monthlyRent,
    depositAmount: monthlyRent,
    firstMonthRentAmount: monthlyRent,
    firstMonthRentPaid: false,
    paymentMethod: 'Chuyển khoản',
    terms: terms.trim(),
    status: 'Nháp',
    isSignedPaper: false,
    version: 1
  };

  // Check preliminary warning ( 3.6 /  ghi nhận ký)
  const isPreliminaryTenant = selectedTenant?.isPreliminary || selectedTenant?.verificationStatus === 'Chưa xác minh';

  // Available agreed conditions
  const agreedConditions = leaseConditions.filter(c => c.status === 'Đã thống nhất');

  // Handle Create Draft
  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTenant) {
      alert('Vui lòng chọn khách thuê có hồ sơ (HSKT-01)!');
      return;
    }
    if (!selectedBatch) {
      alert('Vui lòng chọn đợt hợp đồng chung!');
      return;
    }

    const matchedCond = leaseConditions.find(c => c.id === selectedConditionId);

    const leaseId = 'THUE-' + selectedRoomCode.replace(/\D/g, '') + '-L' + Math.floor(Math.random() * 9 + 1);

    const res = createContractDraftHDT02({
      contractType: 'Hợp đồng lần đầu',
      requestCode: matchedCond?.requestCode,
      leaseId,
      roomCode: selectedRoomCode,
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.fullName,
      tenantPhone: selectedTenant.phoneNumber,
      tenantIdNumber: selectedTenant.idNumber,
      batchCode: selectedBatch.batchCode,
      startDate,
      endDate,
      monthlyRent,
      depositAmount: monthlyRent, // Cọc = 1 tháng
      firstMonthRentAmount: monthlyRent, // 1 tháng thuê đầu
      firstMonthRentPaid: false,
      paymentMethod: 'Chuyển khoản', terms: terms.trim(),
      lessorName: lessorName.trim() || undefined,
      lessorIdNumber: lessorIdNumber.trim() || undefined,
      lessorAddress: lessorAddress.trim() || undefined,
      lessorPhone: lessorPhone.trim() || undefined,
      propertyAddress: propertyAddress.trim() || undefined,
    });

    if (res.success && res.contractId) {
      setCreatedContractSuccess(res.contractId);
      if (onContractCreated) {
        onContractCreated(res.contractId);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-blue-700 text-white px-2 py-0.5 rounded">
              
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Lập dự thảo hợp đồng thuê phòng </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Khởi tạo bản hợp đồng Nháp (Dự thảo) chuẩn Lưu ý: Tiền cọc = 1 tháng thuê, tiền thuê tháng đầu = 1 tháng thuê, phương thức chuyển khoản chỉ đọc, chuẩn hóa theo lịch đợt chung đã xác nhận. </p>
        </div>

        {createdContractSuccess && (
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-300 text-xs font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã tạo: {createdContractSuccess}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Form Left, Preview/Rules Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Thông tin dự thảo hợp đồng </h3>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
              Trạng thái khởi tạo: Nháp </span>
          </div>

          {/* Quick source selector from agreed conditions */}
          {agreedConditions.length > 0 && (
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1.5">
              <label className="block text-[11px] font-bold text-emerald-900">
                CHỌN TỪ YÊU CẦU TIẾP NHẬN ĐÃ THỐNG NHẤT: </label>
              <select
                value={selectedConditionId}
                onChange={(e) => handleSelectCondition(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs font-medium bg-white"
              >
                <option value="">-- Điền thủ công hoặc chọn từ danh sách đã thống nhất --</option>
                {agreedConditions.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.requestCode} - {c.prospectiveTenantName} (Phòng {c.roomCode} - {c.monthlyRent.toLocaleString('vi-VN')} đ/tháng) </option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={handleCreateDraft} className="space-y-4 text-xs">
            {/* Room & Tenant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phòng thuê <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedRoomCode}
                  onChange={(e) => setSelectedRoomCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.roomCode}>
                      {r.roomCode} - Trạng thái: {r.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Khách thuê đại diện hợp đồng <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.id}) {t.isPreliminary ? '[Sơ bộ]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Warning if preliminary tenant */}
            {isPreliminaryTenant && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Cảnh báo hồ sơ sơ bộ:</strong>
                  Khách thuê chưa đối chiếu giấy tờ tùy thân CCCD/Hộ chiếu gốc. Hệ thống cho phép lập dự thảo hợp đồng, nhưng <strong>BẮT BUỘC</strong> phải đối chiếu giấy tờ gốc trước khi hoàn tất lưu hợp đồng ký tại bước ghi nhận ký hợp đồng. </div>
              </div>
            )}

            {/* Batch Schedule */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Đợt hợp đồng chung <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBatchCode}
                onChange={(e) => {
                  setSelectedBatchCode(e.target.value);
                  const b = batchSchedules.find(item => item.batchCode === e.target.value);
                  if (b) {
                    setStartDate(b.startDate);
                    setEndDate(b.endDate);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-medium"
              >
                {batchSchedules.map(b => (
                  <option key={b.batchCode} value={b.batchCode}>
                    {b.batchCode} ({b.startDate} → {b.endDate}) {b.isConfirmed ? '✓ Đã xác nhận' : '⚠ Chưa xác nhận'}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates synced with batch */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px]">Ngày bắt đầu:</span>
                <span className="font-mono font-bold text-slate-800">{startDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ngày kết thúc:</span>
                <span className="font-mono font-bold text-slate-800">{endDate}</span>
              </div>
            </div>

            {/* Financial rules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đơn giá thuê hàng tháng (đ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="50000"
                  min="500000"
                  required
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tiền cọc (Bằng 1 tháng thuê) </label>
                <input
                  type="text"
                  readOnly
                  value={`${monthlyRent.toLocaleString('vi-VN')} đ`}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg font-mono font-bold text-emerald-800"
                />
              </div>
            </div>

            {/* First Month Rent & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tiền thuê tháng đầu </label>
                <div className="px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg font-mono font-bold text-blue-800 flex justify-between items-center">
                  <span>{monthlyRent.toLocaleString('vi-VN')} đ</span>
                  <span className="text-[10px] text-amber-700 font-sans font-semibold bg-amber-100 px-1.5 py-0.2 rounded">
                    Chưa thanh toán </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phương thức thanh toán </label>
                <input
                  type="text"
                  readOnly
                  value="Chuyển khoản (Không thu tiền mặt)"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-600 font-medium"
                />
              </div>
            </div>

            {/* Bên cho thuê: thông tin riêng trên hợp đồng, không suy từ tài khoản nhận tiền. */}
            <fieldset className="rounded-lg border border-slate-200 p-3 space-y-3">
              <legend className="font-bold text-slate-800 px-1">Thông tin Bên cho thuê và địa chỉ phòng</legend>
              <p className="text-slate-500">Nhập từ hồ sơ pháp lý của bên cho thuê. Để trống nếu chưa có căn cứ; không sử dụng tên chủ tài khoản ngân hàng thay thế.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1"><span className="block font-medium">Họ tên Bên cho thuê</span><input value={lessorName} onChange={e=>setLessorName(e.target.value)} placeholder="Họ và tên theo giấy tờ" className="w-full rounded-lg border border-slate-300 p-2" /></label>
                <label className="space-y-1"><span className="block font-medium">Số CCCD/Định danh Bên A</span><input value={lessorIdNumber} onChange={e=>setLessorIdNumber(e.target.value)} placeholder="Theo giấy tờ" className="w-full rounded-lg border border-slate-300 p-2" /></label>
                <label className="space-y-1"><span className="block font-medium">Địa chỉ Bên cho thuê</span><input value={lessorAddress} onChange={e=>setLessorAddress(e.target.value)} placeholder="Địa chỉ liên hệ" className="w-full rounded-lg border border-slate-300 p-2" /></label>
                <label className="space-y-1"><span className="block font-medium">Số điện thoại Bên cho thuê</span><input value={lessorPhone} onChange={e=>setLessorPhone(e.target.value)} placeholder="Số điện thoại liên hệ" className="w-full rounded-lg border border-slate-300 p-2" /></label>
              </div>
              <label className="space-y-1 block"><span className="block font-medium">Địa chỉ tòa nhà/phòng cho thuê</span><input value={propertyAddress} onChange={e=>setPropertyAddress(e.target.value)} placeholder="Số nhà, đường, phường, tỉnh/thành phố" className="w-full rounded-lg border border-slate-300 p-2" /></label>
            </fieldset>

            {/* Terms */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Điều khoản & Cam kết trong hợp đồng </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-slate-500" />
                Xem trước văn bản hợp đồng </button>

              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Xác nhận lập dự thảo (Nháp) </button>
            </div>
          </form>
        </div>

        {/* Sidebar: Business Rules & Success Flow */}
        <div className="lg:col-span-5 space-y-4">
          {/* Rules Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-700">
              <ShieldCheck className="w-4 h-4" />
              Hướng dẫn lập dự thảo hợp đồng </h4>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-800 text-[11px] block">Lịch đợt hợp đồng chung:</span>
                <p className="text-[11px] text-slate-500">
                  Thời hạn hợp đồng (ngày bắt đầu và kết thúc) phải tuân thủ chuẩn xác theo lịch đợt chung đã xác nhận, đảm bảo chu kỳ thu và chốt điện nước đồng bộ. </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 space-y-1">
                <span className="font-bold text-emerald-900 text-[11px] block">Chính sách tiền cọc</span>
                <p className="text-[11px] text-emerald-800">
                  Hợp đồng thuê lần đầu bắt buộc thu tiền cọc bằng đúng 1 tháng tiền thuê. Khoản cọc này sẽ được bảo lưu và kết chuyển trọn vẹn ở các hợp đồng nối tiếp. </p>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900 text-[11px] block">Tiền thuê tháng đầu</span>
                <p className="text-[11px] text-blue-800">
                  Tiền thuê tháng đầu được lập bằng 1 tháng tiền thuê với trạng thái Chưa thanh toán, tự động chuyển thành khoản phải thu khi ký kết. </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-800 text-[11px] block">Phương thức thanh toán</span>
                <p className="text-[11px] text-slate-500">
                  Chỉ áp dụng Chuyển khoản ngân hàng qua tài khoản đã cấu hình, không thu tiền mặt. </p>
              </div>
            </div>
          </div>

          {/* If Contract Just Created */}
          {createdContractSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Hợp đồng nháp đã sẵn sàng!</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Mã dự thảo: <strong className="font-mono">{createdContractSuccess}</strong>. Bạn có thể chuyển sang bước gửi cho khách ký và theo dõi tiến độ (Gửi ký & theo dõi). </p>
              <button
                onClick={() => {
                  if (onNavigateToTab) onNavigateToTab('negotiate');
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                Chuyển sang Gửi & Theo dõi ký <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Xem trước cùng mẫu văn bản được dùng tại Chi tiết hợp đồng. */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[80] bg-slate-900/70 p-2 sm:p-5 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Bản dự thảo hợp đồng">
          <div className="max-w-[225mm] mx-auto">
            <div className="rounded-lg bg-white border border-slate-200 mb-3 p-3 flex items-center justify-between gap-2 text-sm">
              <h3 className="font-bold">Xem trước dự thảo hợp đồng (chưa lưu / chưa ký)</h3>
              <button type="button" onClick={() => setShowPreviewModal(false)} className="px-3 py-2 border rounded-lg font-medium">Đóng</button>
            </div>
            <ContractDocument contract={previewContract} tenant={selectedTenant} room={selectedRoom} />
          </div>
        </div>
      )}
    </div>
  );
};

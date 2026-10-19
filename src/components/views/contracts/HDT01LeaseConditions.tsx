import { toUserMessage } from '../../../utils/userMessages';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { LeaseConditionDraft } from '../../../types';
import {
  FileText, Plus, Search, CheckCircle2, AlertCircle, AlertTriangle,
  Clock, Eye, Edit3, ArrowRight, XCircle, ShieldCheck, History,
  Building, User, Calendar, CreditCard, RotateCcw, Check
} from 'lucide-react';

interface HDT01Props {
  onNavigateToTab?: (tab: 'conditions' | 'draft' | 'negotiate' | 'sign' | 'schedules' | 'renewal' | 'activate') => void;
  onSelectConditionForDraft?: (condition: LeaseConditionDraft) => void;
}

export const HDT01LeaseConditions: React.FC<HDT01Props> = ({
  onNavigateToTab,
  onSelectConditionForDraft
}) => {
  const {
    leaseConditions,
    receptionRequests,
    batchSchedules,
    rooms,
    tenants,
    contracts,
    saveLeaseConditionHDT01,
    checkLeaseConditionHDT01,
    updateLeaseConditionStatusHDT01,
    cancelLeaseConditionHDT01,
    currentUser
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<LeaseConditionDraft | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form State
  const [formRequestCode, setFormRequestCode] = useState('');
  const [formTenantId, setFormTenantId] = useState('');
  const [formProspectiveName, setFormProspectiveName] = useState('');
  const [formProspectivePhone, setFormProspectivePhone] = useState('');
  const [formProspectiveId, setFormProspectiveId] = useState('');
  const [formRoomCode, setFormRoomCode] = useState('');
  const [formBatchCode, setFormBatchCode] = useState(batchSchedules[0]?.batchCode || 'DOT-2026-K10');
  const [formStartDate, setFormStartDate] = useState(batchSchedules[0]?.startDate || '2026-10-01');
  const [formEndDate, setFormEndDate] = useState(batchSchedules[0]?.endDate || '2027-04-01');
  const [formMonthlyRent, setFormMonthlyRent] = useState(3500000);
  const [formBillingCycle, setFormBillingCycle] = useState('Ngày 25-30 hàng tháng');
  const [formTermsNote, setFormTermsNote] = useState('Căn hộ mini ban công thoáng mát, thanh toán chuyển khoản định kỳ.');
  const [checkResultState, setCheckResultState] = useState<{
    isValid: boolean;
    roomAvailable: boolean;
    batchConfirmed: boolean;
    blockingErrors: string[];
    warnings: string[];
  } | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [existingId, setExistingId] = useState<string | undefined>();

  // Filtered list
  const filteredConditions = leaseConditions.filter(c => {
    const matchesSearch =
      c.requestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.prospectiveTenantName && c.prospectiveTenantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.roomCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreateModal = (fromRequestCode?: string) => {
    setIsEditingExisting(false);
    setExistingId(undefined);
    setCheckResultState(null);

    if (fromRequestCode) {
      const req = receptionRequests.find(r => r.requestCode === fromRequestCode);
      if (req) {
        setFormRequestCode(req.requestCode);
        setFormProspectiveName(req.prospectiveTenantName);
        setFormProspectivePhone(req.prospectivePhone);
        setFormProspectiveId(req.prospectiveIdNumber || '');
        setFormRoomCode(req.roomCode || '');
        setFormTenantId(req.linkedTenantId || '');
      }
    } else {
      const newReqCode = 'YCTN-2026-' + (receptionRequests.length + 10).toString().padStart(3, '0');
      setFormRequestCode(newReqCode);
      setFormProspectiveName('');
      setFormProspectivePhone('');
      setFormProspectiveId('');
      setFormRoomCode('');
      setFormTenantId('');
    }

    const defaultBatch = batchSchedules[0] || { batchCode: 'DOT-2026-K10', startDate: '2026-10-01', endDate: '2027-04-01' };
    setFormBatchCode(defaultBatch.batchCode);
    setFormStartDate(defaultBatch.startDate);
    setFormEndDate(defaultBatch.endDate);
    setFormMonthlyRent(3500000);
    setFormBillingCycle('Ngày 25-30 hàng tháng');
    setFormTermsNote('Hợp đồng thuê 6 tháng theo lịch đợt chung, thanh toán chuyển khoản.');
    setShowEditModal(true);
  };

  const handleOpenEditModal = (condition: LeaseConditionDraft) => {
    setIsEditingExisting(true);
    setExistingId(condition.id);
    setFormRequestCode(condition.requestCode);
    setFormTenantId(condition.tenantId || '');
    setFormProspectiveName(condition.prospectiveTenantName || '');
    setFormProspectivePhone(condition.prospectivePhone || '');
    setFormProspectiveId(condition.prospectiveIdNumber || '');
    setFormRoomCode(condition.roomCode);
    setFormBatchCode(condition.batchCode);
    setFormStartDate(condition.startDate);
    setFormEndDate(condition.endDate);
    setFormMonthlyRent(condition.monthlyRent);
    setFormBillingCycle(condition.billingCycle);
    setFormTermsNote(condition.termsNote);
    setCheckResultState(condition.checkResult || null);
    setShowEditModal(true);
  };

  const handleBatchChange = (batchCode: string) => {
    setFormBatchCode(batchCode);
    const batch = batchSchedules.find(b => b.batchCode === batchCode);
    if (batch) {
      setFormStartDate(batch.startDate);
      setFormEndDate(batch.endDate);
    }
  };

  const handleRunCheck = () => {
    const res = checkLeaseConditionHDT01({
      roomCode: formRoomCode,
      batchCode: formBatchCode,
      startDate: formStartDate,
      endDate: formEndDate,
      monthlyRent: formMonthlyRent,
      depositAmount: formMonthlyRent,
      tenantId: formTenantId || undefined
    });
    setCheckResultState(res);
  };

  const handleSaveCondition = (e: React.FormEvent) => {
    e.preventDefault();

    // Run check first if not done
    const checkRes = checkLeaseConditionHDT01({
      roomCode: formRoomCode,
      batchCode: formBatchCode,
      startDate: formStartDate,
      endDate: formEndDate,
      monthlyRent: formMonthlyRent,
      depositAmount: formMonthlyRent,
      tenantId: formTenantId || undefined
    });

    if (!checkRes.isValid) {
      setCheckResultState(checkRes);
      alert(`Không thể lưu điều kiện do có lỗi chặn ký:\n- ${checkRes.blockingErrors.join('\n- ')}`);
      return;
    }

    const res = saveLeaseConditionHDT01({
      id: existingId,
      requestCode: formRequestCode,
      tenantId: formTenantId || undefined,
      prospectiveTenantName: formProspectiveName || 'Khách chưa gắn hồ sơ',
      prospectivePhone: formProspectivePhone,
      prospectiveIdNumber: formProspectiveId,
      roomCode: formRoomCode,
      batchCode: formBatchCode,
      startDate: formStartDate,
      endDate: formEndDate,
      monthlyRent: formMonthlyRent,
      depositAmount: formMonthlyRent, billingCycle: '1 tháng/lần',
      paymentMethod: 'Chuyển khoản',
      termsNote: formTermsNote,
      tenantAgreed44a1: true, // Điều kiện đã được thống nhất ngoài hệ thống
      status: 'Đã thống nhất'
    });

    if (res.success) {
      setShowEditModal(false);
      alert(toUserMessage(res.message));
    }
  };

  const handleCancelCondition = () => {
    if (!selectedCondition || !cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy yêu cầu thuê');
      return;
    }
    const res = cancelLeaseConditionHDT01(selectedCondition.requestCode, cancelReason);
    if (res.success) {
      setShowCancelModal(false);
      setCancelReason('');
      alert(toUserMessage(res.message));
    }
  };

  return (
    <div className="space-y-5">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">

            <h2 className="text-sm font-bold text-slate-900">
              Điều kiện thuê đã thống nhất </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Ghi nhận điều kiện thuê đã thống nhất trực tiếp với khách ở ngoài hệ thống. Kiểm tra phòng, thời hạn, đơn giá và cọc trước khi lập dự thảo hợp đồng. </p>
        </div>

        <button
          onClick={() => handleOpenCreateModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          Ghi nhận điều kiện thuê </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã YCTN, phòng, tên khách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto text-xs">
          <span className="text-slate-500 whitespace-nowrap font-medium text-[11px]">Trạng thái:</span>
          {['all', 'Đã thống nhất', 'Đã tạo hợp đồng', 'Đã hủy'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap cursor-pointer text-[11px] font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-blue-600 text-white font-bold': 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'Tất cả': st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Lease Condition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConditions.map((cond) => {
          const room = rooms.find(r => r.roomCode === cond.roomCode);
          const hasLinkedTenant = cond.tenantId && tenants.some(t => t.id === cond.tenantId);

          return (
            <div
              key={cond.id}
              className={`bg-white rounded-xl border transition-shadow shadow-xs hover:shadow-md p-4 flex flex-col justify-between space-y-3 ${
                cond.status === 'Đã thống nhất'
                  ? 'border-emerald-300 bg-emerald-50/20': cond.status === 'Đã tạo hợp đồng'
                  ? 'border-blue-300 bg-blue-50/20': cond.status === 'Đã hủy'
                  ? 'border-slate-300 opacity-70 bg-slate-50': 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {cond.requestCode}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-semibold">
                      v{cond.version}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cond.prospectiveTenantName || 'Khách chưa đặt tên'}</span>
                    {hasLinkedTenant && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                        HSKT: {cond.tenantId}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                    cond.status === 'Đã thống nhất'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300': cond.status === 'Đã tạo hợp đồng'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300': cond.status === 'Đang trao đổi'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300': 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {cond.status === 'Đang trao đổi' ? 'Chưa hoàn tất hồ sơ' : cond.status}
                </span>
              </div>

              {/* Card Body Details */}
              <div className="space-y-2 text-xs text-slate-600">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Phòng dự kiến:</span>
                    <strong className="text-slate-800 font-mono text-sm">{cond.roomCode}</strong>
                    <span className="text-[10px] text-slate-500 block">({room?.status || 'N/A'})</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Đợt chung:</span>
                    <strong className="text-indigo-700 font-mono text-xs">{cond.batchCode}</strong>
                    <span className="text-[10px] text-slate-500 block">{cond.startDate} → {cond.endDate}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Đơn giá thuê:</span>
                    <strong className="text-slate-900 font-mono text-xs">
                      {cond.monthlyRent.toLocaleString('vi-VN')} đ/tháng </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Tiền cọc (1 tháng):</span>
                    <strong className="text-emerald-700 font-mono text-xs">
                      {cond.depositAmount.toLocaleString('vi-VN')} đ </strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-1.5 flex justify-between items-center">
                  <span>Kỳ thu: <strong className="text-slate-700">{cond.billingCycle}</strong></span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium">
                    {cond.paymentMethod}
                  </span>
                </div>

                {cond.termsNote && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 bg-amber-50/50 p-1.5 rounded border border-amber-100">
                    <span className="font-semibold text-amber-800">Ghi chú:</span> {cond.termsNote}
                  </p>
                )}

                {/* Check status indicator */}
                {cond.checkResult && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {cond.checkResult.isValid ? (
                      <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã kiểm tra hợp lệ </span>
                    ): (
                      <span className="text-red-700 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Có {cond.checkResult.blockingErrors.length} lỗi chặn ký </span>
                    )}
                    {cond.checkResult.warnings?.length > 0 && (
                      <span className="text-amber-700 text-[10px]">
                        ({cond.checkResult.warnings.length} cảnh báo) </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Actions Footer */}
              <div className="border-t border-slate-100 pt-2.5 flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedCondition(cond);
                      setShowHistoryModal(true);
                    }}
                    title="Xem lịch sử điều chỉnh điều kiện"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md cursor-pointer text-xs flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Lịch sử ({cond.history?.length || 1})</span>
                  </button>

                  {cond.status !== 'Đã hủy' && cond.status !== 'Đã tạo hợp đồng' && (
                    <button
                      onClick={() => handleOpenEditModal(cond)}
                      title="Sửa điều kiện"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer text-xs flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Sửa</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {cond.status === 'Đã thống nhất' && (
                    <>
                      <button
                        onClick={() => {
                          if (onSelectConditionForDraft) {
                            onSelectConditionForDraft(cond);
                          }
                          if (onNavigateToTab) {
                            onNavigateToTab('draft');
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        Lập HD <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {cond.status !== 'Đã hủy' && cond.status !== 'Đã tạo hợp đồng' && (
                    <button
                      onClick={() => {
                        setSelectedCondition(cond);
                        setShowCancelModal(true);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md cursor-pointer"
                      title="Hủy yêu cầu tiếp nhận"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredConditions.length === 0 && (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
          <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-semibold">Chưa có bộ điều kiện thuê nào phù hợp với bộ lọc.</p>
          <button
            onClick={() => handleOpenCreateModal()}
            className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Ghi nhận điều kiện đã thống nhất </button>
        </div>
      )}

      {/* ==================== MODAL: EDIT / CREATE CONDITION ==================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {isEditingExisting ? `Điều chỉnh điều kiện thuê (${formRequestCode})`: 'Thiết lập điều kiện thuê ban đầu'}
                </h3>
                <p className="text-slate-500 text-xs">
                  Chức năng a. Phương thức Chuyển khoản chỉ đọc, cọc chuẩn 1 tháng. </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕ </button>
            </div>

            <form onSubmit={handleSaveCondition} className="space-y-3.5">
              {/* Request code & Prospective tenant info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 text-[11px]">MÃ YÊU CẦU TIẾP NHẬN BẤT BIẾN:</span>
                  <span className="font-mono font-bold text-blue-700">{formRequestCode}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Họ tên khách thuê <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formProspectiveName}
                      onChange={(e) => setFormProspectiveName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formProspectivePhone}
                      onChange={(e) => setFormProspectivePhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Số CCCD/Định danh (nếu có) </label>
                    <input
                      type="text"
                      value={formProspectiveId}
                      onChange={(e) => setFormProspectiveId(e.target.value)}
                      placeholder="001099001234"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Liên kết hồ sơ khách </label>
                    <select
                      value={formTenantId}
                      onChange={(e) => {
                        setFormTenantId(e.target.value);
                        const t = tenants.find(item => item.id === e.target.value);
                        if (t) {
                          setFormProspectiveName(t.fullName);
                          setFormProspectivePhone(t.phoneNumber);
                          if (t.idNumber) setFormProspectiveId(t.idNumber);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">-- Chưa liên kết (Khách mới) --</option>
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.id}) - {t.phoneNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Room & Batch Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Phòng dự kiến thuê <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formRoomCode}
                    onChange={(e) => setFormRoomCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-xs"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.roomCode}>
                        {r.roomCode} ({r.status}) </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Đợt hợp đồng chung <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formBatchCode}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                  >
                    {batchSchedules.map(b => (
                      <option key={b.batchCode} value={b.batchCode}>
                        {b.batchCode} ({b.startDate} → {b.endDate}) </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 text-[11px]">
                    Ngày bắt đầu (Chuẩn theo đợt) </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 text-[11px]">
                    Ngày kết thúc (Chuẩn theo đợt) </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              {/* Pricing & Deposit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Giá thuê đề xuất (đ/tháng) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="100000"
                    required
                    value={formMonthlyRent}
                    onChange={(e) => setFormMonthlyRent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tiền cọc dự kiến (Cố định = 1 tháng) </label>
                  <input
                    type="text"
                    readOnly
                    value={`${formMonthlyRent.toLocaleString('vi-VN')} đ`}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-100 rounded-lg font-mono font-bold text-emerald-800 text-xs"
                  />
                </div>
              </div>

              {/* Billing Cycle & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Kỳ thu tiền phòng & dịch vụ </label>
                  <input
                    type="text"
                    value={formBillingCycle}
                    onChange={(e) => setFormBillingCycle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Phương thức thanh toán (Chỉ đọc) </label>
                  <input
                    type="text"
                    readOnly
                    value="Chuyển khoản (Không thu tiền mặt)"
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-100 rounded-lg text-slate-600 font-medium text-xs"
                  />
                </div>
              </div>

              {/* Terms Note */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Điều khoản thuê đã thống nhất </label>
                <textarea
                  rows={2}
                  value={formTermsNote}
                  onChange={(e) => setFormTermsNote(e.target.value)}
                  placeholder="Ghi nhận các thỏa thuận bổ sung với khách..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Run Check Button & Results Display */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700 text-xs">
                     Kiểm tra ràng buộc điều kiện (Lịch đợt, phòng, tiền cọc) </span>
                  <button
                    type="button"
                    onClick={handleRunCheck}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Chạy kiểm tra ngay </button>
                </div>

                {checkResultState && (
                  <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    checkResultState.isValid
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900': 'bg-red-50/70 border-red-300 text-red-900'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      {checkResultState.isValid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Hợp lệ: Sẵn sàng lưu bộ điều kiện thuê</span>
                        </>
                      ): (
                        <>
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span>Phát hiện lỗi chặn ký ({checkResultState.blockingErrors.length})</span>
                        </>
                      )}
                    </div>

                    {checkResultState.blockingErrors.length > 0 && (
                      <ul className="list-disc pl-4 space-y-0.5 text-red-700 text-[11px]">
                        {checkResultState.blockingErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}

                    {checkResultState.warnings.length > 0 && (
                      <div className="pt-1 border-t border-emerald-200 text-amber-800 text-[11px]">
                        <span className="font-semibold">Cảnh báo:</span>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {checkResultState.warnings.map((warn, i) => (
                            <li key={i}>{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Đóng </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Lưu bộ điều kiện (a) </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: AUDIT HISTORY ==================== */}
      {showHistoryModal && selectedCondition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Nhật ký điều chỉnh điều kiện thuê </h3>
                <p className="text-slate-500 text-xs">
                  Mã yêu cầu: <strong className="font-mono text-blue-700">{selectedCondition.requestCode}</strong> | Phòng: {selectedCondition.roomCode}
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕ </button>
            </div>

            <div className="space-y-3">
              {(selectedCondition.history || []).map((h, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                      Phiên bản v{h.version}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(h.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="text-slate-800 font-medium text-xs pt-1">
                    {h.changes}
                  </div>
                  {h.note && (
                    <div className="text-[11px] text-slate-500 italic">
                      Ghi chú: {h.note}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 pt-0.5">
                    Người thực hiện: <span className="text-slate-600 font-semibold">{h.by}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CANCEL CONDITION ==================== */}
      {showCancelModal && selectedCondition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Hủy yêu cầu tiếp nhận & điều kiện thuê</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Bạn đang thực hiện hủy bỏ bộ điều kiện thuê cho yêu cầu <strong className="font-mono">{selectedCondition.requestCode}</strong> (Phòng {selectedCondition.roomCode}). Nếu hủy hồ sơ, điều kiện này sẽ không được dùng để lập dự thảo hợp đồng. </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do hủy yêu cầu <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Khách đổi kế hoạch công tác, không thống nhất được đơn giá..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Đóng </button>
              <button
                type="button"
                onClick={handleCancelCondition}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold cursor-pointer"
              >
                Xác nhận hủy </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

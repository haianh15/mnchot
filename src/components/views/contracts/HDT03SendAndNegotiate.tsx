import { toUserMessage } from '../../../utils/userMessages';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Contract } from '../../../types';
import {
  FileText, Send, Edit, XCircle, CheckCircle2, Clock, Eye,
  AlertTriangle, AlertCircle, Search, History, ArrowRight, Printer, Share2,
  Calendar, Building, User, DollarSign
} from 'lucide-react';

interface HDT03Props {
  onNavigateToTab?: (tab: 'conditions' | 'draft' | 'negotiate' | 'sign' | 'schedules' | 'renewal' | 'activate') => void;
  onSelectContractForSign?: (contract: Contract) => void;
}

export const HDT03SendAndNegotiate: React.FC<HDT03Props> = ({
  onNavigateToTab,
  onSelectContractForSign
}) => {
  const {
    contracts,
    sendContractToTenantHDT03,
    updateContractDraftHDT03,
    cancelContractDraftHDT03,
    batchSchedules
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMonthlyRent, setEditMonthlyRent] = useState(0);
  const [editTerms, setEditTerms] = useState('');
  const [editChangeNote, setEditChangeNote] = useState('');

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Contracts in Draft or Awaiting Sign
  const candidateContracts = contracts.filter(c =>
    (c.status === 'Nháp' || c.status === 'Chờ khách ký') &&
    (c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     c.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
     c.tenantName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSendToTenant = (contractId: string) => {
    const res = sendContractToTenantHDT03(contractId);
    if (res.success) {
      alert(toUserMessage(res.message));
    }
  };

  const handleOpenEdit = (c: Contract) => {
    setSelectedContract(c);
    setEditMonthlyRent(c.monthlyRent);
    setEditTerms(c.terms);
    setEditChangeNote('');
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    if (!editChangeNote.trim()) {
      alert('Vui lòng nhập lý do điều chỉnh dự thảo.');
      return;
    }

    const res = updateContractDraftHDT03(
      selectedContract.id,
      {
        monthlyRent: editMonthlyRent,
        depositAmount: editMonthlyRent, // terms: editTerms
      },
      editChangeNote
    );

    if (res.success) {
      setShowEditModal(false);
      alert(toUserMessage(res.message));
    }
  };

  const handleOpenCancel = (c: Contract) => {
    setSelectedContract(c);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (!selectedContract || !cancelReason.trim()) {
      alert('Vui lòng nhập lý do khách từ chối ký hoặc hủy hợp đồng!');
      return;
    }

    const res = cancelContractDraftHDT03(selectedContract.id, cancelReason);
    if (res.success) {
      setShowCancelModal(false);
      alert(toUserMessage(res.message));
    }
  };

  return (
    <div className="space-y-5">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-blue-700 text-white px-2 py-0.5 rounded">
              
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Điều chỉnh dự thảo hợp đồng </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Chọn dự thảo chưa ký để điều chỉnh theo nội dung đã thống nhất với khách ngoài hệ thống. Sau khi kiểm tra, ghi nhận bản hợp đồng đã ký trên giấy. </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs font-semibold text-slate-700">
            Đang theo dõi ký: <strong>{candidateContracts.length}</strong> hợp đồng </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã hợp đồng, phòng, tên khách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => {
            if (onNavigateToTab) onNavigateToTab('draft');
          }}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <FileText className="w-4 h-4" />
          Lập thêm dự thảo </button>
      </div>

      {/* Contracts Table / Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {candidateContracts.map((c) => (
          <div
            key={c.id}
            className={`p-4 rounded-xl border bg-white shadow-xs space-y-3.5 flex flex-col justify-between transition-shadow hover:shadow-md ${
              c.status === 'Chờ khách ký' ? 'border-amber-300 bg-amber-50/20': 'border-slate-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900">{c.id}</span>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    v{c.version}
                  </span>
                  <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {c.contractType}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  <span className="font-bold text-blue-700 font-mono text-xs">{c.roomCode}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-800">{c.tenantName}</span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                  c.status === 'Chờ khách ký'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300': 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                {c.status}
              </span>
            </div>

            {/* Content Details */}
            <div className="space-y-2 text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Thời hạn hợp đồng:</span>
                  <span className="font-mono font-semibold text-slate-800 text-[11px]">
                    {c.startDate} → {c.endDate}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Đợt: {c.batchCode}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Đơn giá thuê:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {c.monthlyRent.toLocaleString('vi-VN')} đ/tháng </span>
                  <span className="text-[10px] text-emerald-700 block">
                    Cọc: {c.depositAmount.toLocaleString('vi-VN')} đ </span>
                </div>
              </div>

              {c.sentToTenantDate && (
                <div className="text-[11px] text-amber-800 flex items-center gap-1.5 bg-amber-50 p-1.5 rounded border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Đã gửi khách vào ngày: <strong>{c.sentToTenantDate}</strong>. Chờ ghi nhận bản ký trên giấy.</span>
                </div>
              )}

              {c.terms && (
                <p className="text-[11px] text-slate-500 line-clamp-2 bg-slate-50 p-2 rounded">
                  <span className="font-semibold text-slate-700">Điều khoản:</span> {c.terms}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setSelectedContract(c);
                    setShowHistoryModal(true);
                  }}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md cursor-pointer text-[11px] flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Lịch sử ({c.history?.length || 1})</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer text-[11px] flex items-center gap-1 font-medium"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Sửa dự thảo</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {c.status === 'Nháp' && (
                  <button
                    onClick={() => handleSendToTenant(c.id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Gửi khách ký (4.9) </button>
                )}

                {c.status === 'Chờ khách ký' && (
                  <button
                    onClick={() => {
                      if (onSelectContractForSign) {
                        onSelectContractForSign(c);
                      }
                      if (onNavigateToTab) {
                        onNavigateToTab('sign');
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Khách đã ký (Lưu HD-04) <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleOpenCancel(c)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-md cursor-pointer"
                  title="Hủy dự thảo"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {candidateContracts.length === 0 && (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
          <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-semibold">Hiện không có hợp đồng nào đang ở trạng thái Nháp hoặc Chờ khách ký.</p>
          <button
            onClick={() => {
              if (onNavigateToTab) onNavigateToTab('draft');
            }}
            className="mt-3 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
          >
            Lập hợp đồng dự thảo mới </button>
        </div>
      )}

      {/* ==================== MODAL: EDIT DRAFT ==================== */}
      {showEditModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Điều chỉnh điều khoản dự thảo </h3>
                <p className="text-slate-500 text-xs">
                  Mã HĐ: <strong className="font-mono text-blue-700">{selectedContract.id}</strong> | Phiên bản hiện tại: v{selectedContract.version}
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕ </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đơn giá thuê hàng tháng (đ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="50000"
                  required
                  value={editMonthlyRent}
                  onChange={(e) => setEditMonthlyRent(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Tiền cọc sẽ tự động cập nhật bằng 1 tháng thuê: {editMonthlyRent.toLocaleString('vi-VN')} đ </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội dung điều khoản thỏa thuận bổ sung </label>
                <textarea
                  rows={3}
                  value={editTerms}
                  onChange={(e) => setEditTerms(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <label className="block font-bold text-amber-900 text-xs">
                  Lý do / Phản hồi điều chỉnh của khách thuê <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={editChangeNote}
                  onChange={(e) => setEditChangeNote(e.target.value)}
                  placeholder="Ví dụ: Khách đề nghị giảm giá thuê 200k do tự trang bị thêm đệm..."
                  className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Đóng </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Lưu & Nâng phiên bản (v{selectedContract.version + 1}) </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CANCEL DRAFT ==================== */}
      {showCancelModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Hủy dự thảo hợp đồng</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Bạn đang thực hiện hủy bỏ hợp đồng dự thảo <strong className="font-mono">{selectedContract.id}</strong> (Phòng {selectedContract.roomCode} - Khách {selectedContract.tenantName}). Phòng dự kiến sẽ được giải phóng ngay lập tức. </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do hủy dự thảo <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Khách tìm được chỗ ở khác, từ chối ký hợp đồng..."
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
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold cursor-pointer"
              >
                Xác nhận hủy dự thảo </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: HISTORY AUDIT ==================== */}
      {showHistoryModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Nhật ký vòng đời hợp đồng </h3>
                <p className="text-slate-500 text-xs">
                  Mã HĐ: <strong className="font-mono text-blue-700">{selectedContract.id}</strong> | Phòng: {selectedContract.roomCode}
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕ </button>
            </div>

            <div className="space-y-3">
              {(selectedContract.history || []).map((h, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                      {h.action} (v{h.version}) </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(h.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {h.note && (
                    <div className="text-xs text-slate-700 pt-1">
                      {h.note}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 pt-0.5">
                    Người ghi nhận: <span className="text-slate-600 font-semibold">{h.by}</span>
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
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { TenantChangeProposal, PreSignIdentityVerification } from '../../../types';
import {
  ShieldCheck, FileCheck, CheckCircle2, AlertCircle, HelpCircle,
  ArrowRight, Plus, RefreshCw, X, ShieldAlert, ArrowLeftRight, FileText
} from 'lucide-react';

interface HSKT03Props {
  onNavigateToTab: (tab: 'tenants' | 'co_tenants' | 'verify' | 'update' | 'history') => void;
  onSelectProposalForUpdate?: (proposalId: string) => void;
  initialTenantId?: string;
}

export const HSKT03VerifyChanges: React.FC<HSKT03Props> = ({ onNavigateToTab, onSelectProposalForUpdate, initialTenantId }) => {
  const {
    tenants,
    tenantProposals,
    preSignVerifications,
    createOrUpdateProposalHSKT03,
    verifyProposalResultHSKT03,
    transferProposalToUpdateHSKT03,
    recordPreSignVerificationHSKT03
  } = useApp();

  // Mode Selection: Mode A (Check change proposal) vs Mode B (Pre-signing ID check)
  const [activeMode, setActiveMode] = useState<'modeA' | 'modeB'>('modeA');

  // Mode A: Selected Proposal
  const [selectedProposalId, setSelectedProposalId] = useState<string>(tenantProposals[0]?.id || '');
  const selectedProposal = tenantProposals.find(p => p.id === selectedProposalId);
  const targetTenant = tenants.find(t => t.id === selectedProposal?.tenantId);

  // Mode A: New Proposal Form
  const [showNewProposalModal, setShowNewProposalModal] = useState(false);
  const [propTenantId, setPropTenantId] = useState<string>(initialTenantId || tenants[0]?.id || '');
  const [propAddress, setPropAddress] = useState('');
  const [propPhone, setPropPhone] = useState('');
  const [propIdNumber, setPropIdNumber] = useState('');
  const [propEvidence, setPropEvidence] = useState('');

  // Mode A: Verification Action State
  const [verifyStatus, setVerifyStatus] = useState<'Đạt' | 'Chưa đạt' | 'Chưa xác minh'>('Đạt');
  const [verifyReason, setVerifyReason] = useState('');
  const [distinctionBasis, setDistinctionBasis] = useState('');
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Mode B: Pre-signing State
  const [psvTenantId, setPsvTenantId] = useState<string>(tenants[0]?.id || '');
  const [psvDocType, setPsvDocType] = useState('CCCD gắn chip (Bản gốc)');
  const [psvDocNumber, setPsvDocNumber] = useState('');
  const [psvEvidence, setPsvEvidence] = useState('Đối chiếu trực tiếp tại văn phòng trước khi khách ký hợp đồng');
  const [psvSource, setPsvSource] = useState('Trực tiếp');
  const [psvResult, setPsvResult] = useState<'Đã xác minh hợp lệ' | 'Chưa xác minh' | 'Không hợp lệ'>('Đã xác minh hợp lệ');
  const [psvNotes, setPsvNotes] = useState('');

  // Mode A: Create New Proposal
  const handleCreateNewProposal = (e: React.FormEvent) => {
    e.preventDefault();
    const currentT = tenants.find(t => t.id === propTenantId);
    if (!currentT) return;

    const proposed: Record<string, string> = {};
    if (propAddress.trim() && propAddress.trim() !== currentT.address) proposed.address = propAddress.trim();
    if (propPhone.trim() && propPhone.trim() !== currentT.phoneNumber) proposed.phoneNumber = propPhone.trim();
    if (propIdNumber.trim() && propIdNumber.trim() !== currentT.idNumber) proposed.idNumber = propIdNumber.trim();

    if (Object.keys(proposed).length === 0) {
      alert('Không có thay đổi thực tế so với dữ liệu hiện tại!');
      return;
    }

    const res = createOrUpdateProposalHSKT03({
      tenantId: propTenantId,
      source: 'HSKT-03',
      currentData: {
        address: currentT.address,
        phoneNumber: currentT.phoneNumber,
        idNumber: currentT.idNumber
      },
      proposedData: proposed,
      evidenceNote: propEvidence.trim() || 'Người dùng đề xuất thay đổi tại HSKT-03',
      verificationResult: 'Chưa xác minh'
    });

    if (res.success) {
      setSelectedProposalId(res.proposalId);
      setShowNewProposalModal(false);
      setPropAddress('');
      setPropPhone('');
      setPropIdNumber('');
      setPropEvidence('');
      setActionMsg({ text: res.message, type: 'success' });
    }
  };

  // Mode A: Confirm Verify Result (Bước 4)
  const handleConfirmVerification = () => {
    if (!selectedProposal) return;
    setActionMsg(null);

    // Rule: Duplicate ID check in proposed data
    if (selectedProposal.proposedData.idNumber) {
      const conflict = tenants.find(t =>
        t.id !== selectedProposal.tenantId &&
        t.idNumber &&
        t.idNumber.toLowerCase() === selectedProposal.proposedData.idNumber?.toLowerCase()
      );
      if (conflict && verifyStatus === 'Đạt') {
        setActionMsg({
          text: `Số định danh đề xuất ${selectedProposal.proposedData.idNumber} trùng với hồ sơ của ${conflict.fullName} (${conflict.id}). Bắt buộc chọn Chưa đạt!`,
          type: 'error'
        });
        return;
      }
    }

    const res = verifyProposalResultHSKT03(
      selectedProposal.id,
      verifyStatus,
      verifyReason.trim() || undefined,
      distinctionBasis.trim() || undefined
    );

    if (res.success) {
      setActionMsg({ text: res.message, type: 'success' });
    } else {
      setActionMsg({ text: res.message, type: 'error' });
    }
  };

  // Mode A: Transfer to HSKT-04 (Bước 5)
  const handleTransferToUpdate = () => {
    if (!selectedProposal) return;
    setActionMsg(null);

    const res = transferProposalToUpdateHSKT03(selectedProposal.id);
    if (!res.success) {
      setActionMsg({ text: res.message, type: 'error' });
    } else {
      setActionMsg({ text: res.message, type: 'success' });
      onSelectProposalForUpdate?.(selectedProposal.id);
      setTimeout(() => {
        onNavigateToTab('update');
      }, 1000);
    }
  };

  // Mode B: Record Pre-Sign Check
  const handleRecordPreSignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(null);

    if (!psvDocNumber.trim()) {
      alert('Vui lòng nhập số giấy tờ để đối chiếu định danh trước ký!');
      return;
    }

    const res = recordPreSignVerificationHSKT03({
      tenantId: psvTenantId,
      docType: psvDocType,
      docNumber: psvDocNumber.trim(),
      evidence: psvEvidence.trim(),
      source: psvSource,
      result: psvResult,
      notes: psvNotes.trim() || undefined
    });

    if (res.success) {
      setActionMsg({ text: res.message, type: 'success' });
      setPsvDocNumber('');
      setPsvNotes('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              
              <h2 className="text-base font-bold text-purple-950">Kiểm tra thông tin thay đổi & Đối chiếu trước ký</h2>
            </div>
            <p className="text-xs text-purple-800 mt-1">
              Điểm kiểm soát 3.12: Chỉ tạo kết quả đối chiếu, không ghi đè hồ sơ. Tách biệt Chế độ A (Kiểm tra bộ dữ liệu thay đổi dùng chung) và Chế độ B (Đối chiếu định danh khách cũ trước ký - ). </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-white border border-purple-200 rounded-lg text-xs shrink-0">
            <button
              onClick={() => { setActiveMode('modeA'); setActionMsg(null); }}
              className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                activeMode === 'modeA' ? 'bg-purple-600 text-white shadow-xs': 'text-purple-900 hover:bg-purple-50'
              }`}
            >
              Chế độ A: Bộ đề nghị thay đổi </button>
            <button
              onClick={() => { setActiveMode('modeB'); setActionMsg(null); }}
              className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                activeMode === 'modeB' ? 'bg-purple-600 text-white shadow-xs': 'text-purple-900 hover:bg-purple-50'
              }`}
            >
              Chế độ B: Đối chiếu trước ký </button>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          actionMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800':
          actionMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-800':
          'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          {actionMsg.text}
        </div>
      )}

      {/* ==================== MODE A: KIỂM TRA BỘ DỮ LIỆU ĐỀ NGHỊ THAY ĐỔI ==================== */}
      {activeMode === 'modeA' && (
        <div className="space-y-6">
          {/* Top selection bar */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Chọn bộ dữ liệu:</label>
              <select
                value={selectedProposalId}
                onChange={(e) => {
                  setSelectedProposalId(e.target.value);
                  setActionMsg(null);
                }}
                className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-purple-700 min-w-56"
              >
                {tenantProposals.map(p => {
                  const t = tenants.find(item => item.id === p.tenantId);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.id} (v{p.version}) - {t?.fullName || p.tenantId} [{p.verificationResult}] </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewProposalModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo đề nghị tại đây </button>
            </div>
          </div>

          {selectedProposal ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Before / After Comparison */}
              <div className="lg:col-span-2 space-y-4">
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-purple-700">{selectedProposal.id}</span>
                        <span className="text-xs text-slate-500 font-semibold">(Phiên bản: v{selectedProposal.version})</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">Nguồn: {selectedProposal.source}</span>
                      </div>
                      <div className="text-xs text-slate-800 font-bold mt-1">
                        Khách thuê: {targetTenant?.fullName} ({selectedProposal.tenantId}) </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${
                        selectedProposal.verificationResult === 'Đạt' ? 'bg-emerald-100 text-emerald-800':
                        selectedProposal.verificationResult === 'Chưa đạt' ? 'bg-red-100 text-red-800':
                        'bg-amber-100 text-amber-800'
                      }`}>
                        Kết quả: {selectedProposal.verificationResult}
                      </span>
                      {selectedProposal.verifiedAt && (
                        <div className="text-[10px] text-slate-400 mt-0.5">Xác minh lúc: {new Date(selectedProposal.verifiedAt).toLocaleTimeString()}</div>
                      )}
                    </div>
                  </div>

                  {/* So sánh trước / sau (Dữ liệu hiện tại vs Dữ liệu đề nghị) */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                      Đối chiếu dữ liệu trước – sau </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Cột hiện tại */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Dữ liệu hiện tại trên hồ sơ</span>
                        <div className="space-y-1.5 text-slate-700">
                          <div><strong>Số điện thoại:</strong> {targetTenant?.phoneNumber || '—'}</div>
                          <div><strong>CCCD:</strong> {targetTenant?.idNumber || '—'}</div>
                          <div><strong>Địa chỉ:</strong> {targetTenant?.address || '—'}</div>
                        </div>
                      </div>

                      {/* Cột đề nghị thay đổi */}
                      <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg space-y-2">
                        <span className="font-bold text-purple-700 uppercase text-[10px] tracking-wider">Dữ liệu đề nghị thay đổi</span>
                        <div className="space-y-1.5 text-purple-950 font-medium">
                          {selectedProposal.proposedData.phoneNumber && (
                            <div><strong>Số điện thoại mới:</strong> <span className="bg-purple-100 px-1 py-0.2 rounded font-mono font-bold text-purple-900">{selectedProposal.proposedData.phoneNumber}</span></div>
                          )}
                          {selectedProposal.proposedData.idNumber && (
                            <div><strong>CCCD mới:</strong> <span className="bg-purple-100 px-1 py-0.2 rounded font-mono font-bold text-purple-900">{selectedProposal.proposedData.idNumber}</span></div>
                          )}
                          {selectedProposal.proposedData.address && (
                            <div><strong>Địa chỉ mới:</strong> <span className="bg-purple-100 px-1 py-0.2 rounded">{selectedProposal.proposedData.address}</span></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chứng cứ & Căn cứ đi kèm */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-slate-700">Chứng cứ & Tài liệu kèm theo:</span>
                    <p className="text-slate-600">{selectedProposal.evidenceNote || 'Chưa đính kèm mô tả chứng cứ.'}</p>
                    {selectedProposal.reason && (
                      <div className="text-amber-800 font-medium pt-1 border-t border-slate-200">
                        Lý do ghi nhận: {selectedProposal.reason}
                      </div>
                    )}
                    {selectedProposal.distinctionBasis && (
                      <div className="text-blue-800 font-medium pt-1">
                        Căn cứ phân biệt nghi trùng: {selectedProposal.distinctionBasis}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Col: Verification Controls (Bước 3, 4, 5) */}
              <div className="space-y-4">
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4 text-xs">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <h4 className="font-bold text-slate-800">Thực hiện kiểm tra & xác nhận </h4>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Xác nhận kết quả đối chiếu *</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Đạt', 'Chưa đạt', 'Chưa xác minh'] as const).map(res => (
                        <button
                          key={res}
                          type="button"
                          onClick={() => setVerifyStatus(res)}
                          className={`py-2 px-1 rounded-lg border text-center font-bold text-xs cursor-pointer transition-colors ${
                            verifyStatus === res
                              ? (res === 'Đạt' ? 'bg-emerald-600 text-white border-emerald-600':
                                 res === 'Chưa đạt' ? 'bg-red-600 text-white border-red-600':
                                 'bg-amber-600 text-white border-amber-600'): 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Lý do / Căn cứ chưa xác minh </label>
                    <input
                      type="text"
                      value={verifyReason}
                      onChange={(e) => setVerifyReason(e.target.value)}
                      placeholder="Ghi rõ lý do nếu Chưa đạt hoặc Chưa xác minh..."
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Căn cứ phân biệt nếu có nghi trùng </label>
                    <input
                      type="text"
                      value={distinctionBasis}
                      onChange={(e) => setDistinctionBasis(e.target.value)}
                      placeholder="Căn cứ xác định khác người..."
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmVerification}
                      className="w-full py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Xác nhận lưu kết quả </button>

                    <button
                      type="button"
                      disabled={selectedProposal.verificationResult !== 'Đạt' || !selectedProposal.isValid}
                      onClick={handleTransferToUpdate}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xs"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Chuyển sang cập nhật hồ sơ </button>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    Nếu hủy chuyển ở, kết quả kiểm tra đã lưu tại vẫn được bảo lưu, không bị xóa. </p>
                </div>
              </div>
            </div>
          ): (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
              Chưa có bộ dữ liệu đề nghị thay đổi nào. Bạn có thể nhấn nút "Tạo đề nghị tại đây" ở góc trên. </div>
          )}
        </div>
      )}

      {/* ==================== MODE B: ĐỐI CHIẾU ĐỊNH DANH TRƯỚC KÝ ==================== */}
      {activeMode === 'modeB' && (
        <div className="space-y-6">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Đối chiếu định danh khách cũ trước ký </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Áp dụng khi khách cũ không thay đổi dữ liệu cá nhân nhưng phải đối chiếu giấy tờ hợp lệ trước khi Khách ký tại ghi nhận ký. Không tạo bộ dữ liệu đề nghị thay đổi giả. </p>
            </div>

            <form onSubmit={handleRecordPreSignSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khách cũ chuẩn bị ký hợp đồng *</label>
                  <select
                    value={psvTenantId}
                    onChange={(e) => setPsvTenantId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName} ({t.id}) - CCCD: {t.idNumber || 'Chưa có'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loại giấy tờ đối chiếu *</label>
                  <input
                    type="text"
                    value={psvDocType}
                    onChange={(e) => setPsvDocType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    placeholder="CCCD gắn chip, Hộ chiếu..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số giấy tờ đối chiếu *</label>
                  <input
                    type="text"
                    value={psvDocNumber}
                    onChange={(e) => setPsvDocNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="Số CCCD..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nguồn tiếp nhận đối chiếu</label>
                  <input
                    type="text"
                    value={psvSource}
                    onChange={(e) => setPsvSource(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    placeholder="Trực tiếp tại văn phòng..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chứng cứ đối chiếu thực tế</label>
                <input
                  type="text"
                  value={psvEvidence}
                  onChange={(e) => setPsvEvidence(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="Bản gốc xuất trình trực tiếp, ảnh đối chiếu..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kết quả xác minh định danh trước ký *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Đã xác minh hợp lệ', 'Chưa xác minh', 'Không hợp lệ'] as const).map(res => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setPsvResult(res)}
                      className={`py-2 px-3 rounded-lg border font-bold text-xs cursor-pointer transition-colors ${
                        psvResult === res
                          ? (res === 'Đã xác minh hợp lệ' ? 'bg-emerald-600 text-white border-emerald-600':
                             res === 'Không hợp lệ' ? 'bg-red-600 text-white border-red-600':
                             'bg-amber-600 text-white border-amber-600'): 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Ghi chú đối chiếu trước ký</label>
                <textarea
                  rows={2}
                  value={psvNotes}
                  onChange={(e) => setPsvNotes(e.target.value)}
                  placeholder="Ghi chú mục đích ký hợp đồng ghi nhận ký..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Ghi nhận kết quả đối chiếu định danh </button>
              </div>
            </form>
          </div>

          {/* Table of Pre-signing checks */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Lịch sử kết quả đối chiếu định danh trước ký</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Mã đối chiếu</th>
                    <th className="py-2 px-3">Khách thuê</th>
                    <th className="py-2 px-3">Giấy tờ & Số</th>
                    <th className="py-2 px-3">Chứng cứ</th>
                    <th className="py-2 px-3">Kết quả</th>
                    <th className="py-2 px-3">Thời điểm & Người thực hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preSignVerifications.map(p => {
                    const t = tenants.find(item => item.id === p.tenantId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{p.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{t?.fullName || p.tenantId}</td>
                        <td className="py-2.5 px-3 text-slate-700">{p.docType} ({p.docNumber})</td>
                        <td className="py-2.5 px-3 text-slate-600">{p.evidence}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.result === 'Đã xác minh hợp lệ' ? 'bg-emerald-100 text-emerald-800':
                            p.result === 'Không hợp lệ' ? 'bg-red-100 text-red-800':
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {p.result}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500">
                          <div>{new Date(p.verifiedAt).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">Bởi: {p.verifiedBy}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tạo bộ đề nghị thay đổi mới tại HSKT-03 */}
      {showNewProposalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Khởi tạo bộ đề nghị thay đổi</h3>
              <button onClick={() => setShowNewProposalModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNewProposal} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Khách thuê cần đổi thông tin *</label>
                <select
                  value={propTenantId}
                  onChange={(e) => setPropTenantId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ mới đề xuất</label>
                <input
                  type="text"
                  value={propAddress}
                  onChange={(e) => setPropAddress(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="Để trống nếu không đổi..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại mới đề xuất</label>
                <input
                  type="text"
                  value={propPhone}
                  onChange={(e) => setPropPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  placeholder="Để trống nếu không đổi..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số CCCD mới đề xuất</label>
                <input
                  type="text"
                  value={propIdNumber}
                  onChange={(e) => setPropIdNumber(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  placeholder="Để trống nếu không đổi..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chứng cứ đính kèm *</label>
                <input
                  type="text"
                  value={propEvidence}
                  onChange={(e) => setPropEvidence(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="Ảnh CCCD mới, đơn đề nghị..."
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProposalModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                >
                  Hủy </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg"
                >
                  Tạo bộ đề nghị </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

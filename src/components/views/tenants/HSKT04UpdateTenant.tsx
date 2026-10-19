import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Tenant, TenantChangeProposal } from '../../../types';
import {
  Edit, CheckCircle2, AlertCircle, AlertTriangle, ArrowRight,
  ShieldCheck, RefreshCw, X, ArrowLeft, History, Users
} from 'lucide-react';

interface HSKT04Props {
  initialTenantId?: string;
  initialProposalId?: string;
  onNavigateToTab: (tab: 'tenants' | 'co_tenants' | 'verify' | 'update' | 'history') => void;
}

export const HSKT04UpdateTenant: React.FC<HSKT04Props> = ({
  initialTenantId,
  initialProposalId,
  onNavigateToTab
}) => {
  const {
    tenants,
    tenantProposals,
    applyTenantUpdateHSKT04,
    createOrUpdateProposalHSKT03
  } = useApp();

  // Selected Tenant
  const [selectedTenantId, setSelectedTenantId] = useState<string>(initialTenantId || tenants[0]?.id || '');
  const currentTenant = tenants.find(t => t.id === selectedTenantId);

  // Selected Proposal from HSKT-03 (shared dataset)
  const [selectedProposalId, setSelectedProposalId] = useState<string>(initialProposalId || '');

  // Form Fields (pre-filled or edited)
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Loaded Snapshot to detect user modifications after verification
  const [loadedVerifiedSnapshot, setLoadedVerifiedSnapshot] = useState<Partial<Tenant> | null>(null);
  const [isDataModifiedAfterCheck, setIsDataModifiedAfterCheck] = useState(false);

  // Status & feedback
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // When selected tenant changes, populate current values
  useEffect(() => {
    if (currentTenant) {
      setFullName(currentTenant.fullName);
      setPhoneNumber(currentTenant.phoneNumber);
      setIdNumber(currentTenant.idNumber || '');
      setAddress(currentTenant.address || '');
      setNotes(currentTenant.notes || '');
      setLoadedVerifiedSnapshot(null);
      setIsDataModifiedAfterCheck(false);
      setActionMsg(null);
    }
  }, [selectedTenantId]);

  // Load proposal if passed or chosen
  const handleLoadProposal = (propId: string) => {
    const prop = tenantProposals.find(p => p.id === propId);
    if (!prop) return;

    setSelectedProposalId(propId);
    setSelectedTenantId(prop.tenantId);

    const t = tenants.find(item => item.id === prop.tenantId);
    if (!t) return;

    // Auto-fill proposed data
    const proposedPhone = prop.proposedData.phoneNumber ?? t.phoneNumber;
    const proposedId = prop.proposedData.idNumber ?? (t.idNumber || '');
    const proposedAddr = prop.proposedData.address ?? (t.address || '');

    setFullName(t.fullName);
    setPhoneNumber(proposedPhone);
    setIdNumber(proposedId);
    setAddress(proposedAddr);
    setNotes(t.notes || '');

    // Record verified snapshot
    setLoadedVerifiedSnapshot({
      phoneNumber: proposedPhone,
      idNumber: proposedId,
      address: proposedAddr
    });
    setIsDataModifiedAfterCheck(false);

    if (prop.verificationResult !== 'Đạt' || !prop.isValid) {
      setActionMsg({
        text: `Bộ dữ liệu ${prop.id} có trạng thái [${prop.verificationResult}]. Cần có kết quả ĐẠT còn hiệu lực để lưu thay đổi.`,
        type: 'warning'
      });
    } else {
      setActionMsg({
        text: `Đã nạp chính xác bộ dữ liệu ĐẠT [${prop.id} v${prop.version}]. Bạn có thể nhấn "Lưu thay đổi".`,
        type: 'success'
      });
    }
  };

  // Check if fields were modified after loading verified proposal
  const handleFieldChange = (field: 'phoneNumber' | 'idNumber' | 'address', value: string) => {
    if (field === 'phoneNumber') setPhoneNumber(value);
    if (field === 'idNumber') setIdNumber(value);
    if (field === 'address') setAddress(value);

    if (loadedVerifiedSnapshot) {
      if (
        (field === 'phoneNumber' && value !== loadedVerifiedSnapshot.phoneNumber) ||
        (field === 'idNumber' && value !== loadedVerifiedSnapshot.idNumber) ||
        (field === 'address' && value !== loadedVerifiedSnapshot.address)
      ) {
        setIsDataModifiedAfterCheck(true);
        setActionMsg({
          text: 'Dữ liệu đã bị thay đổi so với kết quả kiểm tra Đạt của HSKT-03! Kết quả kiểm tra cũ bị vô hiệu hóa; bắt buộc xác minh lại tại HSKT-03.',
          type: 'warning'
        });
      }
    }
  };

  // Send modified data back to HSKT-03 for re-verification
  const handleSendToReverify = () => {
    if (!currentTenant) return;
    const updatedProps: Record<string, string> = {};
    if (phoneNumber !== currentTenant.phoneNumber) updatedProps.phoneNumber = phoneNumber;
    if (idNumber !== (currentTenant.idNumber || '')) updatedProps.idNumber = idNumber;
    if (address !== (currentTenant.address || '')) updatedProps.address = address;

    const res = createOrUpdateProposalHSKT03({
      id: selectedProposalId || undefined,
      tenantId: currentTenant.id,
      source: 'HSKT-04',
      currentData: {
        phoneNumber: currentTenant.phoneNumber,
        idNumber: currentTenant.idNumber,
        address: currentTenant.address
      },
      proposedData: updatedProps,
      evidenceNote: 'Chỉnh sửa lại trường dữ liệu tại màn hình HSKT-04 sau khi kiểm tra',
      verificationResult: 'Chưa xác minh'
    });

    if (res.success) {
      alert(`${res.message} Vui lòng sang tab HSKT-03 để hoàn tất đối chiếu kết quả mới.`);
      onNavigateToTab('verify');
    }
  };

  // Save changes (Bước 4 & 5)
  const handleSaveUpdate = () => {
    setActionMsg(null);
    if (!currentTenant) return;

    if (isDataModifiedAfterCheck) {
      setActionMsg({
        text: 'Không thể lưu! Dữ liệu đã thay đổi sau khi xác minh. Bắt buộc kiểm tra lại tại HSKT-03.',
        type: 'error'
      });
      return;
    }

    const updatedFields: Partial<Tenant> = {};
    if (phoneNumber !== currentTenant.phoneNumber) updatedFields.phoneNumber = phoneNumber;
    if (idNumber !== (currentTenant.idNumber || '')) updatedFields.idNumber = idNumber;
    if (address !== (currentTenant.address || '')) updatedFields.address = address;
    if (notes !== (currentTenant.notes || '')) updatedFields.notes = notes;

    const res = applyTenantUpdateHSKT04(currentTenant.id, updatedFields, selectedProposalId || undefined);

    if (!res.success) {
      setActionMsg({ text: res.message, type: 'error' });
    } else {
      setActionMsg({ text: res.message, type: 'success' });
      setLoadedVerifiedSnapshot(null);
      setIsDataModifiedAfterCheck(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Trace Header */}
      <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              
              <h2 className="text-base font-bold text-cyan-950">Cập nhật hồ sơ khách thuê</h2>
            </div>
            <p className="text-xs text-cyan-800 mt-1">
              Chỉ cập nhật trên hồ sơ khách chính đã tồn tại theo kết quả xác minh hợp lệ. Bao gồm trường hợp bổ sung thông tin khách cũ tại 3.10 sau khi kiểm soát 3.12 đạt. Không sửa người ở cùng tại đây. </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('verify')}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Kiểm tra thay đổi </button>
            <button
              onClick={() => onNavigateToTab('co_tenants')}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Nếu thay đổi liên quan người ở cùng"
            >
              <Users className="w-4 h-4" />
              Sửa người ở cùng </button>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          actionMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800':
          actionMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-800':
          'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          {actionMsg.text}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Tenant Picker & Proposal Selector */}
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800">1. Chọn khách thuê cần cập nhật</h3>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.id}) - v{t.version || 1}
                </option>
              ))}
            </select>

            {currentTenant && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-slate-700">
                <div><strong>Mã hồ sơ:</strong> <span className="font-mono text-blue-700">{currentTenant.id}</span></div>
                <div><strong>Phiên bản hiện hành:</strong> v{currentTenant.version || 1}</div>
                <div><strong>SĐT hiện tại:</strong> {currentTenant.phoneNumber}</div>
                <div><strong>CCCD hiện tại:</strong> {currentTenant.idNumber || 'Chưa cung cấp'}</div>
                <div><strong>Địa chỉ:</strong> {currentTenant.address || 'Chưa có'}</div>
                <div><strong>Tình trạng giấy tờ:</strong> {currentTenant.paperStatus} ({currentTenant.verificationStatus})</div>
              </div>
            )}
          </div>

          {/* Proposals from HSKT-03 */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">2. Bộ đề nghị thay đổi đã xác minh</h3>
              <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded">
                Dùng chung BDL </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Chọn bộ dữ liệu đã được xác nhận ĐẠT để nạp tự động vào biểu mẫu cập nhật. </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tenantProposals.filter(p => p.tenantId === selectedTenantId).map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleLoadProposal(p.id)}
                    className={`p-2.5 border rounded-lg text-xs cursor-pointer transition-all ${
                      selectedProposalId === p.id
                        ? 'bg-purple-50 border-purple-400 ring-1 ring-purple-400': 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-purple-800">
                      <span>{p.id} (v{p.version})</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                        p.verificationResult === 'Đạt' ? 'bg-emerald-100 text-emerald-800':
                        p.verificationResult === 'Chưa đạt' ? 'bg-red-100 text-red-800':
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {p.verificationResult}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 line-clamp-1">{p.evidenceNote}</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>Nguồn: {p.source}</span>
                      {p.verifiedAt && <span>{new Date(p.verifiedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
              {tenantProposals.filter(p => p.tenantId === selectedTenantId).length === 0 && (
                <div className="text-center py-4 text-slate-400 text-xs">
                  Chưa có bộ đề nghị thay đổi nào cho khách này. </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Update Form & Before/After Live Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-cyan-700" />
                <h3 className="font-bold text-slate-800">Biểu mẫu cập nhật hồ sơ khách thuê</h3>
              </div>
              {selectedProposalId && (
                <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Gắn mã BDL: {selectedProposalId}
                </span>
              )}
            </div>

            {/* Invalidation Alert */}
            {isDataModifiedAfterCheck && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  CẢNH BÁO: Dữ liệu đã thay đổi sau khi xác minh! </div>
                <p className="text-[11px]">
                  Lưu ý: Khi có bất kỳ sửa đổi nào, bạn phải kiểm tra đối chiếu lại trước khi lưu. Bạn phải kiểm tra lại trước khi được phép ghi vào hồ sơ. </p>
                <button
                  type="button"
                  onClick={handleSendToReverify}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs cursor-pointer"
                >
                  Gửi đối chiếu lại </button>
              </div>
            )}

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên khách thuê (Chỉ đọc)</label>
                <input
                  type="text"
                  value={fullName}
                  disabled
                  className="w-full p-2 border border-slate-200 bg-slate-100 text-slate-600 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số định danh CCCD</label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => handleFieldChange('idNumber', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quê quán / Địa chỉ thường trú</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Ghi chú cập nhật</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                Hồ sơ mới sẽ được lưu kèm phiên bản và ghi nhật ký trước/sau. </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentTenant) {
                      setPhoneNumber(currentTenant.phoneNumber);
                      setIdNumber(currentTenant.idNumber || '');
                      setAddress(currentTenant.address || '');
                      setIsDataModifiedAfterCheck(false);
                    }
                  }}
                  className="px-3 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Hủy sửa </button>
                <button
                  type="button"
                  disabled={isDataModifiedAfterCheck}
                  onClick={handleSaveUpdate}
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-lg shadow-xs cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  Lưu thay đổi </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Tenant } from '../../../types';
import {
  Search, UserPlus, AlertCircle, CheckCircle2, ShieldAlert,
  FileText, Link2, Plus, X, ArrowRight, UserCheck, Clock, Check
} from 'lucide-react';

interface HSKT01Props {
  highlightedTenantId?: string;
  onNavigateToTab: (tab: 'tenants' | 'co_tenants' | 'verify' | 'update' | 'history') => void;
  onSelectTenantForUpdate?: (tenantId: string) => void;
  onSelectTenant?: (tenantId: string) => void;
}

export const HSKT01RegisterTenant: React.FC<HSKT01Props> = ({ onNavigateToTab, onSelectTenantForUpdate, onSelectTenant, highlightedTenantId }) => {
  const {
    tenants,
    addTenantHSKT01,
    pendingDocs,
    addPendingReceptionDocHSKT01,
    updatePendingReceptionDocStatus,
    receptionRequests,
    linkReceptionRequestHSKT01
  } = useApp();

  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);
  useEffect(() => {
    if (highlightedTenantId) highlightedRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedTenantId]);

  // Search Step (Bước 1 & 2 /, 02)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDone, setSearchDone] = useState(false);
  const [searchedResults, setSearchedResults] = useState<{
    exactMatches: Tenant[];
    suspectMatches: Tenant[];
  }>({ exactMatches: [], suspectMatches: [] });

  // Form State (Bước 3 & 4)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [paperStatus, setPaperStatus] = useState<'Đã cung cấp' | 'Chưa cung cấp'>('Đã cung cấp');
  const [verificationStatus, setVerificationStatus] = useState<'Chưa xác minh' | 'Đã xác minh hợp lệ' | 'Không hợp lệ'>('Chưa xác minh');
  const [evidencePaperDescription, setEvidencePaperDescription] = useState('');
  const [verificationReason, setVerificationReason] = useState('');
  const [selectedRequestCode, setSelectedRequestCode] = useState('');
  const [notes, setNotes] = useState('');

  // Check Result State (Bước 5)
  const [checkResult, setCheckResult] = useState<{
    checked: boolean;
    valid: boolean;
    isPreliminary: boolean;
    messages: string[];
    warnings: string[];
  }>({ checked: false, valid: false, isPreliminary: false, messages: [], warnings: [] });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Pending Doc Modal (giấy tờ nhận phòng / )
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [docTenantId, setDocTenantId] = useState(tenants[0]?.id || '');
  const [docType, setDocType] = useState('CCCD gắn chip (Bản gốc)');
  const [docNumber, setDocNumber] = useState('');
  const [docSource, setDocSource] = useState('Tiếp nhận trực tiếp');
  const [docNotes, setDocNotes] = useState('');

  // Search Action
  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchedResults({ exactMatches: [], suspectMatches: [] });
      setSearchDone(true);
      return;
    }

    // Exact ID match is strong duplicate
    const exact = tenants.filter(t => t.idNumber && t.idNumber.toLowerCase() === q);

    // Suspect duplicates: same name or phone
    const suspect = tenants.filter(t =>
      (!exact.some(e => e.id === t.id)) &&
      (t.fullName.toLowerCase().includes(q) || t.phoneNumber.includes(q))
    );

    setSearchedResults({ exactMatches: exact, suspectMatches: suspect });
    setSearchDone(true);
  };

  // Open Create Form
  const handleOpenCreateForm = (prefillReason?: string, prefillPhone?: string, prefillName?: string) => {
    setFullName(prefillName || searchQuery);
    setPhoneNumber(prefillPhone || '');
    setIdNumber('');
    setAddress('');
    setPaperStatus('Đã cung cấp');
    setVerificationStatus('Chưa xác minh');
    setEvidencePaperDescription('');
    setVerificationReason(prefillReason || '');
    setSelectedRequestCode('');
    setNotes('');
    setCheckResult({ checked: false, valid: false, isPreliminary: false, messages: [], warnings: [] });
    setFormError(null);
    setFormSuccess(null);
    setShowCreateModal(true);
  };

  // Check Preliminary Data (Bước 5 /,, )
  const handleCheckPreliminaryData = () => {
    setFormError(null);
    const messages: string[] = [];
    const warnings: string[] = [];
    let valid = true;
    let isPreliminary = false;

    if (!fullName.trim()) {
      messages.push('Họ tên khách thuê bắt buộc phải nhập.');
      valid = false;
    }

    const trimmedPhone = phoneNumber.trim();
    const trimmedId = idNumber.trim();

    if (!trimmedPhone && !trimmedId) {
      messages.push('Bắt buộc phải có ít nhất Số điện thoại hoặc Số định danh (CCCD) để đối chiếu.');
      valid = false;
    }

    if (trimmedPhone && !/^(0[2-9][0-9]{8})$/.test(trimmedPhone)) {
      messages.push('Số điện thoại không hợp lệ (phải gồm 10 chữ số bắt đầu bằng 0).');
      valid = false;
    }

    if (trimmedId) {
      const matchExisting = tenants.find(t => t.idNumber && t.idNumber.toLowerCase() === trimmedId.toLowerCase());
      if (matchExisting) {
        messages.push(`Số định danh trùng với hồ sơ hiện có "${matchExisting.fullName}" (${matchExisting.id}). Không được tạo trùng.`);
        valid = false;
      }
    }

    // Check suspect duplicates
    const suspects = tenants.filter(t =>
      (trimmedPhone && t.phoneNumber === trimmedPhone) ||
      (t.fullName.toLowerCase() === fullName.trim().toLowerCase())
    );

    if (suspects.length > 0) {
      if (!verificationReason.trim()) {
        messages.push(`Phát hiện nghi trùng (${suspects.map(s => s.fullName).join(', ')}). Bắt buộc nhập Căn cứ phân biệt hai người.`);
        valid = false;
      } else {
        warnings.push(`Đã ghi nhận căn cứ phân biệt nghi trùng: "${verificationReason.trim()}".`);
      }
    }

    // Tách tình trạng cung cấp khỏi kết quả xác minh
    if (paperStatus === 'Chưa cung cấp') {
      isPreliminary = true;
      warnings.push('Khách chưa cung cấp giấy tờ -> Tạo Hồ sơ sơ bộ, trạng thái "Chưa xác minh". Tuyệt đối không sinh số giả.');
    } else if (verificationStatus === 'Không hợp lệ') {
      if (trimmedPhone) {
        isPreliminary = true;
        warnings.push('Giấy tờ Không hợp lệ nhưng Tên + SĐT hợp lệ -> Cho phép tạo Hồ sơ sơ bộ kèm cảnh báo. KHÔNG được dùng để ký hợp đồng.');
      } else {
        messages.push('Giấy tờ Không hợp lệ và thiếu SĐT hợp lệ thay thế. Không đủ ngưỡng tạo hồ sơ sơ bộ.');
        valid = false;
      }
    } else if (verificationStatus === 'Đã xác minh hợp lệ') {
      if (!evidencePaperDescription.trim() && !trimmedId) {
        warnings.push('Lưu ý: Đánh dấu "Đã xác minh hợp lệ" cần kèm số giấy tờ hoặc mô tả căn cứ đối chiếu.');
      }
    }

    setCheckResult({
      checked: true,
      valid,
      isPreliminary,
      messages,
      warnings
    });
  };

  // Submit Create (Bước 6)
  const handleConfirmCreate = () => {
    setFormError(null);
    setFormSuccess(null);

    const res = addTenantHSKT01({
      fullName,
      phoneNumber,
      idNumber: idNumber.trim() || undefined,
      address: address.trim() || undefined,
      paperStatus,
      verificationStatus: paperStatus === 'Chưa cung cấp' ? 'Chưa xác minh': verificationStatus,
      evidencePaperDescription: evidencePaperDescription.trim() || undefined,
      verificationReason: verificationReason.trim() || undefined,
      requestAdmissionCode: selectedRequestCode || undefined,
      notes: notes.trim() || undefined
    });

    if (!res.success) {
      setFormError(res.message);
    } else {
      setFormSuccess(res.message);
      setTimeout(() => {
        setShowCreateModal(false);
        setSearchDone(false);
        setSearchQuery('');
      }, 1500);
    }
  };

  // Add Pending Reception Doc
  const handleAddPendingDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetTenant = tenants.find(t => t.id === docTenantId);
    if (!targetTenant) return;

    addPendingReceptionDocHSKT01({
      tenantId: docTenantId,
      tenantName: targetTenant.fullName,
      docType,
      docNumber: docNumber.trim() || undefined,
      source: docSource,
      receivedDate: new Date().toISOString().split('T')[0],
      recordedBy: 'Quản lý (User)',
      status: 'Chờ nhận phòng',
      notes: docNotes.trim() || undefined
    });

    setShowAddDocModal(false);
    setDocNumber('');
    setDocNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Workflow Trace Header */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              
              <h2 className="text-base font-bold text-blue-950">Ghi nhận hồ sơ khách thuê</h2>
            </div>
            <p className="text-xs text-blue-800 mt-1">
              Lưu ý: Bắt buộc tra cứu khách trước khi tạo mới. Tách biệt Tình trạng cung cấp giấy tờ và Kết quả xác minh. Kiểm tra hồ sơ sơ bộ, không tự tạo mã lần thuê và không thay thế đối chiếu giấy tờ trước khi khách ký. </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenCreateForm()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Tạo hồ sơ mới </button>
            <button
              onClick={() => setShowAddDocModal(true)}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              Tiếp nhận giấy tờ chờ </button>
          </div>
        </div>
      </div>

      {/* Step 1 & 2: Tra cứu khách */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800"> Tra cứu & Đối chiếu hồ sơ khách</h3>
          </div>
          <span className="text-[11px] text-slate-500">Tra cứu theo CCCD, Số điện thoại hoặc Họ tên</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Nhập số CCCD/định danh, số điện thoại hoặc họ tên..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            Tra cứu </button>
          {searchDone && (
            <button
              onClick={() => { setSearchQuery(''); setSearchDone(false); setSearchedResults({ exactMatches: [], suspectMatches: [] }); }}
              className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs rounded-lg cursor-pointer"
            >
              Đặt lại </button>
          )}
        </div>

        {/* Search Results Display */}
        {searchDone && (
          <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
            {/* Case 1: Exact Duplicate */}
            {searchedResults.exactMatches.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 font-bold text-xs mb-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Phát hiện khách đã tồn tại (Khớp số định danh CCCD -) </div>
                <p className="text-[11px] text-red-700 mb-2">
                  Lưu ý: Không tạo lại hồ sơ cho khách cũ. Sử dụng hồ sơ hiện có và chỉ cập nhật thông tin khi cần. </p>
                {searchedResults.exactMatches.map(t => (
                  <div key={t.id} className="p-2.5 bg-white border border-red-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">{t.fullName}</span>
                      <span className="text-slate-500 ml-2">Mã: {t.id}</span>
                      <span className="text-slate-600 ml-2">SĐT: {t.phoneNumber}</span>
                      <span className="font-mono text-red-700 ml-2 font-semibold">CCCD: {t.idNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectTenantForUpdate?.(t.id);
                          onNavigateToTab('update');
                        }}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold rounded cursor-pointer"
                      >
                        Mở hồ sơ cũ </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Case 2: Suspect Duplicates */}
            {searchedResults.suspectMatches.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Danh sách nghi trùng (Trùng Họ tên hoặc Số điện thoại - ) </div>
                <p className="text-[11px] text-amber-800 mb-2">
                  Lưu ý: Trùng tên hoặc SĐT chỉ là nghi trùng, không tự kết luận cùng người. Nếu xác định khác người, cần nhập căn cứ phân biệt để tạo mới. </p>
                <div className="space-y-2">
                  {searchedResults.suspectMatches.map(t => (
                    <div key={t.id} className="p-2.5 bg-white border border-amber-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xs">
                        <span className="font-bold text-slate-900">{t.fullName}</span>
                        <span className="text-slate-500 ml-2">Mã: {t.id}</span>
                        <span className="text-slate-600 ml-2">SĐT: {t.phoneNumber}</span>
                        <span className="text-slate-600 ml-2">CCCD: {t.idNumber || 'Chưa cung cấp'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onSelectTenantForUpdate?.(t.id);
                            onNavigateToTab('update');
                          }}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-medium rounded cursor-pointer"
                        >
                          Mở hồ sơ cũ </button>
                        <button
                          onClick={() => handleOpenCreateForm(`Khác người với ${t.fullName} (${t.id}) do khác nơi cư trú và số CCCD`)}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium rounded cursor-pointer"
                        >
                          Xác nhận khác người </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Case 3: No duplicate found */}
            {searchedResults.exactMatches.length === 0 && searchedResults.suspectMatches.length === 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-900 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Không tìm thấy hồ sơ trùng khớp. Bạn có thể tiến hành tạo hồ sơ khách thuê mới. </div>
                <button
                  onClick={() => handleOpenCreateForm()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded cursor-pointer shrink-0"
                >
                  Tiếp tục tạo mới </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid: 1. Danh sách hồ sơ khách hiện có + 2. Giấy tờ chờ nhận phòng + 3. Yêu cầu tiếp nhận */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Tenant Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Danh sách hồ sơ khách thuê ({tenants.length})</h3>
              </div>
              {highlightedTenantId && <span className="rounded-lg bg-blue-100 border border-blue-300 px-3 py-1.5 text-xs font-bold text-blue-800">Hồ sơ được mở từ Quản lý phòng đang được đánh dấu xanh</span>}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Mã hồ sơ</th>
                    <th className="py-2.5 px-3">Họ và tên</th>
                    <th className="py-2.5 px-3">SĐT & CCCD</th>
                    <th className="py-2.5 px-3">Giấy tờ & Xác minh</th>
                    <th className="py-2.5 px-3">Mã yêu cầu</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map(t => (
                    <tr
                      key={t.id}
                      ref={t.id === highlightedTenantId ? highlightedRowRef : undefined}
                      aria-selected={t.id === highlightedTenantId}
                      className={`transition-colors ${t.id === highlightedTenantId ? 'bg-blue-100 ring-2 ring-inset ring-blue-500 font-bold' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{t.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <div>{t.fullName}</div>
                        {t.isPreliminary && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded font-medium">
                            Hồ sơ sơ bộ </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div>{t.phoneNumber}</div>
                        <div className="font-mono text-[11px] text-slate-500">{t.idNumber || 'Chưa có CCCD'}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium w-fit ${t.paperStatus === 'Đã cung cấp' ? 'bg-slate-100 text-slate-700': 'bg-red-50 text-red-700'}`}>
                            {t.paperStatus}
                          </span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold w-fit ${
                            t.verificationStatus === 'Đã xác minh hợp lệ' ? 'bg-emerald-100 text-emerald-800':
                            t.verificationStatus === 'Không hợp lệ' ? 'bg-red-100 text-red-800':
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {t.verificationStatus}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {t.requestAdmissionCode ? (
                          <span className="font-mono text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                            {t.requestAdmissionCode}
                          </span>
                        ): (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectTenant?.(t.id)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium"
                          >
                            Xem chi tiết </button>
                          <button
                            onClick={() => {
                              onSelectTenantForUpdate?.(t.id);
                              onNavigateToTab('update');
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                            title="Cập nhật hồ sơ"
                          >
                            Cập nhật </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Panel: Giấy tờ chờ nhận phòng & Yêu cầu tiếp nhận */}
        <div className="space-y-4">
          {/* Quản lý giấy tờ chờ nhận phòng */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-800">Giấy tờ chờ nhận phòng</h3>
              </div>
              <button
                onClick={() => setShowAddDocModal(true)}
                className="p-1 hover:bg-slate-100 text-blue-600 rounded cursor-pointer"
                title="Tiếp nhận giấy tờ chờ"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Lưu giấy tờ khách mới/cũ ở trạng thái "Chờ nhận phòng" để đối chiếu ở 3.10b; không tự xác nhận khách đã nhận phòng. </p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {pendingDocs.map(d => (
                <div key={d.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{d.tenantName}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                      d.status === 'Chờ nhận phòng' ? 'bg-amber-100 text-amber-800': 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">{d.docType} {d.docNumber ? `(${d.docNumber})`: ''}</div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Nguồn: {d.source}</span>
                    <span>{d.receivedDate}</span>
                  </div>
                  {d.status === 'Chờ nhận phòng' && (
                    <button
                      onClick={() => updatePendingReceptionDocStatus(d.id, 'Đã đối chiếu tại 3.10b')}
                      className="mt-1 text-[10px] text-blue-600 hover:underline cursor-pointer font-medium"
                    >
                      Đối chiếu tại 3.10b </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Yêu cầu tiếp nhận nguồn  */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800">Yêu cầu tiếp nhận nguồn </h3>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold"></span>
            </div>
            <p className="text-[11px] text-slate-500">
              Mã yêu cầu do bước tiếp nhận cấp trước; hệ thống liên kết với đúng hồ sơ đã xác minh. </p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {receptionRequests.map(r => (
                <div key={r.requestCode} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-indigo-700">{r.requestCode}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                      r.status === 'Đã gắn hồ sơ' ? 'bg-emerald-100 text-emerald-800': 'bg-slate-200 text-slate-700'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-800 font-medium">{r.prospectiveTenantName} - {r.prospectivePhone}</div>
                  <div className="text-[10px] text-slate-500">Phòng dự kiến: <span className="font-bold text-slate-700">{r.roomCode}</span></div>
                  {r.status === 'Chờ gắn hồ sơ' && (
                    <div className="pt-1 flex items-center gap-1">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            linkReceptionRequestHSKT01(r.requestCode, e.target.value);
                          }
                        }}
                        defaultValue=""
                        className="w-full text-[11px] p-1 border border-indigo-200 rounded bg-white text-indigo-900"
                      >
                        <option value="" disabled>-- Chọn hồ sơ để gắn --</option>
                        {tenants.map(t => (
                          <option key={t.id} value={t.id}>{t.fullName} ({t.id})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Ghi nhận hồ sơ khách mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  Biểu mẫu ghi nhận hồ sơ khách mới </h3>
                <span className="text-[11px] text-slate-300">Tách biệt Tình trạng cung cấp & Kết quả xác minh giấy tờ</span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {formSuccess}
                </div>
              )}

              {/* Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên khách thuê <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0912345678 (10 số)"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số định danh CCCD/CMND (nếu có) </label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="001099014562"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Quê quán / Địa chỉ thường trú </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Huyện, Tỉnh..."
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tình trạng cung cấp vs Kết quả xác minh */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>Quy định xác thực giấy tờ</span>
                  <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                    Không coi đã nhập số là đã xác minh </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tình trạng cung cấp giấy tờ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={paperStatus}
                      onChange={(e) => {
                        const val = e.target.value as 'Đã cung cấp' | 'Chưa cung cấp';
                        setPaperStatus(val);
                        if (val === 'Chưa cung cấp') {
                          setVerificationStatus('Chưa xác minh');
                        }
                      }}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Đã cung cấp">Đã cung cấp giấy tờ</option>
                      <option value="Chưa cung cấp">Chưa cung cấp (Hồ sơ sơ bộ - )</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kết quả xác minh định danh <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={verificationStatus}
                      disabled={paperStatus === 'Chưa cung cấp'}
                      onChange={(e) => setVerificationStatus(e.target.value as any)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="Chưa xác minh">Chưa xác minh</option>
                      <option value="Đã xác minh hợp lệ">Đã xác minh hợp lệ</option>
                      <option value="Không hợp lệ">Không hợp lệ (Cảnh báo )</option>
                    </select>
                  </div>
                </div>

                {paperStatus === 'Chưa cung cấp' && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                    <strong></strong> Khách chưa cung cấp giấy tờ. Hệ thống ghi "Chưa xác minh" và tuyệt đối không tạo số giả. </div>
                )}

                {paperStatus === 'Đã cung cấp' && verificationStatus === 'Không hợp lệ' && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-800">
                    <strong>CẢNH BÁO </strong> Giấy tờ đối chiếu Không hợp lệ. Chỉ cho phép lưu Hồ sơ sơ bộ nếu Họ tên và SĐT hợp lệ. KHÔNG được dùng giấy tờ này để xác minh/ký hợp đồng! </div>
                )}

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Mô tả tài liệu đối chiếu / chứng cứ đã tiếp nhận </label>
                  <input
                    type="text"
                    value={evidencePaperDescription}
                    onChange={(e) => setEvidencePaperDescription(e.target.value)}
                    placeholder="Vd: CCCD bản gốc đối chiếu trực tiếp, ảnh chụp mặt trước/sau..."
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Nghi trùng & Mã yêu cầu tiếp nhận */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Căn cứ phân biệt nghi trùng </label>
                  <input
                    type="text"
                    value={verificationReason}
                    onChange={(e) => setVerificationReason(e.target.value)}
                    placeholder="Bắt buộc nếu trùng tên hoặc SĐT với khách cũ..."
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gắn mã yêu cầu tiếp nhận </label>
                  <select
                    value={selectedRequestCode}
                    onChange={(e) => setSelectedRequestCode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    <option value="">-- Không gắn mã yêu cầu --</option>
                    {receptionRequests.filter(r => r.status === 'Chờ gắn hồ sơ').map(r => (
                      <option key={r.requestCode} value={r.requestCode}>
                        {r.requestCode} ({r.prospectiveTenantName} - {r.roomCode}) </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Ghi chú thêm</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú về nhu cầu phòng, nguồn giới thiệu..."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Check Result Display (Bước 5) */}
              {checkResult.checked && (
                <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                  !checkResult.valid ? 'bg-red-50 border-red-200 text-red-900':
                  checkResult.isPreliminary ? 'bg-amber-50 border-amber-200 text-amber-900':
                  'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {!checkResult.valid ? <AlertCircle className="w-4 h-4 text-red-600" />: <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    Kết quả kiểm tra dữ liệu sơ bộ: </div>
                  {checkResult.messages.map((m, idx) => (
                    <div key={idx} className="text-[11px] font-medium text-red-700">• {m}</div>
                  ))}
                  {checkResult.warnings.map((w, idx) => (
                    <div key={idx} className="text-[11px] font-medium text-amber-800">• {w}</div>
                  ))}
                  {checkResult.valid && checkResult.messages.length === 0 && (
                    <div className="text-[11px] text-emerald-700">Dữ liệu hợp lệ, sẵn sàng tạo hồ sơ!</div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                Nút "Kiểm tra" chỉ rà soát định dạng & trùng lặp, không lưu dữ liệu. </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Hủy </button>
                <button
                  type="button"
                  onClick={handleCheckPreliminaryData}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Kiểm tra sơ bộ </button>
                <button
                  type="button"
                  onClick={handleConfirmCreate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  Xác nhận tạo hồ sơ </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tiếp nhận giấy tờ chờ nhận phòng (giấy tờ nhận phòng / ) */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Tiếp nhận giấy tờ chờ nhận phòng (giấy tờ nhận phòng) </h3>
              <button onClick={() => setShowAddDocModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPendingDocSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Khách thuê liên quan</label>
                <select
                  value={docTenantId}
                  onChange={(e) => setDocTenantId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại giấy tờ</label>
                <input
                  type="text"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="CCCD, Hộ khẩu, Giấy tạm trú..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số giấy tờ (nếu có)</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  placeholder="Số định danh..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nguồn tiếp nhận</label>
                <input
                  type="text"
                  value={docSource}
                  onChange={(e) => setDocSource(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="Trực tiếp tại văn phòng, bưu điện, online..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="Lưu ý khi bàn giao chìa khóa..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Đóng </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  Lưu giấy tờ chờ </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

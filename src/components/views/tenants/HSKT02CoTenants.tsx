import { toUserMessage } from '../../../utils/userMessages';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { CoTenant } from '../../../types';
import {
  Users, UserPlus, Clock, CheckCircle2, AlertCircle, Calendar,
  ShieldCheck, ArrowRight, X, Building2, Check, FileCheck, AlertTriangle, Link2
} from 'lucide-react';

export const HSKT02CoTenants: React.FC<{tenantId?: string}> = ({tenantId}) => {
  const {
    tenants,
    coTenants,
    rooms,
    contracts,
    addCoTenantHSKT02,
    updateCoTenantStatusHSKT02,
    updateCoTenantFieldsHSKT02,
    closeCoTenantResidencyHSKT02,
    linkConsecutiveContractCoTenantHSKT02
  } = useApp();

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Co-tenant Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [coTenantMode, setCoTenantMode] = useState<'Nháp' | 'Dự kiến' | 'Đang cư trú'>('Dự kiến');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenantId || tenants[0]?.id || '');
  const [incomingTenantName, setIncomingTenantName] = useState<string>('');
  const [selectedRoomCode, setSelectedRoomCode] = useState<string>(rooms[0]?.roomCode || '');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [relationship, setRelationship] = useState('Vợ/Chồng');
  const [expectedArrivalDate, setExpectedArrivalDate] = useState('');
  const [actualArrivalDate, setActualArrivalDate] = useState('');
  const [arrivalVerificationEvidence, setArrivalVerificationEvidence] = useState('');

  // Check state (Bước 5)
  const [checkInfo, setCheckInfo] = useState<{
    checked: boolean;
    valid: boolean;
    messages: string[];
  }>({ checked: false, valid: false, messages: [] });
  const [modalError, setModalError] = useState<string | null>(null);

  // Modal: Promote Dự kiến -> Đang cư trú
  const [promotingCoTenant, setPromotingCoTenant] = useState<CoTenant | null>(null);
  const [promoteActualDate, setPromoteActualDate] = useState(new Date().toISOString().split('T')[0]);
  const [promoteEvidence, setPromoteEvidence] = useState('Đã đối chiếu giấy tờ và đăng ký cư trú');

  // Modal: Close residency
  const [closingCoTenant, setClosingCoTenant] = useState<CoTenant | null>(null);
  const [closeDepartureDate, setCloseDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [closeReason, setCloseReason] = useState('Khách trả phòng theo bàn giao  bàn giao trả phòng');

  // Modal: Link Consecutive Contract
  const [showConsecutiveModal, setShowConsecutiveModal] = useState(false);
  const [consecutiveTenantId, setConsecutiveTenantId] = useState(tenants[0]?.id || '');
  const [newContractCode, setNewContractCode] = useState('HD-GIA-HAN-2026');

  // Modal: Edit fields during tenancy
  const [editingCoTenant, setEditingCoTenant] = useState<CoTenant | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRelationship, setEditRelationship] = useState('');
  const [editIdNumber, setEditIdNumber] = useState('');

  // Filter co-tenants
  const filteredList = coTenants.filter(c => {
    if (tenantId && c.tenantId !== tenantId) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterRoom !== 'all' && c.roomCode !== filterRoom) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = c.fullName.toLowerCase().includes(q);
      const matchId = c.idNumber && c.idNumber.toLowerCase().includes(q);
      const matchRoom = c.roomCode && c.roomCode.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchRoom) return false;
    }
    return true;
  });

  // Handle Add Validation (Bước 5)
  const handleCheckAddData = () => {
    const msgs: string[] = [];
    let valid = true;

    if (!fullName.trim()) {
      msgs.push('Họ tên người ở cùng là trường bắt buộc.');
      valid = false;
    }
    if (!relationship.trim()) {
      msgs.push('Mối quan hệ với khách chính là trường bắt buộc.');
      valid = false;
    }

    if (coTenantMode === 'Đang cư trú') {
      if (!actualArrivalDate) {
        msgs.push('Chuyển sang Đang cư trú bắt buộc phải nhập Ngày đến thực tế.');
        valid = false;
      }
      if (!arrivalVerificationEvidence.trim()) {
        msgs.push('Chuyển sang Đang cư trú bắt buộc phải có Căn cứ xác nhận (giấy tờ tạm trú/khai báo).');
        valid = false;
      }
      if (idNumber.trim()) {
        const overlap = coTenants.find(c => c.idNumber === idNumber.trim() && c.status === 'Đang cư trú');
        if (overlap) {
          msgs.push(`Trùng khoảng cư trú: Số định danh ${idNumber} đang cư trú tại phòng ${overlap.roomCode || 'khác'}.`);
          valid = false;
        }
      }
    }

    setCheckInfo({ checked: true, valid, messages: msgs });
  };

  // Submit Add Co-tenant (Bước 6)
  const handleConfirmAddSubmit = () => {
    setModalError(null);
    const assignedTenant = tenants.find(t => t.id === selectedTenantId);
    const assignedRoom = rooms.find(r => r.roomCode === selectedRoomCode);

    const res = addCoTenantHSKT02({
      tenantId: coTenantMode === 'Nháp' && !selectedTenantId ? 'DRAFT': selectedTenantId,
      incomingTenantName: coTenantMode === 'Nháp' ? incomingTenantName || 'Khách đang tiếp nhận': undefined,
      roomCode: selectedRoomCode || undefined,
      leaseId: assignedRoom?.currentLeaseId || undefined,
      contractId: assignedRoom?.currentContractId || undefined,
      fullName: fullName.trim(),
      idNumber: idNumber.trim() || undefined,
      relationship: relationship.trim(),
      status: coTenantMode,
      expectedArrivalDate: expectedArrivalDate || undefined,
      actualArrivalDate: coTenantMode === 'Đang cư trú' ? actualArrivalDate: undefined,
      arrivalVerificationEvidence: coTenantMode === 'Đang cư trú' ? arrivalVerificationEvidence.trim(): undefined
    });

    if (!res.success) {
      setModalError(res.message);
    } else {
      setShowAddModal(false);
      setFullName('');
      setIdNumber('');
      setExpectedArrivalDate('');
      setActualArrivalDate('');
      setArrivalVerificationEvidence('');
      setCheckInfo({ checked: false, valid: false, messages: [] });
    }
  };

  // Submit Promote
  const handleConfirmPromote = () => {
    if (!promotingCoTenant) return;
    const res = updateCoTenantStatusHSKT02(
      promotingCoTenant.id,
      'Đang cư trú',
      promoteActualDate,
      promoteEvidence
    );
    if (!res.success) {
      alert(toUserMessage(res.message));
    } else {
      setPromotingCoTenant(null);
    }
  };

  // Submit Close Residency
  const handleConfirmClose = () => {
    if (!closingCoTenant) return;
    const res = closeCoTenantResidencyHSKT02(
      closingCoTenant.id,
      closeDepartureDate,
      closeReason
    );
    if (!res.success) {
      alert(toUserMessage(res.message));
    } else {
      setClosingCoTenant(null);
    }
  };

  // Submit Edit
  const handleConfirmEdit = () => {
    if (!editingCoTenant) return;
    const res = updateCoTenantFieldsHSKT02(editingCoTenant.id, {
      fullName: editFullName,
      relationship: editRelationship,
      idNumber: editIdNumber || undefined
    });
    if (!res.success) {
      alert(toUserMessage(res.message));
    } else {
      setEditingCoTenant(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Trace Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              
              <h2 className="text-base font-bold text-emerald-950">Quản lý người ở cùng & cư trú</h2>
            </div>
            <p className="text-xs text-emerald-800 mt-1">
              Ghi danh sách từ 3.9 (kể cả chưa có hồ sơ chính thức). Trạng thái phân tầng: Nháp → Dự kiến → Đang cư trú → Đã kết thúc. Hợp đồng nối tiếp giữ một chuỗi cư trú liên tục, đóng cư trú theo ngày nhận lại thực tế. </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowAddModal(true);
                setCheckInfo({ checked: false, valid: false, messages: [] });
                setModalError(null);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Thêm người ở cùng </button>
            <button
              onClick={() => setShowConsecutiveModal(true)}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Link2 className="w-4 h-4 text-emerald-600" />
              Nối tiếp hợp đồng </button>
          </div>
        </div>
      </div>

      {/* Rules & Representative Banner */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Đầu mối đại diện: </span>
          Người đại diện phòng trong mỗi lần thuê là người đứng tên nhận thông báo thanh toán và làm đầu mối liên hệ với Chủ nhà. Người ở cùng chỉ ghi nhận thông tin cư trú, không phát sinh thông báo thanh toán hoặc khoản phải thu riêng. </div>
      </div>

      {/* Filters & Co-tenant List */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Danh sách người ở cùng ({filteredList.length}) </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Nháp">Nháp (3.9)</option>
              <option value="Dự kiến">Dự kiến</option>
              <option value="Đang cư trú">Đang cư trú</option>
              <option value="Đã kết thúc">Đã kết thúc</option>
            </select>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="all">Tất cả phòng</option>
              {rooms.map(r => (
                <option key={r.roomCode} value={r.roomCode}>{r.roomCode}</option>
              ))}
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên, CCCD, phòng..."
              className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white w-40"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Họ và tên</th>
                <th className="py-2.5 px-3">Quan hệ & Khách chính</th>
                <th className="py-2.5 px-3">Phòng & Lần thuê</th>
                <th className="py-2.5 px-3">Trạng thái cư trú</th>
                <th className="py-2.5 px-3">Mốc ngày cư trú</th>
                <th className="py-2.5 px-3">Đồng bộ</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map(c => {
                const parent = tenants.find(t => t.id === c.tenantId);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{c.fullName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{c.idNumber || 'Chưa có định danh'}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-800">{c.relationship}</span>
                      <div className="text-[11px] text-slate-500">
                        {parent ? `${parent.fullName} (${parent.id})`: (c.incomingTenantName || 'Chưa gắn mã khách')}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-800">{c.roomCode || 'Chưa chỉ định'}</span>
                      {c.leaseId && (
                        <div className="font-mono text-[10px] text-indigo-600 font-semibold">{c.leaseId}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        c.status === 'Đang cư trú' ? 'bg-emerald-100 text-emerald-800':
                        c.status === 'Dự kiến' ? 'bg-blue-100 text-blue-800':
                        c.status === 'Nháp' ? 'bg-slate-200 text-slate-700':
                        'bg-slate-100 text-slate-500 line-through'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-600">
                      {c.actualArrivalDate ? (
                        <div>Từ: <strong className="text-slate-800">{c.actualArrivalDate}</strong></div>
                      ): (
                        <div>Dự kiến: {c.expectedArrivalDate || 'Chưa có'}</div>
                      )}
                      {c.departureDate && (
                        <div className="text-red-700">Đến: {c.departureDate}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        c.syncStatus === 'Đã đồng bộ' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200':
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.syncStatus || 'Đã đồng bộ'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Promote to Active */}
                        {c.status === 'Dự kiến' && (
                          <button
                            onClick={() => {
                              setPromotingCoTenant(c);
                              setPromoteActualDate(new Date().toISOString().split('T')[0]);
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                            title="Xác nhận ngày đến thực tế và chuyển sang Đang cư trú"
                          >
                            Đến ở thực tế </button>
                        )}
                        {/* Close Residency */}
                        {c.status === 'Đang cư trú' && (
                          <button
                            onClick={() => {
                              setClosingCoTenant(c);
                              setCloseDepartureDate(new Date().toISOString().split('T')[0]);
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                            title="Kết thúc cư trú"
                          >
                            Kết thúc cư trú </button>
                        )}
                        {/* Edit info during tenancy */}
                        <button
                          onClick={() => {
                            setEditingCoTenant(c);
                            setEditFullName(c.fullName);
                            setEditRelationship(c.relationship);
                            setEditIdNumber(c.idNumber || '');
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium cursor-pointer"
                          title="Sửa thông tin trong kỳ thuê"
                        >
                          Sửa </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checkout trả phòng / trả phòng & History Transfer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Điều phối trả phòng thực tế trả phòng */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800">Điều phối trả phòng thực tế</h3>
          </div>
          <p className="text-[11px] text-slate-600">
            Khi bàn giao phòng hoàn tất, hệ thống đồng bộ ngày kết thúc lần thuê và kết thúc cư trú. Không suy diễn từ hạn hợp đồng. Nếu một bên chưa ghi, đánh dấu "Chờ đồng bộ". </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span>Sự kiện bàn giao trả:</span>
              <span className="font-mono font-bold text-indigo-700">BB-TR-102 (Đã xác nhận xác nhận của chủ nhà)</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Ngày nhận lại phòng thực tế:</span>
              <span className="font-bold text-slate-900">15/10/2026</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Tình trạng cập nhật hồ sơ:</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                Đã đồng bộ nhất quán </span>
            </div>
          </div>
        </div>

        {/* Box 2: Điểm kiểm soát trả phòng - Chưa nhận lại phòng */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">Kiểm soát Chưa nhận lại phòng</h3>
          </div>
          <p className="text-[11px] text-slate-600">
            Theo Phân biệt 4 trường hợp (a) kết quả nhận lại phòng Chưa nhận lại & vướng mắc -&gt; mở; (b) Đã nhận lại nhưng chờ xác nhận xác nhận của chủ nhà -&gt; không mở; (c) Lỗi nguồn -&gt; tra soát qua; (d) Khách tiếp tục bàn giao. </p>
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
            <span className="font-bold">Lưu ý: </span> Cả 4 trường hợp đều chưa ghi Trống, chưa kết thúc lần thuê hoặc cư trú; HSKT-02 giữ nguyên các bản ghi cư trú đang mở. </div>
        </div>
      </div>

      {/* Modal: Thêm người ở cùng */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Thêm người ở cùng </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 font-semibold">
                  {modalError}
                </div>
              )}

              {/* Giai đoạn ghi nhận */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Giai đoạn ghi nhận</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Nháp', 'Dự kiến', 'Đang cư trú'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setCoTenantMode(mode);
                        setCheckInfo({ checked: false, valid: false, messages: [] });
                      }}
                      className={`py-2 px-3 rounded-lg border font-semibold text-center cursor-pointer transition-colors ${
                        coTenantMode === mode
                          ? 'bg-emerald-600 text-white border-emerald-600': 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode} {mode === 'Nháp' ? '(3.9)': ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thông tin phòng & khách */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phòng dự kiến / ở</label>
                  <select
                    value={selectedRoomCode}
                    onChange={(e) => setSelectedRoomCode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {rooms.map(r => (
                      <option key={r.roomCode} value={r.roomCode}>{r.roomCode} ({r.status})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {coTenantMode === 'Nháp' ? 'Khách chính (nếu có)': 'Khách chính *'}
                  </label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {coTenantMode === 'Nháp' && <option value="">-- Chưa có mã hồ sơ chính thức --</option>}
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName} ({t.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              {coTenantMode === 'Nháp' && !selectedTenantId && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên khách đang tiếp nhận</label>
                  <input
                    type="text"
                    value={incomingTenantName}
                    onChange={(e) => setIncomingTenantName(e.target.value)}
                    placeholder="Tên khách đang tiếp nhận tại..."
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              {/* Thông tin cá nhân */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ tên người ở cùng *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Thị B"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quan hệ với khách chính *</label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="Vợ/Chồng, Con, Bạn..."
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số định danh CCCD / Giấy khai sinh</label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="CCCD hoặc Giấy khai sinh..."
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              {/* Mốc ngày & căn cứ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày đến dự kiến</label>
                  <input
                    type="date"
                    value={expectedArrivalDate}
                    onChange={(e) => setExpectedArrivalDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {coTenantMode === 'Đang cư trú' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ngày đến thực tế *</label>
                    <input
                      type="date"
                      value={actualArrivalDate}
                      onChange={(e) => setActualArrivalDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                )}
              </div>

              {coTenantMode === 'Đang cư trú' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Căn cứ xác nhận cư trú *</label>
                  <input
                    type="text"
                    value={arrivalVerificationEvidence}
                    onChange={(e) => setArrivalVerificationEvidence(e.target.value)}
                    placeholder="Khai báo tạm trú công an phường, CCCD đối chiếu trực tiếp..."
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              {/* Validation Check Feedback (Bước 5) */}
              {checkInfo.checked && (
                <div className={`p-3 rounded-lg border text-xs ${
                  checkInfo.valid ? 'bg-emerald-50 border-emerald-200 text-emerald-800': 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {checkInfo.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />: <AlertCircle className="w-4 h-4 text-red-600" />}
                    Kết quả kiểm tra giai đoạn {coTenantMode}: </div>
                  {checkInfo.messages.map((m, i) => (
                    <div key={i}>• {m}</div>
                  ))}
                  {checkInfo.valid && <div>Dữ liệu thỏa mãn điều kiện giai đoạn {coTenantMode}!</div>}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Hủy </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCheckAddData}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold"
                >
                  Kiểm tra </button>
                <button
                  type="button"
                  onClick={handleConfirmAddSubmit}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Xác nhận lưu </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Đến ở thực tế */}
      {promotingCoTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Xác nhận đến ở thực tế </h3>
              <button onClick={() => setPromotingCoTenant(null)} className="text-emerald-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Người ở cùng <strong className="text-slate-900">{promotingCoTenant.fullName}</strong> chuyển sang trạng thái <strong>Đang cư trú</strong>. Bắt buộc nhập ngày đến thực tế và căn cứ xác nhận. </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ngày đến thực tế *</label>
                <input
                  type="date"
                  value={promoteActualDate}
                  onChange={(e) => setPromoteActualDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Căn cứ xác nhận cư trú *</label>
                <input
                  type="text"
                  value={promoteEvidence}
                  onChange={(e) => setPromoteEvidence(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPromotingCoTenant(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                >
                  Hủy </button>
                <button
                  type="button"
                  onClick={handleConfirmPromote}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Xác nhận chuyển Đang cư trú </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Kết thúc cư trú */}
      {closingCoTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-red-800 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <X className="w-4 h-4" />
                Kết thúc cư trú </h3>
              <button onClick={() => setClosingCoTenant(null)} className="text-red-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Ghi nhận ngày kết thúc cư trú thực tế cho <strong className="text-slate-900">{closingCoTenant.fullName}</strong>. Không lấy ngày hết hạn hợp đồng để tự suy ngày trả phòng. </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ngày kết thúc thực tế *</label>
                <input
                  type="date"
                  value={closeDepartureDate}
                  onChange={(e) => setCloseDepartureDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý do / Căn cứ kết thúc *</label>
                <input
                  type="text"
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClosingCoTenant(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                >
                  Hủy </button>
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                >
                  Đóng cư trú </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nối tiếp hợp đồng */}
      {showConsecutiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                Nối tiếp hợp đồng không trả phòng </h3>
              <button onClick={() => setShowConsecutiveModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Gia hạn hợp đồng cùng lần thuê liên tục không tự kết thúc cư trú hoặc tạo lần thuê mới. Hệ thống giữ 1 chuỗi cư trú và cập nhật liên kết hợp đồng mới cho tất cả người đang ở. </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Khách đại diện phòng</label>
                <select
                  value={consecutiveTenantId}
                  onChange={(e) => setConsecutiveTenantId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã hợp đồng mới gia hạn</label>
                <input
                  type="text"
                  value={newContractCode}
                  onChange={(e) => setNewContractCode(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  placeholder="HD-2026-GH..."
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConsecutiveModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                >
                  Hủy </button>
                <button
                  type="button"
                  onClick={() => {
                    linkConsecutiveContractCoTenantHSKT02(consecutiveTenantId, newContractCode);
                    setShowConsecutiveModal(false);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Liên kết chuỗi cư trú </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Sửa thông tin trong kỳ thuê */}
      {editingCoTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Cập nhật thông tin người ở cùng</h3>
              <button onClick={() => setEditingCoTenant(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-500">
                Thực hiện tiêu chí điểm kiểm soát 3.12 trên dữ liệu người ở cùng. Thay đổi được lưu tại HSKT-02, không đi HSKT-04. </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mối quan hệ</label>
                <input
                  type="text"
                  value={editRelationship}
                  onChange={(e) => setEditRelationship(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số định danh</label>
                <input
                  type="text"
                  value={editIdNumber}
                  onChange={(e) => setEditIdNumber(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCoTenant(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                >
                  Hủy </button>
                <button
                  type="button"
                  onClick={handleConfirmEdit}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  Lưu thay đổi </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

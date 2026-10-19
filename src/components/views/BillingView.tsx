import { toUserMessage } from '../../utils/userMessages';
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MeterReading, PeriodBill, Room } from '../../types';
import {
  Zap, Droplets, Plus, CheckCircle2, AlertCircle, Edit, Calculator,
  Calendar, ArrowRight, ShieldAlert, History, FileText, CheckSquare, X,
  AlertTriangle, Filter, Search, Image as ImageIcon, Camera, RefreshCw,
  ExternalLink, Layers, ArrowDownRight, Eye
} from 'lucide-react';

interface BillingViewProps {
  onNavigateToNotices?: (billId: string) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ onNavigateToNotices }) => {
  const {
    rooms,
    meterReadings,
    periodBills,
    saveMeterReadingTT01,
    updateMeterReadingTT02,
    generatePeriodBillTT03,
    confirmPeriodBillTT03,
    contracts
  } = useApp();

  const [activeTab, setActiveTab] = useState<'readings' | 'bills'>('readings');

  // Filter for room list in UC-TT-01 (Điều kiện trước 2: Đang thuê, Sắp trả, hoặc Đã trả nhưng chưa chốt kỳ cuối)
  const [roomFilterTab, setRoomFilterTab] = useState<'ALL' | 'RENTING' | 'EXPIRING' | 'RETURNED_PENDING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // UC-TT-01 Reading Modal State
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [readingStage, setReadingStage] = useState<0 | 1 | 2>(0);
  const [readRoom, setReadRoom] = useState('');
  const [readPeriod, setReadPeriod] = useState(() => `Kỳ ${String(new Date().getMonth()+1).padStart(2,'0')}/${new Date().getFullYear()}`);
  const [readType, setReadType] = useState<'Theo kỳ chung' | 'Ngoài kỳ chung'>('Theo kỳ chung');
  const [readingDate, setReadingDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Meters and Readings (Bước 3)
  const [elecMeterCode, setElecMeterCode] = useState('');
  const [initElec, setInitElec] = useState<number>(0);
  const [finalElec, setFinalElec] = useState<number>(0);
  const [waterMeterCode, setWaterMeterCode] = useState('');
  const [initWater, setInitWater] = useState<number>(0);
  const [finalWater, setFinalWater] = useState<number>(0);

  // Bất thường chỉ số State (Bước 4)
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [abnormalReason, setAbnormalReason] = useState<'Nhập sai' | 'Quay vòng' | 'Thay công tơ' | 'Công tơ hỏng' | 'Khác'>('Quay vòng');
  const [verifiedElec, setVerifiedElec] = useState<number>(0);
  const [verifiedWater, setVerifiedWater] = useState<number>(0);
  const [abnormalProof, setAbnormalProof] = useState('');

  // Chốt ngoài kỳ chung date validation warning
  const [readingDateError, setReadingDateError] = useState<string | null>(null);

  // Edit reading modal (TT-02)
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReading, setSelectedReading] = useState<MeterReading | null>(null);
  const [editFinalElec, setEditFinalElec] = useState(0);
  const [editFinalWater, setEditFinalWater] = useState(0);
  const [editReason, setEditReason] = useState('');

  // Generate Bill Modal (TT-03)
  const [showGenBillModal, setShowGenBillModal] = useState(false);
  const [billRoom, setBillRoom] = useState('');
  const [billPeriod, setBillPeriod] = useState(() => `Kỳ ${String(new Date().getMonth()+1).padStart(2,'0')}/${new Date().getFullYear()}`);
  const [billConfirmError, setBillConfirmError] = useState<string | null>(null);

  // Detail Modal for Reading / Abnormal Verification
  const [inspectReading, setInspectReading] = useState<MeterReading | null>(null);

  // Available rooms complying with UC-TT-01 Pre-conditions:
  // "Có lần thuê đang hoạt động hoặc đã kết thúc nhưng chưa chốt kỳ cuối; không chỉ lọc theo trạng thái Đang thuê/Sắp trả"
  const eligibleRooms = useMemo(() => {
    return rooms.map(room => {
      const isReturnedPending = room.status === 'Trống' && room.currentLeaseId;
      return {...room,
        isReturnedPending
      };
    });
  }, [rooms]);

  const filteredEligibleRooms = useMemo(() => {
    return eligibleRooms.filter(r => {
      if (roomFilterTab === 'RENTING' && r.status !== 'Đang thuê') return false;
      if (roomFilterTab === 'EXPIRING' && r.status !== 'Sắp trả') return false;
      if (roomFilterTab === 'RETURNED_PENDING' && !r.isReturnedPending) return false;
      if (searchTerm && !r.roomCode.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [eligibleRooms, roomFilterTab, searchTerm]);

  // When selected room in modal changes, automatically fetch previous initial readings
  const handleSelectRoomForReading = (roomCode: string) => {
    setReadRoom(roomCode);
    if (!roomCode) return;
    const room = rooms.find(r => r.roomCode === roomCode);
    const prevReading = meterReadings.find(m => m.roomCode === roomCode);
    
    // Auto-fill initial readings from previous record or room standard defaults
    const prevElec = prevReading ? prevReading.finalElectricKwh : 0;
    const prevWater = prevReading ? prevReading.finalWaterM3 : 0;
    setInitElec(prevElec);
    setFinalElec(prevElec);
    setInitWater(prevWater);
    setFinalWater(prevWater);
    setElecMeterCode(prevReading?.electricMeterCode || '');
    setWaterMeterCode(prevReading?.waterMeterCode || '');

    // Check if room is returned
    if (room?.status === 'Trống') {
      setReadType('Ngoài kỳ chung');
    }
  };

  // Real-time calculation of electricity and water consumption
  const currentElecUsage = finalElec - initElec;
  const currentWaterUsage = finalWater - initWater;

  // Auto detect abnormality in real-time
  const autoElecAbnormal = currentElecUsage < 0 || currentElecUsage === 0 || currentElecUsage > 450;
  const autoWaterAbnormal = currentWaterUsage < 0 || currentWaterUsage === 0 || currentWaterUsage > 30;
  const detectedAbnormal = autoElecAbnormal || autoWaterAbnormal;

  // Step 5 in UC-TT-01: Save Readings (handles both normal save and partial/draft save)
  const handleSaveReadingSubmit = (isDraftOnly: boolean = false) => {
    setReadingDateError(null);
    if (!readRoom || !readPeriod.trim()) { setReadingDateError('Chọn đúng phòng và kỳ cần ghi chỉ số.'); return; }
    if (!elecMeterCode.trim() || !waterMeterCode.trim()) { setReadingDateError('Cần ghi đúng mã công tơ điện và nước từ hồ sơ nguồn; không được tự điền mã giả.'); return; }

    // Validation for ngoài kỳ chung
    if (readType === 'Ngoài kỳ chung') {
      const recentReading = meterReadings.find(m => m.roomCode === readRoom);
      if (recentReading && readingDate < recentReading.readingDate) {
        setReadingDateError(`Ngày chốt ngoài kỳ (${readingDate}) phải sau ngày chốt gần nhất (${recentReading.readingDate}).`);
        return;
      }
    }

    // Step 4 check: Check abnormal
    const hasAbnormal = isAbnormal || detectedAbnormal;

    // Check mandatory proof if abnormal
    if (hasAbnormal && !abnormalProof.trim() && !isDraftOnly) {
      alert('Chỉ số có dấu hiệu bất thường. Vui lòng bổ sung ảnh công tơ hoặc biên bản xác minh.');
      setIsAbnormal(true);
      return;
    }

    const room = rooms.find(r => r.roomCode === readRoom);
    const leaseId = room?.currentLeaseId;
    if (!leaseId) { setReadingDateError('Không tìm thấy mã lần thuê của phòng được chọn; cần kiểm tra hồ sơ nguồn.'); return; }

    const newReading: MeterReading = {
      id: 'mr_' + readRoom.replace(/\D/g, '') + '_' + Date.now().toString().slice(-4),
      roomCode: readRoom,
      leaseId,
      periodCode: readPeriod,
      readingType: readType,
      readingDate,
      electricMeterCode: elecMeterCode,
      initialElectricKwh: Number(initElec),
      finalElectricKwh: Number(finalElec),
      waterMeterCode: waterMeterCode,
      initialWaterM3: Number(initWater),
      finalWaterM3: Number(finalWater),
      isAbnormal: hasAbnormal,
      abnormalReason: hasAbnormal ? abnormalReason: undefined,
      verifiedElectricKwh: hasAbnormal ? Number(verifiedElec): undefined,
      verifiedWaterM3: hasAbnormal ? Number(verifiedWater): undefined,
      abnormalEvidence: hasAbnormal ? abnormalProof.trim(): undefined,
      status: isDraftOnly
        ? 'Nháp': (hasAbnormal && !abnormalProof ? 'Nháp': 'Đã xác nhận'),
      pendingVerificationFlag: hasAbnormal && (!abnormalProof || !verifiedElec),
      needsRecalculateFlag: false,
      isFinalPeriodForLease: room?.status === 'Trống'
    };

    saveMeterReadingTT01(newReading);
    setShowReadingModal(false);

    if (isDraftOnly) {
      alert('Đã lưu dở dang ở trạng thái "Nháp"! Bạn có thể quay lại điền tiếp bất kỳ lúc nào.');
    } else if (newReading.pendingVerificationFlag) {
      alert("Đã lưu chỉ số nhưng gắn cờ \"Chờ xác minh\" do có bất thường chưa đủ chứng cứ. sẽ tạm khóa xác nhận bảng tính cho phòng này.");
    } else {
      alert("Ghi nhận và lưu chỉ số điện nước thành công! Đã sẵn sàng làm nguồn tính tiền cho.");
    }
  };

  // UC-TT-02: Update reading
  const handleUpdateReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReading || !editReason.trim()) {
      alert('Lý do sửa chỉ số là trường bắt buộc.');
      return;
    }

    updateMeterReadingTT02(selectedReading.id, {
      finalElectricKwh: Number(editFinalElec),
      finalWaterM3: Number(editFinalWater)
    }, editReason.trim());

    setShowEditModal(false);
    alert('Sửa chỉ số thành công! Dòng đã chuyển sang trạng thái "Nháp – điều chỉnh", vui lòng tính lại tiền phòng.');
  };

  // UC-TT-03: Generate Bill
  const handleGenerateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billRoom || !billPeriod.trim()) { alert('Chọn phòng và kỳ tính tiền trước khi lập bảng tính.'); return; }
    const res = generatePeriodBillTT03(billRoom, billPeriod);
    if (!res.success) {
      alert(toUserMessage(res.message));
    } else {
      setShowGenBillModal(false);
      setActiveTab('bills');
      alert(toUserMessage(res.message));
    }
  };

  // UC-TT-03: Confirm Bill with Step 6 check
  const handleConfirmBillAction = (billId: string) => {
    setBillConfirmError(null);
    const res = confirmPeriodBillTT03(billId);
    if (!res.success) {
      setBillConfirmError(res.message);
      alert(toUserMessage(res.message));
    } else {
      alert(toUserMessage(res.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            
            <h1 className="text-lg font-bold text-slate-900">
              Tính tiền theo kỳ </h1>
          </div>
        </div>

        {/* 2 Tabs Segmented Control */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('readings')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'readings' ? 'bg-white text-blue-700 shadow-xs': 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-600" />
            Ghi/Sửa chỉ số </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bills' ? 'bg-white text-blue-700 shadow-xs': 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4 text-blue-600" />
            Bảng tính kỳ </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 6.1 & 6.2 GHI NHẬN & SỬA CHỈ SỐ              */}
      {/* ========================================================================= */}
      {activeTab === 'readings' && (
        <div className="space-y-4">
          {/* Business rules & Quick Info banner */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-blue-900">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-blue-700" />
                <span>Lưu ý ghi nhận chỉ số:</span>
              </div>
              <p className="text-blue-800 text-[11px]">
                Áp dụng cho phòng <strong>Đang thuê</strong>, <strong>Sắp trả phòng</strong>, và <strong>Đã trả phòng chờ chốt kỳ cuối</strong>. Tự động kiểm tra quay vòng / công tơ thay mới / sản lượng 0 bất thường. Hỗ trợ lưu nháp dở dang và chốt ngoài kỳ chung. </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  handleSelectRoomForReading('');
                  setReadingStage(0);
                  setShowReadingModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" />
                Ghi nhận chỉ số mới </button>
            </div>
          </div>

          {/* Room Filter Pills (Pre-condition 2 of UC-TT-01) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Lọc phòng: </span>
              {[
                { id: 'ALL', label: 'Tất cả phòng cần chốt' },
                { id: 'RENTING', label: 'Đang thuê' },
                { id: 'EXPIRING', label: 'Sắp trả phòng' },
                { id: 'RETURNED_PENDING', label: 'Đã trả phòng – Chờ chốt kỳ cuối' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRoomFilterTab(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    roomFilterTab === tab.id
                      ? 'bg-blue-100 text-blue-800 font-bold': 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Meter Readings Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Danh sách chỉ số đã ghi nhận </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-full font-mono text-[11px] text-slate-600 font-semibold">
                  {meterReadings.length} bản ghi </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đã xác nhận </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Nháp (Lưu dở) </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Chờ xác minh </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-3">Phòng</th>
                    <th className="py-3 px-3">Kỳ thu</th>
                    <th className="py-3 px-3">Loại chốt</th>
                    <th className="py-3 px-3">Ngày đọc</th>
                    <th className="py-3 px-3">Điện (Đầu → Cuối)</th>
                    <th className="py-3 px-3">Nước (Đầu → Cuối)</th>
                    <th className="py-3 px-3">Lượng dùng tính tiền</th>
                    <th className="py-3 px-3">Bất thường & Minh chứng</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {meterReadings.map((m) => {
                    const elecDiff = m.verifiedElectricKwh !== undefined
                      ? m.verifiedElectricKwh: Math.max(0, m.finalElectricKwh - m.initialElectricKwh);
                    const waterDiff = m.verifiedWaterM3 !== undefined
                      ? m.verifiedWaterM3: Math.max(0, m.finalWaterM3 - m.initialWaterM3);

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-slate-900 block text-xs">{m.roomCode}</span>
                          <span className="font-mono text-[10px] text-slate-400">{m.leaseId}</span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">{m.periodCode}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.readingType === 'Ngoài kỳ chung'
                              ? 'bg-purple-100 text-purple-800': 'bg-slate-100 text-slate-700'
                          }`}>
                            {m.readingType}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{m.readingDate}</td>
                        <td className="py-3 px-3 font-mono">
                          <span className="text-slate-400">{m.initialElectricKwh}</span> → <strong className="text-amber-800">{m.finalElectricKwh}</strong>
                          <span className="block text-[10px] text-slate-400">{m.electricMeterCode}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="text-slate-400">{m.initialWaterM3}</span> → <strong className="text-blue-800">{m.finalWaterM3}</strong>
                          <span className="block text-[10px] text-slate-400">{m.waterMeterCode}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          <span className="text-amber-800">{elecDiff} kWh</span> · <span className="text-blue-800">{waterDiff} m³</span>
                        </td>
                        <td className="py-3 px-3">
                          {m.isAbnormal ? (
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                ⚠ {m.abnormalReason} (Xác minh: {m.verifiedElectricKwh} kWh) </span>
                              {m.abnormalEvidence && (
                                <span className="block text-[10px] text-slate-500 truncate max-w-xs" title={m.abnormalEvidence}>
                                  📎 {m.abnormalEvidence}
                                </span>
                              )}
                            </div>
                          ): (
                            <span className="text-slate-400 text-[11px]">Bình thường</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {m.pendingVerificationFlag ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 block text-center">
                              Chờ xác minh </span>
                          ): m.status === 'Đã xác nhận' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 block text-center">
                              Đã xác nhận </span>
                          ): (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 block text-center">
                              {m.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setInspectReading(m)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReading(m);
                                setEditFinalElec(m.finalElectricKwh);
                                setEditFinalWater(m.finalWaterM3);
                                setEditReason('');
                                setShowEditModal(true);
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-medium cursor-pointer"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 6.3 BẢNG TÍNH TIỀN KỲ                                     */}
      {/* ========================================================================= */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-3">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-800">Công thức chuẩn hóa: </span>
              <strong>Tiền thuê kỳ tiếp theo (Trả trước)</strong> + <strong>Điện/nước & phí dịch vụ vừa sử dụng (Trả sau)</strong>. <span className="text-blue-800 block mt-0.5">
                * Dòng chỉ số còn cờ &quot;Chờ xác minh&quot; sẽ không được xác nhận cho đến khi hoàn tất. </span>
            </div>

            <button
              onClick={() => setShowGenBillModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              Tính tiền kỳ mới </button>
          </div>

          {billConfirmError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{billConfirmError}</span>
            </div>
          )}

          <div className="space-y-4">
            {periodBills.map((bill) => {
              const reading = meterReadings.find(m => m.roomCode === bill.roomCode && m.periodCode === bill.periodCode);
              const hasPendingReading = reading?.pendingVerificationFlag;

              return (
                <div key={bill.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-4 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">Bảng tính tiền: Phòng {bill.roomCode}</span>
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {bill.periodCode}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        bill.isConfirmed
                          ? 'bg-emerald-100 text-emerald-800': 'bg-amber-100 text-amber-800'
                      }`}>
                        {bill.isConfirmed ? 'Đã xác nhận bảng tính': 'Nháp – Chờ xác nhận'}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">Phiên bản {bill.version}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Tổng tiền kỳ:</span>
                      <span className="font-mono font-bold text-base text-blue-700">
                        {bill.totalAmount.toLocaleString('vi-VN')} đ </span>
                    </div>
                  </div>

                  {/* 2 separate periods */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Group A: Next Rent */}
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
                      <div className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                        <span className="font-bold text-blue-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                          Nhóm 1: Tiền thuê kỳ tiếp theo (Trả trước) </span>
                        <span className="font-mono font-bold text-blue-900">
                          {bill.isRentPeriodEnded ? '0 đ': `${bill.nextMonthRentAmount.toLocaleString('vi-VN')} đ`}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Khoảng thời gian:</span>
                        <span className="font-mono font-medium">{bill.nextRentPeriodFrom} → {bill.nextRentPeriodTo}</span>
                      </div>
                      {bill.isRentPeriodEnded && (
                        <div className="p-2 bg-purple-50 text-purple-800 rounded-lg text-[11px] border border-purple-200">
                          Phòng đã nhận lại thực tế, đã ngừng sinh tiền thuê kỳ tiếp theo. </div>
                      )}
                    </div>

                    {/* Group B: Services */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">2</span>
                          Nhóm 2: Điện, nước & dịch vụ vừa dùng (Trả sau) </span>
                        <span className="font-mono font-bold text-slate-800">
                          {(bill.totalAmount - (bill.isRentPeriodEnded ? 0: bill.nextMonthRentAmount)).toLocaleString('vi-VN')} đ </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Kỳ sử dụng dịch vụ:</span>
                        <span className="font-mono">{bill.servicePeriodFrom} → {bill.servicePeriodTo}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Điện năng tiêu thụ ({bill.electricityUsage} kWh × {bill.electricityRate} đ):</span>
                        <span className="font-mono font-bold text-amber-800">{bill.electricityAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Nước sinh hoạt ({bill.waterUsage} m³ × {bill.waterRate} đ):</span>
                        <span className="font-mono font-bold text-blue-800">{bill.waterAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-600">
                        <span>Tổng phí dịch vụ chung ({bill.serviceFees.length} dịch vụ):</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {bill.serviceFees.reduce((s, f) => s + f.amount, 0).toLocaleString('vi-VN')} đ </span>
                      </div>
                    </div>
                  </div>

                  {/* Warning if reading is pending */}
                  {hasPendingReading && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        <strong>Cảnh báo:</strong> Chỉ số điện nước của phòng này đang gắn cờ &quot;Chờ xác minh&quot;. Bạn không thể xác nhận bảng tính cho đến khi xử lý bất thường tại tab Ghi/Sửa chỉ số. </span>
                    </div>
                  )}

                  {/* Confirm actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-slate-400 text-[11px]">
                      Vui lòng xác nhận bảng tính tiền trước khi chuyển sang đối chiếu khoản phải thu. </span>

                    <div className="flex items-center gap-2">
                      {!bill.isConfirmed ? (
                        <button
                          onClick={() => handleConfirmBillAction(bill.id)}
                          disabled={Boolean(hasPendingReading)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Xác nhận bảng tính </button>
                      ): (
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1 text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Đã xác nhận bảng tính nguồn </span>
                          {onNavigateToNotices && (
                            <button
                              onClick={() => onNavigateToNotices(bill.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                              Chuyển sang Đối chiếu khoản phải thu → </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: 6-STEP GHI NHẬN CHỈ SỐ MỚI                               */}
      {/* ========================================================================= */}
      {showReadingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  
                  <h3 className="font-bold text-slate-900 text-base">Ghi nhận chỉ số điện và nước</h3>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Chọn đúng phòng và kỳ cần ghi nhận. </p>
              </div>
              <button
                onClick={() => setShowReadingModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {readingStage === 0 && <>
            {/* Bước 1 & 2: Chọn phòng & Loại chốt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                   Chọn phòng / Lần thuê <span className="text-red-500">*</span>
                </label>
                <select
                  value={readRoom}
                  onChange={(e) => handleSelectRoomForReading(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-xs"
                >
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.roomCode}>
                      {r.roomCode} ({r.status} {r.status === 'Trống' ? '– Đã trả phòng': ''}) </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Căn cứ lần thuê: {rooms.find(r => r.roomCode === readRoom)?.currentLeaseId || 'Chưa có — cần kiểm tra'}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                   Loại chốt chỉ số <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReadType('Theo kỳ chung')}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer text-center ${
                      readType === 'Theo kỳ chung'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs': 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Theo kỳ chung </button>
                  <button
                    type="button"
                    onClick={() => setReadType('Ngoài kỳ chung')}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer text-center ${
                      readType === 'Ngoài kỳ chung'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs': 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Ngoài kỳ </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Mã kỳ:</label>
                    <input
                      type="text"
                      value={readPeriod}
                      onChange={(e) => setReadPeriod(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Ngày ghi nhận:</label>
                    <input
                      type="date"
                      value={readingDate}
                      onChange={(e) => setReadingDate(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>

                {readingDateError && (
                  <p className="text-[10px] text-red-600 mt-1 font-semibold">{readingDateError}</p>
                )}
              </div>
            </div>

              <div className="flex justify-end"><button type="button" disabled={!readRoom || !readPeriod.trim() || !readingDate} onClick={()=>setReadingStage(1)} className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold disabled:bg-slate-200 disabled:text-slate-500">Tiếp tục <ArrowRight className="inline h-4 w-4"/></button></div>
            </>}

            {readingStage === 1 && <>
            {/* Bước 3: Nhập chỉ số & Mã công tơ */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
              <span className="font-bold text-slate-800 text-xs block">
                 Nhập chỉ số & kiểm tra định dạng hợp lệ </span>

              {/* Điện */}
              <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center border-b border-amber-100 pb-1.5">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    Công tơ điện </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Sản lượng tạm tính: <strong className="text-amber-800">{currentElecUsage} kWh</strong>
                  </span>
                </div>
                <label className="block text-xs text-slate-700">Mã công tơ điện theo hồ sơ nguồn <input value={elecMeterCode} onChange={e=>setElecMeterCode(e.target.value)} placeholder="Nhập đúng mã công tơ điện" className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"/>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block mb-1">Chỉ số đầu kỳ (từ / kỳ trước):</label>
                    <input
                      type="number"
                      value={initElec}
                      onChange={(e) => setInitElec(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Chỉ số cuối kỳ <span className="text-red-500">*</span>: </label>
                    <input
                      type="number"
                      value={finalElec}
                      onChange={(e) => setFinalElec(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-amber-800"
                    />
                  </div>
                </div>
              </div>

              {/* Nước */}
              <div className="p-3 bg-white border border-blue-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center border-b border-blue-100 pb-1.5">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    Công tơ nước </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Sản lượng tạm tính: <strong className="text-blue-800">{currentWaterUsage} m³</strong>
                  </span>
                </div>
                <label className="block text-xs text-slate-700">Mã công tơ nước theo hồ sơ nguồn <input value={waterMeterCode} onChange={e=>setWaterMeterCode(e.target.value)} placeholder="Nhập đúng mã công tơ nước" className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"/>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block mb-1">Chỉ số đầu kỳ (từ / kỳ trước):</label>
                    <input
                      type="number"
                      value={initWater}
                      onChange={(e) => setInitWater(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Chỉ số cuối kỳ <span className="text-red-500">*</span>: </label>
                    <input
                      type="number"
                      value={finalWater}
                      onChange={(e) => setFinalWater(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-blue-800"
                    />
                  </div>
                </div>
              </div>
            </div>

              <div className="flex items-center justify-between gap-3"><button type="button" onClick={()=>setReadingStage(0)} className="rounded-lg border px-4 py-2 font-semibold">Quay lại</button><button type="button" disabled={!elecMeterCode.trim() || !waterMeterCode.trim() || !Number.isFinite(finalElec) || !Number.isFinite(finalWater)} onClick={()=>setReadingStage(2)} className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold disabled:bg-slate-200 disabled:text-slate-500">Tiếp tục <ArrowRight className="inline h-4 w-4"/></button></div>
            </>}

            {readingStage === 2 && <>
            {/* Bước 4: Kiểm tra bất thường & */}
            <div className={`p-4 rounded-2xl border transition-all ${
              detectedAbnormal || isAbnormal
                ? 'bg-amber-50/80 border-amber-300': 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={isAbnormal || detectedAbnormal}
                    onChange={(e) => setIsAbnormal(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span> Xử lý bất thường công tơ</span>
                </label>
                {detectedAbnormal && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 animate-pulse">
                    ⚠ Hệ thống tự động phát hiện bất thường </span>
                )}
              </div>

              {(isAbnormal || detectedAbnormal) && (
                <div className="space-y-3 pt-3 mt-3 border-t border-amber-200 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Lý do bất thường <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={abnormalReason}
                        onChange={(e) => setAbnormalReason(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                      >
                        <option value="Quay vòng">Công tơ quay vòng qua 9999 về 0</option>
                        <option value="Thay công tơ">Thay thế công tơ mới giữa kỳ</option>
                        <option value="Công tơ hỏng">Công tơ hỏng / kẹt kim số</option>
                        <option value="Nhập sai">Chỉ số kỳ trước nhập sai</option>
                        <option value="Khác">Khách vắng mặt cả tháng / Lý do khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Sản lượng sử dụng thực tế đã xác minh (kWh) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={verifiedElec}
                        onChange={(e) => setVerifiedElec(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-amber-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Chứng cứ ảnh / Biên bản xác minh công tơ (Bắt buộc ) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Camera className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={abnormalProof}
                        onChange={(e) => setAbnormalProof(e.target.value)}
                        placeholder="Nhập tên tệp ảnh (VD: anh_cong_to_101_quay_vong.jpg) hoặc link biên bản..."
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-white"
                      />
                    </div>
                    <span className="text-[10px] text-amber-800 mt-1 block">
                      * Dòng chỉ số thiếu chứng cứ sẽ bị gắn cờ &quot;Chờ xác minh&quot; và sẽ không thể xác nhận bảng tính. </span>
                  </div>
                </div>
              )}
            </div>

              <button type="button" onClick={()=>setReadingStage(1)} className="rounded-lg border px-4 py-2 font-semibold">Quay lại chỉ số</button>
            {/* Bước 5: Nút Lưu chỉ số & Lưu dở dang */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <span className="text-slate-400 text-[11px]">
                 Bạn có thể lưu nháp hoặc hoàn tất thông tin. </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowReadingModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Hủy </button>
                <button
                  type="button"
                  onClick={() => handleSaveReadingSubmit(true)}
                  className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-semibold cursor-pointer"
                  title="Giữ ở trạng thái Nháp để tiếp tục hoàn thiện sau"
                >
                  Lưu dở (Nháp - ) </button>
                <button
                  type="button"
                  onClick={() => handleSaveReadingSubmit(false)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Lưu hoàn tất </button>
              </div>
            </div>
            </>}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SỬA CHỈ SỐ TT-02                                                    */}
      {/* ========================================================================= */}
      {showEditModal && selectedReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Sửa chỉ số điện/nước </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-500 text-[11px]">
              Chỉ sửa kỳ chưa thu tiền. Sau khi sửa, bảng tính tiền tương ứng sẽ được gắn cờ &quot;Cần tính lại&quot;. </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chỉ số điện mới (kWh)</label>
                <input
                  type="number"
                  value={editFinalElec}
                  onChange={(e) => setEditFinalElec(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-amber-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chỉ số nước mới (m³)</label>
                <input
                  type="number"
                  value={editFinalWater}
                  onChange={(e) => setEditFinalWater(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-blue-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do sửa chỉ số <span className="text-red-500">*</span>
              </label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                rows={3}
                required
                placeholder="Ghi rõ lý do (nhập nhầm số, chốt lại ngày trả phòng...)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
              >
                Hủy </button>
              <button
                type="button"
                onClick={handleUpdateReading}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Lưu sửa chỉ số </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GENERATE BILL TT-03                                                */}
      {/* ========================================================================= */}
      {showGenBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Tính tiền theo kỳ </h3>
              <button
                onClick={() => setShowGenBillModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phòng cần tính tiền</label>
              <select
                value={billRoom}
                onChange={(e) => setBillRoom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
              >
                <option value="">-- Chọn phòng --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.roomCode}>{r.roomCode} ({r.status})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kỳ tính tiền</label>
              <input
                type="text"
                value={billPeriod}
                onChange={(e) => setBillPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowGenBillModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
              >
                Hủy </button>
              <button
                type="button"
                onClick={handleGenerateBill}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Tính tiền kỳ </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL READING INSPECT                                             */}
      {/* ========================================================================= */}
      {inspectReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Chi tiết chỉ số: {inspectReading.roomCode} ({inspectReading.periodCode}) </h3>
              <button
                onClick={() => setInspectReading(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Mã lần thuê:</span>
                <span className="font-mono font-semibold">{inspectReading.leaseId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Loại chốt:</span>
                <span className="font-semibold">{inspectReading.readingType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Ngày đọc:</span>
                <span className="font-mono">{inspectReading.readingDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Điện (CT: {inspectReading.electricMeterCode}):</span>
                <span className="font-mono font-bold text-amber-800">
                  {inspectReading.initialElectricKwh} → {inspectReading.finalElectricKwh} ({Math.max(0, inspectReading.finalElectricKwh - inspectReading.initialElectricKwh)} kWh) </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Nước (CT: {inspectReading.waterMeterCode}):</span>
                <span className="font-mono font-bold text-blue-800">
                  {inspectReading.initialWaterM3} → {inspectReading.finalWaterM3} ({Math.max(0, inspectReading.finalWaterM3 - inspectReading.initialWaterM3)} m³) </span>
              </div>
              {inspectReading.isAbnormal && (
                <div className="p-3 bg-amber-50 rounded-xl space-y-1 text-amber-900">
                  <div className="font-bold">Bất thường công tơ: {inspectReading.abnormalReason}</div>
                  <div>Sản lượng xác minh: <strong>{inspectReading.verifiedElectricKwh} kWh</strong> / <strong>{inspectReading.verifiedWaterM3} m³</strong></div>
                  {inspectReading.abnormalEvidence && (
                    <div className="text-[11px] text-amber-800">Minh chứng: {inspectReading.abnormalEvidence}</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setInspectReading(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
